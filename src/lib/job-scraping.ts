import { Job, DateValue } from '../types/job';

export interface JobDetails {
  position: string;
  company: string;
  description: string;
  keywords: string[];
  url: string;
  deadline?: DateValue;
  start_date?: DateValue;
  rawHtml?: string;
}

// Build the full URL for the Netlify function
const functionPath = '/.netlify/functions/scrape-job';
const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
const SCRAPE_URL = `${baseUrl}${functionPath}`;

/**
 * Scrape job details from a URL
 * This is the only function that doesn't need auth since it's just fetching public data
 */
export async function scrapeJobDetails(url: string): Promise<JobDetails> {
  try {
    console.log('Scraping job details for URL:', url);

    const response = await fetch(SCRAPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Scraping error response:', data);
      const errorMessage = data.details || data.error || response.statusText;
      throw new Error(`Failed to fetch job details: ${errorMessage}`);
    }

    // Validate the response
    const jobDetails = data as JobDetails;
    const requiredFields = ['position', 'company', 'description', 'keywords', 'url'];
    for (const field of requiredFields) {
      if (!(field in jobDetails)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Get the raw HTML from the response
    const rawHtml = data.rawHtml || jobDetails.description;

    // Ensure deadline and start_date are properly handled
    return {
      ...jobDetails,
      deadline: jobDetails.deadline || null,
      start_date: jobDetails.start_date || null,
      rawHtml
    };
  } catch (error) {
    console.error('Error scraping job:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    } else {
      console.error('Unknown error type:', error);
      throw new Error('An unexpected error occurred while scraping the job details');
    }
  }
}
