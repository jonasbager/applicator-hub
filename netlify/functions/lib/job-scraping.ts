import axios from 'axios';

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
}

export async function scrapeJobs(keywords: string[], location: string): Promise<ScrapedJob[]> {
  console.log('Starting job scraping with:', { keywords, location });
  
  try {
    const scrapingServiceUrl = process.env.SCRAPING_SERVICE_URL || 'http://localhost:3001';
    console.log('Using scraping service URL:', scrapingServiceUrl);

    // Call our Python scraping service
    const response = await axios.post(`${scrapingServiceUrl}/scrape-jobs`, {
      keywords,
      location
    });

    if (!response.data || !Array.isArray(response.data.jobs)) {
      console.error('Invalid response from scraping service:', response.data);
      throw new Error('Invalid response from scraping service');
    }

    const jobs = response.data.jobs;
    console.log(`Found ${jobs.length} jobs from scraping service`);

    return jobs;
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
