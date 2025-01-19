import { Handler } from '@netlify/functions';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import axios from 'axios';

// Job schema matching the database schema
const jobSchema = z.object({
  position: z.string(),
  company: z.string(),
  company_url: z.string().url().optional(), // Add company website URL
  description: z.string(),
  keywords: z.array(z.string()),
  url: z.string().url(),
  deadline: z.union([z.string(), z.literal('ASAP')]).optional(),
  start_date: z.union([z.string(), z.literal('ASAP')]).optional(),
});

function extractEmailDomain(text: string): string | null {
  console.log('Extracting email domains from text:', text);
  
  // Look for email addresses in the text
  const emailRegex = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = text.match(emailRegex);
  
  if (matches) {
    console.log('Found email addresses:', matches);
    
    // Get all unique domains from email addresses
    const domains = matches
      .map(email => {
        const match = email.match(/@([^@]+)$/);
        const domain = match ? match[1] : null;
        console.log('Extracted domain from email:', email, '->', domain);
        return domain;
      })
      .filter((domain): domain is string => domain !== null);

    console.log('All extracted domains:', domains);

    if (domains.length > 0) {
      // Return the first domain that's not a common email provider
      const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
      const companyDomain = domains.find(domain => !commonProviders.includes(domain));
      console.log('Found company domain:', companyDomain);
      if (companyDomain) {
        return companyDomain;
      }
    }
  } else {
    console.log('No email addresses found in text');
  }
  
  return null;
}

function trimContent(content: string): string {
  // Remove script and style tags content
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Remove extra whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Take first 8000 characters (roughly 2000 tokens) to capture more content
  return content.slice(0, 8000);
}

async function scrapeLinkedIn(url: string): Promise<string> {
  try {
    // Extract job ID from URL
    const jobId = url.match(/(?:currentJobId=|jobs\/view\/)(\d+)/)?.[1];
    if (!jobId) {
      throw new Error('Could not extract job ID from URL');
    }

    // Convert collection URL to direct job URL
    const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;
    console.log('Converted to direct job URL:', jobUrl);

    // Use a proxy service to bypass LinkedIn's client-side rendering
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(jobUrl)}`;
    console.log('Using proxy URL:', proxyUrl);

    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    // Extract job details using more specific selectors
    const content = response.data;
    const jobDetails: string[] = [];

    // Try to extract title
    const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (titleMatch) {
      jobDetails.push(`Title: ${titleMatch[1].trim()}`);
    }

    // Try to extract company and company URL
    const companyMatch = content.match(/<a[^>]*data-tracking-control-name="public_jobs_topcard-org-name"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (companyMatch) {
      jobDetails.push(`Company: ${companyMatch[2].trim()}`);
      // Extract company website from LinkedIn company page
      if (companyMatch[1].includes('/company/')) {
        const companySlug = companyMatch[1].split('/company/')[1].split('/')[0];
        jobDetails.push(`Company URL: https://${companySlug}.com`);
      }
    }

    // Try to extract description and look for email
    const descriptionMatch = content.match(/<div[^>]*class="[^"]*show-more-less-html[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (descriptionMatch) {
      const description = trimContent(descriptionMatch[1]);
      jobDetails.push(`Description: ${description}`);
      
      // Look for company email in description
      console.log('Looking for email in LinkedIn description');
      const emailDomain = extractEmailDomain(description);
      if (emailDomain) {
        console.log('Found company email domain in LinkedIn description:', emailDomain);
        jobDetails.push(`Company URL: ${emailDomain}`);
      }
    }

    // Try to extract location
    const locationMatch = content.match(/<span[^>]*class="[^"]*job-details-jobs-unified-top-card__bullet[^"]*"[^>]*>([^<]+)<\/span>/);
    if (locationMatch) {
      jobDetails.push(`Location: ${locationMatch[1].trim()}`);
    }

    // Try to extract employment type
    const typeMatch = content.match(/<span[^>]*class="[^"]*job-details-jobs-unified-top-card__job-type[^"]*"[^>]*>([^<]+)<\/span>/);
    if (typeMatch) {
      jobDetails.push(`Employment Type: ${typeMatch[1].trim()}`);
    }

    // If no details were extracted, try using the standard scraper
    if (jobDetails.length === 0) {
      throw new Error('No job details found in response');
    }

    // Combine all extracted information
    return jobDetails.join('\n\n');
  } catch (error) {
    console.error('Error scraping LinkedIn:', error);
    // Fall back to standard scraping
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    return trimContent(docs[0].pageContent);
  }
}

async function scrapeIndeed(url: string): Promise<string> {
  try {
    // Extract job ID from URL
    const jobId = url.match(/jk=([^&]+)/)?.[1];
    if (!jobId) {
      throw new Error('Could not extract job ID from URL');
    }

    // Convert to direct job URL based on domain
    const domain = url.includes('indeed.dk') ? 'dk.indeed.com' : 'www.indeed.com';
    const jobUrl = `https://${domain}/viewjob?jk=${jobId}`;
    console.log('Converted to direct job URL:', jobUrl);

    // Use a proxy service to bypass Indeed's protections
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(jobUrl)}`;
    console.log('Using proxy URL:', proxyUrl);

    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    // Extract job details using Indeed-specific selectors
    const content = response.data;
    const jobDetails: string[] = [];

    // Try to extract title
    const titleMatch = content.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([^<]+)<\/h1>/);
    if (titleMatch) {
      jobDetails.push(`Title: ${titleMatch[1].trim()}`);
    }

    // Try to extract company and company URL
    const companyMatch = content.match(/<div[^>]*class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>([^<]+)<\/div>/);
    const companyUrlMatch = content.match(/<a[^>]*class="[^"]*jobsearch-CompanyReview-website[^"]*"[^>]*href="([^"]+)"[^>]*>/);
    if (companyMatch) {
      jobDetails.push(`Company: ${companyMatch[1].trim()}`);
      if (companyUrlMatch) {
        jobDetails.push(`Company URL: ${companyUrlMatch[1]}`);
      }
    }

    // Try to extract description and look for email
    const descriptionMatch = content.match(/<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/);
    if (descriptionMatch) {
      const description = trimContent(descriptionMatch[1]);
      jobDetails.push(`Description: ${description}`);
      
      // Look for company email in description
      console.log('Looking for email in Indeed description');
      const emailDomain = extractEmailDomain(description);
      if (emailDomain) {
        console.log('Found company email domain in Indeed description:', emailDomain);
        jobDetails.push(`Company URL: ${emailDomain}`);
      }
    }

    // Try to extract location
    const locationMatch = content.match(/<div[^>]*class="[^"]*jobsearch-JobInfoHeader-subtitle[^"]*"[^>]*>([^<]+)<\/div>/);
    if (locationMatch) {
      jobDetails.push(`Location: ${locationMatch[1].trim()}`);
    }

    // If no details were extracted, try using the standard scraper
    if (jobDetails.length === 0) {
      throw new Error('No job details found in response');
    }

    // Combine all extracted information
    return jobDetails.join('\n\n');
  } catch (error) {
    console.error('Error scraping Indeed:', error);
    // Fall back to standard scraping
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    return trimContent(docs[0].pageContent);
  }
}

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // Check OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration error',
          details: 'OpenAI API key is not configured'
        }),
      };
    }

    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Load webpage content based on URL type
    console.log('Loading webpage content from:', url);
    let htmlContent = '';
    
    if (url.includes('linkedin.com/jobs')) {
      console.log('Using LinkedIn scraper...');
      htmlContent = await scrapeLinkedIn(url);
    } else if (url.includes('indeed.com/') || url.includes('indeed.dk/')) {
      console.log('Using Indeed scraper...');
      htmlContent = await scrapeIndeed(url);
    } else {
      console.log('Using standard scraper...');
      const loader = new CheerioWebBaseLoader(url);
      const docs = await loader.load();
      htmlContent = trimContent(docs[0].pageContent);
    }
    
    console.log('Webpage content loaded, length:', htmlContent.length);

    // Initialize OpenAI with explicit configuration
    console.log('Initializing OpenAI...');
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create a parser for structured output
    const parser = StructuredOutputParser.fromZodSchema(jobSchema);

    // Create a prompt template for job extraction
    const promptTemplate = new PromptTemplate({
      template: `Extract key information from the following job posting content.
      Return a JSON object with these EXACT field names:
      - "position": The job position or title
      - "company": The company name
      - "company_url": The company's main website URL. Look for:
          * Company email addresses (e.g., @teliacompany.com) - use the email domain directly
          * Company website links in the description
          * Links to company's "About Us" or careers pages
      - "description": A brief one-sentence summary
      - "keywords": An array of 8-12 key skills, technologies, requirements, or qualifications. Look for:
          * Required skills and competencies
          * Technical requirements
          * Years of experience requirements
          * Education requirements
          * Language requirements
          * Industry knowledge
          * Management/leadership requirements
      - "url": The provided URL
      - "deadline": (Optional) The application deadline. Look for:
          * Explicit deadlines like "apply by March 20"
          * Urgency indicators like "as soon as possible", "immediately", "urgent opening" (use "ASAP")
          * If a specific date is found, use ISO format (YYYY-MM-DD)
      - "start_date": (Optional) The job start date. Look for:
          * Explicit start dates like "starting April 1"
          * Phrases like "start date", "commencement date", "position starts"
          * Immediate start indicators like "start immediately", "start ASAP" (use "ASAP")
          * If a specific date is found, use ISO format (YYYY-MM-DD)

      Be thorough in extracting keywords and dates. Look through the entire content for relevant information.

      Make sure to follow the exact format specified in the instructions below:

      {format_instructions}
      
      Job Content: {html_content}`,
      inputVariables: ['html_content'],
      partialVariables: {
        format_instructions: parser.getFormatInstructions(),
      },
    });

    // Format the prompt with the HTML content
    const prompt = await promptTemplate.format({
      html_content: htmlContent,
    });

    console.log('Sending request to OpenAI...');
    const response = await model.invoke(prompt);
    console.log('Received response from OpenAI');

    // Convert the response to a string
    const responseText = response.content.toString();
    console.log('OpenAI response:', responseText);

    try {
      // Parse the response into our schema
      const parsedJob = await parser.parse(responseText);

      // Add the original URL if not present
      const jobDetails = {
        ...parsedJob,
        url: parsedJob.url || url,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(jobDetails),
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Try to extract required fields even if parsing fails
      const fallbackJob = {
        position: responseText.match(/"position":\s*"([^"]+)"/)?.[1] || 'Unknown Position',
        company: responseText.match(/"company":\s*"([^"]+)"/)?.[1] || 'Unknown Company',
        description: responseText.match(/"description":\s*"([^"]+)"/)?.[1] || 'No description available',
        keywords: [],
        url: url,
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallbackJob),
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      type: err.constructor.name,
    });

    // Check for specific error types
    if (err.message?.includes('API key')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'OpenAI API Error',
          details: 'Invalid or missing API key'
        }),
      };
    }

    if (err.message?.includes('fetch')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Network Error',
          details: 'Failed to fetch webpage content'
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scrape job details',
        details: err.message,
        type: err.constructor.name
      }),
    };
  }
};
