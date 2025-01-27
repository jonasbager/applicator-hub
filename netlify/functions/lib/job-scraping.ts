import axios from 'axios';

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  position?: string; // Add optional position field for compatibility
}

// Type for the raw response from scrape-job function
interface ScrapeJobResponse {
  position: string;
  company: string;
  location?: string;
  url: string;
  description: string;
  source?: string;
}

export async function scrapeJobs(keywords: string[], location: string): Promise<ScrapedJob[]> {
  console.log('Starting job scraping with:', { keywords, location });
  
  try {
    // Use the Netlify function instead of Python service
    // When running in browser, use window.location.origin
    // When running in Netlify Functions, use process.env.URL
    const functionPath = '/.netlify/functions/scrape-job';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.URL || 'https://staging.applymate.app';
    // Format keywords for better search results
    // Remove any empty strings and join with AND for better matching
    const cleanedKeywords = keywords
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .join(' AND ');

    console.log('Formatted search keywords:', cleanedKeywords);
    
    const response = await axios.post(`${baseUrl}${functionPath}`, {
      keywords: cleanedKeywords,
      location,
      mode: 'search'
    });

    if (!response.data) {
      console.error('Invalid response from scraping service:', response.data);
      throw new Error('Invalid response from scraping service');
    }

    // Convert response to ScrapedJob format
    const rawJobs: ScrapeJobResponse[] = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
    console.log(`Found ${rawJobs.length} jobs`);

    return rawJobs.map(job => ({
      title: job.position || '',
      company: job.company || '',
      location: job.location || '',
      url: job.url || '',
      description: job.description || '',
      source: job.source || 'Unknown',
      position: job.position // Keep original position field
    }));
  } catch (error) {
    console.error('Error during job scraping:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}
