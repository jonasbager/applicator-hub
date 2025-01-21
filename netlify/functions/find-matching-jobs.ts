import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { JobMatch } from './types/job-match';
import chromium from '@sparticuz/chromium';
import puppeteer, { HTTPRequest } from 'puppeteer-core';
import { analyzeJob, matchJobToPreferences } from './lib/openai';

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

interface RawJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
}

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
    description: string[];
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
      link: ['.job-card-container__link', '.job-card-list__title', '.base-card__full-link'],
      description: ['.job-card-container__description', '.job-description', '.description__text']
    }
  }
];

async function searchSite(browser: any, site: JobSite, keywords: string, location: string, preferences: any): Promise<JobMatch[]> {
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

      // Navigate to job search with optimized settings
      console.log(`Navigating to ${site.name}:`, searchUrl);
      try {
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
      } catch (error) {
        console.log('Navigation error:', error);
        throw error;
      }

      // Wait for initial content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for job cards to load with better error handling
      console.log(`Waiting for ${site.name} results to load...`);
      let resultsFound = false;
      let lastError = null;

      for (const selector of site.selectors.resultsList) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} results with selector: ${selector}`);
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

      // Extract and analyze job listings with OpenAI
      console.log(`Extracting and analyzing listings from ${site.name}...`);
      const rawJobs = await page.evaluate((params: { site: JobSite }) => {
        const { site } = params;
        let cards = null;
        for (const selector of site.selectors.resultsList) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            cards = elements;
            break;
          }
        }

        if (!cards) return [];

        return Array.from(cards).map((card): RawJob => {
          let title = '', company = '', location = '', url = '', description = '';

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

          // Find description
          for (const selector of site.selectors.description) {
            const el = card.querySelector(selector);
            if (el?.textContent) {
              description = el.textContent.trim();
              break;
            }
          }

          return {
            title: title || '',
            company: company || '',
            location: location || '',
            url: url || '',
            description: description || ''
          };
        }).filter(job => job.title && job.company);
      }, { site });

      // Enhanced job analysis with OpenAI
      console.log('Analyzing jobs with OpenAI...');
      const analyzedJobs = await Promise.all(
        rawJobs.map(async (job: RawJob) => {
          try {
            // First, analyze the job details
            const analysis = await analyzeJob(job);
            console.log('Job analysis:', analysis);

            // Then, calculate match score with user preferences
            const matchScore = await matchJobToPreferences(analysis, {
              skills: preferences.skills || [],
              level: preferences.level || [],
              roles: preferences.roles || []
            });
            console.log('Match score:', matchScore);

            // Calculate keyword relevance
            const keywordRelevance = analysis.keywords.filter((keyword: string) => 
              preferences.skills?.some((skill: string) => 
                skill.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(skill.toLowerCase())
              )
            ).length / Math.max(analysis.keywords.length, 1);

            // Calculate level match
            const levelMatch = preferences.level?.some((level: string) => 
              analysis.level.toLowerCase().includes(level.toLowerCase())
            ) ? 1 : 0;

            // Calculate role match
            const roleMatch = preferences.roles?.some((role: string) =>
              job.title.toLowerCase().includes(role.toLowerCase()) ||
              analysis.keywords.some((keyword: string) => 
                keyword.toLowerCase().includes(role.toLowerCase())
              )
            ) ? 1 : 0;

            // Calculate final similarity score (weighted average)
            const similarity = (
              (matchScore / 100) * 0.4 + // OpenAI match score (40%)
              keywordRelevance * 0.3 + // Keyword relevance (30%)
              levelMatch * 0.15 + // Level match (15%)
              roleMatch * 0.15 // Role match (15%)
            );

            console.log('Final similarity score:', similarity);

            return {
              id: Math.random().toString(36).substr(2, 9),
              title: job.title,
              company: job.company,
              location: job.location,
              url: job.url,
              description: job.description,
              level: [analysis.level],
              keywords: analysis.keywords,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              similarity: similarity
            };
          } catch (error) {
            console.error('Error analyzing job:', error);
            return null;
          }
        })
      );

      const validJobs = analyzedJobs.filter((job): job is JobMatch => job !== null);
      console.log(`Successfully analyzed ${validJobs.length} jobs`);
      return validJobs;
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
        const jobs = await searchSite(browser, site, searchKeywords, location, preferences);
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
