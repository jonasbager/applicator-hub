import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { JobMatch } from './types/job-match';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required environment variables are not configured');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

interface JobSite {
  name: string;
  baseUrl: string;
  buildSearchUrl: (keywords: string, location: string) => string;
  selectors: {
    resultsList: string[];
    title: string[];
    company: string[];
    location: string[];
    link: string[];
  };
}

const jobSites: JobSite[] = [
  {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com/jobs/search',
    buildSearchUrl: (keywords, location) => 
      `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`,
    selectors: {
      resultsList: ['.jobs-search__results-list > li', '.job-search-card'],
      title: ['.base-search-card__title', '.job-card-list__title'],
      company: ['.base-search-card__subtitle', '.job-card-container__company-name'],
      location: ['.job-search-card__location', '.job-card-container__metadata-item'],
      link: ['a.base-card__full-link', 'a.job-card-list__title']
    }
  },
  {
    name: 'Indeed',
    baseUrl: 'https://www.indeed.com/jobs',
    buildSearchUrl: (keywords, location) => 
      `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`,
    selectors: {
      resultsList: ['.job_seen_beacon', '.jobsearch-ResultsList > li'],
      title: ['h2.jobTitle', '.jcs-JobTitle'],
      company: ['.companyName', '.company_location > .companyName'],
      location: ['.companyLocation', '.company_location > .companyLocation'],
      link: ['h2.jobTitle a', '.jcs-JobTitle a']
    }
  },
  {
    name: 'Monster',
    baseUrl: 'https://www.monster.com/jobs/search',
    buildSearchUrl: (keywords, location) => 
      `https://www.monster.com/jobs/search?q=${encodeURIComponent(keywords)}&where=${encodeURIComponent(location)}`,
    selectors: {
      resultsList: ['.job-search-resultsstyle__JobCardContainer', '.results-card'],
      title: ['.title-container > a', '.job-title'],
      company: ['.name', '.company'],
      location: ['.location', '.job-location'],
      link: ['.title-container > a', '.job-title > a']
    }
  },
  {
    name: 'TheHub',
    baseUrl: 'https://thehub.io/jobs',
    buildSearchUrl: (keywords, location) => 
      `https://thehub.io/jobs?q=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`,
    selectors: {
      resultsList: ['.job-card', '.job-posting-card'],
      title: ['.job-card__title', '.job-posting-card__title'],
      company: ['.job-card__company', '.job-posting-card__company'],
      location: ['.job-card__location', '.job-posting-card__location'],
      link: ['.job-card__link', '.job-posting-card__link']
    }
  },
  {
    name: 'Jobindex',
    baseUrl: 'https://www.jobindex.dk/jobsoegning',
    buildSearchUrl: (keywords, location) => 
      `https://www.jobindex.dk/jobsoegning?q=${encodeURIComponent(keywords)}&area=${encodeURIComponent(location)}`,
    selectors: {
      resultsList: ['.jobsearch-result', '.jix-toolbar-content > div'],
      title: ['.jix-toolbar-title', '.PaidJob-inner h4'],
      company: ['.jix-toolbar-company', '.PaidJob-inner .company'],
      location: ['.jix-toolbar-location', '.PaidJob-inner .area'],
      link: ['.jix-toolbar-title a', '.PaidJob-inner h4 a']
    }
  }
];

async function searchSite(browser: any, site: JobSite, keywords: string, location: string, prefLevel: string): Promise<JobMatch[]> {
  const page = await browser.newPage();
  
  try {
    // Set user agent and other headers
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Configure page settings
    await page.setDefaultNavigationTimeout(20000);
    await page.setRequestInterception(true);
    page.on('request', (req: { resourceType: () => string; abort: () => void; continue: () => void; }) => {
      if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Search the site
    try {
      console.log(`Searching ${site.name} with:`, { keywords, location });
      const searchUrl = site.buildSearchUrl(keywords, location);

      // Navigate to job search
      console.log(`Navigating to ${site.name}:`, searchUrl);
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0',
        timeout: 20000 
      });

      // Wait for job cards to load
      console.log(`Waiting for ${site.name} results to load...`);
      let resultsFound = false;
      for (const selector of site.selectors.resultsList) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          resultsFound = true;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!resultsFound) {
        console.log(`No results found on ${site.name}`);
        return [];
      }

      // Wait a bit for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract job listings
      console.log(`Extracting listings from ${site.name}...`);
      const jobs = await page.evaluate((params: { site: JobSite; prefLevel: string; keywords: string }) => {
        const { site, prefLevel, keywords } = params;
        const searchTerms = keywords.split(' ');
        let cards = null;
        for (const selector of site.selectors.resultsList) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            cards = elements;
            break;
          }
        }

        if (!cards) return [];

        return Array.from(cards).map(card => {
          let title = '', company = '', location = '', url = '';

          // Find title
          for (const selector of site.selectors.title) {
            const el = card.querySelector(selector);
            if (el?.textContent) {
              title = el.textContent.trim();
              break;
            }
          }

          // Find company
          for (const selector of site.selectors.company) {
            const el = card.querySelector(selector);
            if (el?.textContent) {
              company = el.textContent.trim();
              break;
            }
          }

          // Find location
          for (const selector of site.selectors.location) {
            const el = card.querySelector(selector);
            if (el?.textContent) {
              location = el.textContent.trim();
              break;
            }
          }

          // Find URL
          for (const selector of site.selectors.link) {
            const el = card.querySelector(selector) as HTMLAnchorElement;
            if (el?.href) {
              url = el.href;
              break;
            }
          }

          // Extract keywords from title and check if it matches search terms
          const titleLower = title.toLowerCase();
          const matches = searchTerms.some(term => titleLower.includes(term.toLowerCase()));
          if (!matches) return null;

          // Extract keywords for future reference
          const titleWords = titleLower.split(/\W+/).filter(Boolean);
          const commonWords = new Set(['and', 'or', 'the', 'in', 'at', 'for', 'to', 'of', 'with', 'by']);
          const keywords = titleWords
            .filter(word => !commonWords.has(word))
            .concat(prefLevel.toLowerCase());

          return {
            id: Math.random().toString(36).substr(2, 9),
            title: title || '',
            company: company || '',
            location: location || '',
            url: url || '',
            description: '',
            level: [prefLevel],
            keywords: Array.from(new Set(keywords)), // Remove duplicates
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            similarity: 1.0
          };
        }).filter(job => job !== null && job.title && job.company);
      }, { site, prefLevel, keywords });

      console.log(`Found ${jobs.length} jobs on ${site.name}`);
      return jobs;
    } catch (error) {
      console.error(`Error searching ${site.name}:`, error);
      return [];
    }
  } finally {
    await page.close();
  }
}

async function searchJobs(preferences: any) {
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  // Extract and validate search parameters
  const roles = preferences.roles || [];
  const skills = preferences.skills || [];
  const locations = preferences.locations || [];
  const level = preferences.level || ['Entry Level'];

  console.log('Search parameters:', {
    roles,
    skills,
    locations,
    level
  });

  // Build search keywords
  const roleKeywords = roles.filter(Boolean);
  const skillKeywords = skills.filter(Boolean);
  
  if (roleKeywords.length === 0 && skillKeywords.length === 0) {
    console.log('No search keywords found in preferences:', preferences);
    return [];
  }

  // Combine role and skill keywords for search
  const searchKeywords = [...roleKeywords, ...skillKeywords].join(' ');
  const location = locations[0] || 'Remote';

  console.log('Using search parameters:', {
    searchKeywords,
    location,
    level: level[0]
  });

  const allJobs: JobMatch[] = [];

  try {
    // Search each site sequentially
    for (const site of jobSites) {
      try {
        const jobs = await searchSite(browser, site, searchKeywords, location, preferences.level[0] || 'Entry Level');
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Error searching ${site.name}:`, error);
        // Continue with next site even if one fails
        continue;
      }
    }

    return allJobs;
  } catch (error) {
    console.error('Error searching jobs:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return [];
  } finally {
    await browser.close();
  }
}

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userId } = JSON.parse(event.body || '{}');

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Get user's preferences
    console.log('Getting preferences for user:', userId);
    const { data: preferences, error: prefError } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw new Error(`Failed to fetch preferences: ${prefError.message}`);
    }
    if (!preferences) {
      console.error('No preferences found for user:', userId);
      throw new Error('No preferences found');
    }

    console.log('Found preferences:', {
      roles: preferences.roles,
      skills: preferences.skills,
      locations: preferences.locations,
      level: preferences.level,
      raw: preferences
    });

    // Ensure arrays exist and have default values
    preferences.roles = preferences.roles || [];
    preferences.skills = preferences.skills || [];
    preferences.locations = preferences.locations || [];
    preferences.level = preferences.level || ['Entry Level'];

    // Log search parameters
    const searchKeywords = [...preferences.roles, ...preferences.skills].filter(Boolean).join(' ');
    const searchLocation = preferences.locations[0] || 'Remote';
    console.log('Search parameters:', {
      keywords: searchKeywords,
      location: searchLocation,
      level: preferences.level[0] // Use first level if multiple exist
    });

    // Validate preferences
    if (!preferences.roles?.length && !preferences.skills?.length) {
      console.log('No roles or skills found in preferences');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jobs: [],
          message: 'Please add some roles or skills to your preferences'
        }),
      };
    }

    // Search all job sites
    console.log('Starting job search with preferences:', {
      roles: preferences.roles,
      skills: preferences.skills,
      locations: preferences.locations,
      level: preferences.level[0] // Use first level if multiple exist
    });
    const jobs = await searchJobs(preferences);
    console.log(`Found ${jobs.length} total jobs`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobs: jobs,
      }),
    };

  } catch (error: unknown) {
    console.error('Error finding matching jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to find matching jobs',
        details: errorMessage,
      }),
    };
  }
};
