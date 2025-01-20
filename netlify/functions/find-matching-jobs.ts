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

async function searchLinkedInJobs(preferences: any) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    
    // Build search URL
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const keywords = [...(preferences.roles || []), ...(preferences.skills || [])].filter(Boolean).join(' ');
    const location = (preferences.locations || [])[0] || 'Remote';
    
    if (!keywords) {
      console.log('No search keywords found in preferences:', preferences);
      return [];
    }

    console.log('Searching LinkedIn with:', { keywords, location });
    const searchUrl = `${baseUrl}?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;

    // Navigate to LinkedIn jobs search with timeout
    console.log('Navigating to:', searchUrl);
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });

    // Wait for job cards to load
    console.log('Waiting for job results to load...');
    try {
      await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 });
    } catch (error) {
      console.log('No job results found or timeout waiting for results');
      return [];
    }

    // Extract job listings
    console.log('Extracting job listings...');
    const jobListings = await page.evaluate((prefLevel) => {
      const cards = document.querySelectorAll('.jobs-search__results-list > li');
      console.log('Found job cards:', cards.length);
      return Array.from(cards).map(card => {
        const titleEl = card.querySelector('.base-search-card__title');
        const companyEl = card.querySelector('.base-search-card__subtitle');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('a.base-card__full-link') as HTMLAnchorElement;

        return {
          id: Math.random().toString(36).substr(2, 9),
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          url: linkEl?.href || '',
          description: '',
          level: prefLevel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          similarity: 1.0
        };
      }).filter(job => job.title && job.company);
    }, preferences.level);

    console.log(`Found ${jobListings.length} job listings`);
    return jobListings;
  } catch (error) {
    console.error('Error searching LinkedIn:', error);
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
    const { data: preferences, error: prefError } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences) {
      throw new Error('No preferences found');
    }

    // Search for jobs on LinkedIn
    const jobs = await searchLinkedInJobs(preferences);

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
