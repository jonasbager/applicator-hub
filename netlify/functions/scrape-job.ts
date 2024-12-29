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
  description: z.string(),
  keywords: z.array(z.string()),
  url: z.string().url(),
  deadline: z.union([z.string(), z.literal('ASAP')]).optional(),
  start_date: z.union([z.string(), z.literal('ASAP')]).optional(),
});

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

    // Try to extract company
    const companyMatch = content.match(/<a[^>]*data-tracking-control-name="public_jobs_topcard-org-name"[^>]*>([^<]+)<\/a>/);
    if (companyMatch) {
      jobDetails.push(`Company: ${companyMatch[1].trim()}`);
    }

    // Try to extract description
    const descriptionMatch = content.match(/<div[^>]*class="[^"]*show-more-less-html[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (descriptionMatch) {
      jobDetails.push(`Description: ${trimContent(descriptionMatch[1])}`);
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
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    });

    // Check for specific error types
    if (error.message?.includes('API key')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'OpenAI API Error',
          details: 'Invalid or missing API key'
        }),
      };
    }

    if (error.message?.includes('fetch')) {
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
        details: error.message,
        type: error.constructor.name
      }),
    };
  }
};
