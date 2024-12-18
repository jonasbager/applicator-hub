import { Handler } from '@netlify/functions';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

// Job schema matching the database schema
const jobSchema = z.object({
  position: z.string(),
  company: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  url: z.string().url(),
  deadline: z.string().optional().describe('ISO date string of the application deadline, if found'),
});

function trimContent(content: string): string {
  // Remove script and style tags content
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Remove extra whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Take first 4000 characters (roughly 1000 tokens)
  return content.slice(0, 4000);
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
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is not configured');
    }

    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    console.log('Starting job scraping for URL:', url);

    // Initialize OpenAI
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });

    console.log('OpenAI model initialized');

    // Create a parser for structured output
    const parser = StructuredOutputParser.fromZodSchema(jobSchema);

    // Create a prompt template for job extraction
    const promptTemplate = new PromptTemplate({
      template: `Extract key information from the following job posting HTML content.
      Return a JSON object with these EXACT field names:
      - "position": The job position or title
      - "company": The company name
      - "description": A brief one-sentence summary
      - "keywords": An array of 5-10 key skills, technologies, or requirements
      - "url": The provided URL
      - "deadline": If found, the application deadline date in ISO format (YYYY-MM-DD). Look for phrases like "apply by", "deadline", "closing date", etc. Only include if a specific date is mentioned.

      Make sure to follow the exact format specified in the instructions below:

      {format_instructions}
      
      HTML Content: {html_content}`,
      inputVariables: ['html_content'],
      partialVariables: {
        format_instructions: parser.getFormatInstructions(),
      },
    });

    console.log('Loading webpage content...');

    // Load webpage content
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const htmlContent = trimContent(docs[0].pageContent);

    console.log('Webpage content loaded, length:', htmlContent.length);

    // Format the prompt with the HTML content
    const prompt = await promptTemplate.format({
      html_content: htmlContent,
    });

    console.log('Sending request to OpenAI...');

    // Get structured output from OpenAI
    const response = await model.invoke(prompt);
    
    // Convert the response to a string
    const responseText = response.content.toString();

    console.log('OpenAI Response:', responseText);

    // Parse the response into our schema
    const parsedJob = await parser.parse(responseText);

    // Add the original URL if not present
    const jobDetails = {
      ...parsedJob,
      url: parsedJob.url || url,
    };

    console.log('Parsed Job Details:', jobDetails);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(jobDetails),
    };
  } catch (error) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scrape job details',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};
