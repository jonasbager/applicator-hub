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
    const response = await axios.post('/.netlify/functions/scrape-job', {
      keywords: keywords.join(' '),
      location,
      mode: 'search' // Add mode to indicate bulk search vs single URL
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
