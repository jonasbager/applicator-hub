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

    // Find the first job listing
    const firstJob = $('.jix_robotjob').first();
    console.log('Found first job element:', firstJob.length > 0);

    if (firstJob.length === 0) {
      throw new Error('No jobs found on page');
    }

    // Extract job details
    const title = firstJob.find('h3 a').text().trim();
    const company = firstJob.find('.jix-toolbar-top strong').text().trim();
    const url = firstJob.find('h3 a').attr('href');
    const description = firstJob.find('.jobtext').text().trim();

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
