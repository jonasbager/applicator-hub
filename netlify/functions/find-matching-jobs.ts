import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { JobMatch } from './types/job-match';
import chromium from '@sparticuz/chromium';
import type { ElementHandle } from 'puppeteer-core';
import type { HTTPRequest } from 'puppeteer-core';
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
      `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r86400&position=1&pageNum=0`,
    selectors: {
      resultsList: ['.jobs-search-results__list-item', '.job-search-card', '.jobs-search-results-list__item'],
      title: ['.job-card-list__title', '.job-card-container__link-wrapper', '.base-card__full-link'],
      company: ['.job-card-container__primary-description', '.job-card-container__company-name', '.base-search-card__subtitle'],
      location: ['.job-card-container__metadata', '.job-card-container__metadata-item', '.job-search-card__location'],
      link: ['.job-card-container__link', '.job-card-list__title', '.base-card__full-link']
    }
  }
];

async function searchSite(browser: any, site: JobSite, keywords: string, location: string, prefLevel: string): Promise<JobMatch[]> {
  const page = await browser.newPage();
  
  try {
    // Configure page for optimal performance
    await page.setDefaultNavigationTimeout(20000);
    await page.setDefaultTimeout(20000);
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set minimal headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/122.0.0.0'
    });

    // Search the site
    try {
      console.log(`Searching ${site.name} with:`, { keywords, location });
      const searchUrl = site.buildSearchUrl(keywords, location);

      // Log detailed search parameters
      console.log('=== Job Search Details ===');
      console.log(`Site: ${site.name}`);
      console.log(`URL: ${searchUrl}`);
      console.log(`Keywords: ${keywords}`);
      console.log(`Location: ${location}`);
      console.log(`Level: ${prefLevel}`);
      console.log('=========================');
      try {
        await page.goto(searchUrl, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
      } catch (error) {
        console.log('Navigation error:', error);
        // Try again with less strict wait condition
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
      }

      // Wait for initial content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take a screenshot for debugging
      await page.screenshot({ path: `/tmp/${site.name}-page.png` }).catch(console.error);

      // Wait for job cards to load with detailed logging
      console.log('=== Selector Search ===');
      console.log('Available selectors:', site.selectors.resultsList);
      let resultsFound = false;
      let lastError = null;

      for (const selector of site.selectors.resultsList) {
        try {
          console.log(`Trying selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 10000 });
          const elements = await page.$$(selector);
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          
          if (elements.length > 0) {
            // Log the text content of the first few elements for verification
            const sampleElements = await Promise.all(elements.slice(0, 3).map(async (element: ElementHandle) => {
              const text = await page.evaluate((el: Element) => el.textContent, element);
              return text?.trim();
            }));
            console.log('Sample elements found:', sampleElements);
            
            resultsFound = true;
            break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`Selector ${selector} not found:`, errorMessage);
          lastError = error instanceof Error ? error : new Error(errorMessage);
          continue;
        }
      }

      if (!resultsFound) {
        console.log(`No results found on ${site.name}`, lastError);
        return [];
      }

      // Extract job listings with detailed logging
      console.log('=== Job Extraction ===');
      console.log('Starting job extraction process...');
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

          // Extract and normalize keywords with detailed logging
          const titleLower = title.toLowerCase();
          const companyLower = company.toLowerCase();
          const titleWords = titleLower.split(/[\s,\-\(\)]+/).filter(Boolean);
          const companyWords = companyLower.split(/[\s,\-\(\)]+/).filter(Boolean);
          const commonWords = new Set(['and', 'or', 'the', 'in', 'at', 'for', 'to', 'of', 'with', 'by', 'a', 'an']);
          const keywords = [...titleWords, ...companyWords].filter(word => !commonWords.has(word));

          console.log('=== Job Details ===');
          console.log('Title:', title);
          console.log('Company:', company);
          console.log('Location:', location);
          console.log('URL:', url);
          console.log('Extracted keywords:', keywords);

          // More flexible keyword matching with detailed logging
          console.log('=== Keyword Matching ===');
          console.log('Search terms:', searchTerms);
          
          const searchTermMatches = searchTerms.filter(term => {
            const termLower = term.toLowerCase();
            const titleMatch = titleLower.includes(termLower);
            const keywordMatch = keywords.some(keyword => keyword.includes(termLower) || termLower.includes(keyword));
            
            console.log(`Term "${term}":`, {
              titleMatch,
              keywordMatch,
              matched: titleMatch || keywordMatch
            });
            
            return titleMatch || keywordMatch;
          });

          // Include jobs with any keyword match, with weighted scoring
          const exactMatches = searchTermMatches.filter(term => 
            titleLower.includes(term.toLowerCase())
          ).length;
          const partialMatches = searchTermMatches.length - exactMatches;
          
          // Calculate weighted similarity score (0.0 to 1.0)
          const similarity = (exactMatches + partialMatches * 0.5) / searchTerms.length;

          // Add level to keywords for future reference
          keywords.push(prefLevel.toLowerCase());

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
            similarity: similarity
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
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--single-process'
    ],
    defaultViewport: { width: 800, height: 600 },
    executablePath: await chromium.executablePath(),
    headless: true
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

    // Sort jobs by similarity score in descending order
    const sortedJobs = allJobs.sort((a, b) => b.similarity - a.similarity);
    
    // Log job matches for debugging
    console.log('Job matches:', sortedJobs.map(job => ({
      title: job.title,
      similarity: job.similarity,
      keywords: job.keywords
    })));

    return sortedJobs;
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
