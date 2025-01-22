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
    name: 'TheHub',
    baseUrl: 'https://thehub.io/jobs',
    buildSearchUrl: (keywords, location) => 
      `https://thehub.io/jobs?q=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&sortBy=recent`,
    selectors: {
      resultsList: ['.job-card', '.job-posting-card'],
      title: ['.job-card__title', '.job-posting-card__title'],
      company: ['.job-card__company', '.job-posting-card__company'],
      location: ['.job-card__location', '.job-posting-card__location'],
      link: ['.job-card__link', '.job-posting-card__link', 'a.job-card'],
      description: ['.job-card__description', '.job-posting-card__description']
    }
  }
];

async function searchSite(browser: any, site: JobSite, keywords: string, location: string, preferences: any): Promise<JobMatch[]> {
  console.log(`Starting search on ${site.name} with:`, { keywords, location });
  const page = await browser.newPage();
  
  try {
    // Configure page with longer timeouts
    await page.setDefaultNavigationTimeout(45000);
    await page.setDefaultTimeout(45000);
    console.log('Page configuration complete');
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set more realistic headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    // Set viewport to a common resolution
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Add additional browser features
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // Search the site with enhanced error handling
    try {
      const searchUrl = site.buildSearchUrl(keywords, location);
      console.log(`Navigating to ${site.name}:`, searchUrl);

      // Log pre-navigation state
      console.log('Current page URL:', page.url());
      console.log('Navigation starting...');
      try {
        console.log('Starting page navigation...');
        const response = await page.goto(searchUrl, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        if (!response) {
          throw new Error('No response received from page navigation');
        }

        const status = response.status();
        console.log(`Page loaded with status: ${status}`);
        
        if (status !== 200) {
          throw new Error(`Page returned status code ${status}`);
        }

        // Log response headers for debugging
        const headers = response.headers();
        console.log('Response headers:', headers);

        // Check if we got the expected content
        const content = await page.content();
        if (!content.includes('thehub.io')) {
          console.log('Unexpected page content. First 500 characters:', content.substring(0, 500));
          throw new Error('Loaded page does not appear to be TheHub');
        }

        console.log('Page loaded successfully and verified as TheHub');
      } catch (error) {
        console.error('Navigation error:', error);
        console.error('Current URL:', page.url());
        throw error;
      }

      // Wait for initial content with progress logging
      const randomDelay = 2000 + Math.random() * 3000;
      console.log(`Waiting ${Math.round(randomDelay)}ms for initial content...`);
      await new Promise(resolve => setTimeout(resolve, randomDelay));

      // Enhanced job card loading with detailed logging
      console.log(`Attempting to locate job cards using selectors:`, site.selectors.resultsList);
      let resultsFound = false;
      let lastError = null;

      for (const selector of site.selectors.resultsList) {
        try {
          console.log(`Trying selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 15000 });
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
        console.log(`No results found on ${site.name}. Page content:`, await page.content());
        console.log('Last error:', lastError);
        return [];
      }

      // Enhanced job extraction logging
      console.log(`Beginning job extraction from ${site.name}...`);
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

      console.log(`Found ${rawJobs.length} raw jobs`);

      // Enhanced job analysis with OpenAI and detailed error logging
      console.log(`Starting OpenAI analysis for ${rawJobs.length} jobs...`);
      const analyzedJobs = await Promise.all(
        rawJobs.map(async (job: RawJob, index: number) => {
          try {
            console.log(`Analyzing job ${index + 1}/${rawJobs.length}:`, {
              title: job.title,
              company: job.company
            });

            // First, analyze the job details
            const analysis = await analyzeJob(job);
            if (!analysis) {
              throw new Error('Job analysis returned null');
            }

            console.log(`Job ${index + 1} analysis result:`, {
              level: analysis.level,
              skillsCount: analysis.skills.length,
              keywordsCount: analysis.keywords.length
            });

            // Then, calculate match score with user preferences
            console.log(`Calculating match score for job ${index + 1} with preferences:`, {
              userSkills: preferences.skills?.length || 0,
              userLevel: preferences.level?.length || 0,
              userRoles: preferences.roles?.length || 0
            });

            const matchScore = await matchJobToPreferences(analysis, {
              skills: preferences.skills || [],
              level: preferences.level || [],
              roles: preferences.roles || []
            });
            console.log(`Job ${index + 1} match score:`, matchScore);

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
  console.log('Launching browser with enhanced settings...');
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--single-process',
      '--window-size=1920,1080',
      '--ignore-certificate-errors',
      '--enable-features=NetworkService',
      '--allow-running-insecure-content',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport: { width: 1920, height: 1080 },
    executablePath: await chromium.executablePath(),
    headless: true
  });
  console.log('Browser launched successfully');

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
