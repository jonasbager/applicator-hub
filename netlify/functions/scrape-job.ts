import { Handler } from '@netlify/functions';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // Just fetch the first job from Jobindex's front page
    const jobindexUrl = 'https://www.jobindex.dk/';
        
    console.log('Fetching Jobindex homepage...');
    const response = await axios.get(jobindexUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'da-DK,da;q=0.9'
      }
    });

    const $ = cheerio.load(response.data);
    console.log('Loaded HTML, looking for jobs...');

    // Save HTML for debugging
    console.log('Raw HTML:', response.data);

    // Try different job listing selectors
    const selectors = [
      '.PaidJob',
      '.jix_robotjob',
      '.jobsearch-result',
      '.job-posting'
    ];

    let firstJob;
    for (const selector of selectors) {
      const jobs = $(selector);
      console.log(`Found ${jobs.length} jobs with selector: ${selector}`);
      if (jobs.length > 0) {
        firstJob = jobs.first();
        console.log(`Using selector: ${selector}`);
        break;
      }
    }

    if (!firstJob) {
      throw new Error('No jobs found on page');
    }

    // Try different title selectors
    const titleSelectors = ['h3 a', 'h4 a', '.job-title a', '.position a'];
    let title = '';
    for (const selector of titleSelectors) {
      const el = firstJob.find(selector);
      if (el.length > 0) {
        title = el.text().trim();
        console.log(`Found title with selector: ${selector}`);
        break;
      }
    }

    // Try different company selectors
    const companySelectors = ['.company', '.company-name', '.employer', '.jix-toolbar-top strong'];
    let company = '';
    for (const selector of companySelectors) {
      const el = firstJob.find(selector);
      if (el.length > 0) {
        company = el.text().trim();
        console.log(`Found company with selector: ${selector}`);
        break;
      }
    }

    // Try to get URL from any link in the job card
    const url = firstJob.find('a').first().attr('href');

    // Try different description selectors
    const descriptionSelectors = ['.jobtext', '.description', '.job-description'];
    let description = '';
    for (const selector of descriptionSelectors) {
      const el = firstJob.find(selector);
      if (el.length > 0) {
        description = el.text().trim();
        console.log(`Found description with selector: ${selector}`);
        break;
      }
    }

    // If no description in job card, try to get some preview text
    if (!description) {
      description = firstJob.text().trim();
    }

    console.log('Extracted job details:', {
      title,
      company,
      url,
      descriptionLength: description?.length
    });

    console.log('Extracted job details:', { title, company, url });

    const job = {
      position: title,
      company: company,
      location: 'Denmark',
      url: url?.startsWith('http') ? url : `https://www.jobindex.dk${url}`,
      description: description,
      source: 'Jobindex',
      level: ['Entry Level'],
      keywords: ['Software'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      similarity: 1.0
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([job])
    };
  } catch (error: unknown) {
    console.error('Error scraping job:', error);
    const err = error as Error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scrape job',
        details: err.message
      })
    };
  }
};
