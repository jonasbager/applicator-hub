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
});

type JobDetails = z.infer<typeof jobSchema>;

// Initialize OpenAI
const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
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
  - "keywords": An array of 5-10 key skills, technologies, or requirements
  - "url": The provided URL

  Make sure to follow the exact format specified in the instructions below:

  {format_instructions}
  
  HTML Content: {html_content}`,
  inputVariables: ['html_content'],
  partialVariables: {
    format_instructions: parser.getFormatInstructions(),
  },
});

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
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Load webpage content
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const htmlContent = docs[0].pageContent;

    // Format the prompt with the HTML content
    const prompt = await promptTemplate.format({
      html_content: htmlContent,
    });

    // Get structured output from OpenAI
    const response = await model.invoke(prompt);
    
    // Convert the response to a string
    const responseText = response.content.toString();

    console.log('OpenAI Response:', responseText);

    // Parse the response into our schema
    const parsedJob = await parser.parse(responseText);

    // Add the original URL if not present
    const jobDetails: JobDetails = {
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
    console.error('Error scraping job:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scrape job details',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
