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
    console.log('Function started');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

    const { url } = JSON.parse(event.body || '{}');
    console.log('Received URL:', url);

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Initialize OpenAI
    console.log('Initializing OpenAI');
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });

    // Create a parser for structured output
    console.log('Creating parser');
    const parser = StructuredOutputParser.fromZodSchema(jobSchema);

    // Create a prompt template for job extraction
    console.log('Creating prompt template');
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

    // Load webpage content
    console.log('Loading webpage content');
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const htmlContent = docs[0].pageContent;
    console.log('HTML content loaded, length:', htmlContent.length);

    // Format the prompt with the HTML content
    console.log('Formatting prompt');
    const prompt = await promptTemplate.format({
      html_content: htmlContent,
    });

    // Get structured output from OpenAI
    console.log('Calling OpenAI');
    const response = await model.invoke(prompt);
    console.log('OpenAI response received');
    
    // Convert the response to a string
    const responseText = response.content.toString();
    console.log('Response text:', responseText);

    // Parse the response into our schema
    console.log('Parsing response');
    const parsedJob = await parser.parse(responseText);
    console.log('Response parsed');

    // Add the original URL if not present
    const jobDetails: JobDetails = {
      ...parsedJob,
      url: parsedJob.url || url,
    };

    console.log('Job details:', jobDetails);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(jobDetails),
    };
  } catch (error) {
    console.error('Error in function:', error);
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
