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
    // When running in Netlify Functions, we need to call the function directly
    const functionPath = '/.netlify/functions/scrape-job';
    const baseUrl = process.env.URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8888');
    
    console.log('Making request to:', `${baseUrl}${functionPath}`);
    // Format keywords for better search results
    // Remove any empty strings and join with AND for better matching
    const cleanedKeywords = keywords
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .join(' AND ');

    console.log('Formatted search keywords:', cleanedKeywords);
    
    // Add request logging
    const requestData = {
      keywords: cleanedKeywords,
      location,
      mode: 'search'
    };
    console.log('Request data:', requestData);

    const response = await axios.post(`${baseUrl}${functionPath}`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // Increase timeout to 30 seconds
    });

    // Log full response for debugging
    console.log('Scraping service response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    if (!response.data) {
      console.error('Invalid response from scraping service:', response.data);
      throw new Error('Invalid response from scraping service');
    }

    // Validate response data structure
    if (!Array.isArray(response.data) && typeof response.data !== 'object') {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected response format from scraping service');
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
