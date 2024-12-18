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

    // Load webpage content first to fail fast if URL is invalid
    console.log('Loading webpage content from:', url);
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const htmlContent = trimContent(docs[0].pageContent);
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
      template: `Extract key information from the following job posting HTML content.
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
      
      HTML Content: {html_content}`,
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
