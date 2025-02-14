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
  url: z.string().url()
});

function trimContent(content: string): string {
  // Remove script and style tags content
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Remove extra whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Take first 8000 characters (roughly 2000 tokens)
  return content.slice(0, 8000);
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
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
        })
      };
    }

    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { url } = JSON.parse(event.body);
    if (!url) {
      throw new Error('Missing URL parameter');
    }

    // Load webpage content
    console.log('Loading webpage content from:', url);
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const htmlContent = trimContent(docs[0].pageContent);
    console.log('Webpage content loaded, length:', htmlContent.length);

    // Initialize OpenAI
    console.log('Initializing OpenAI...');
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY
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

      Be thorough in extracting keywords. Look through the entire content for relevant information.

      Make sure to follow the exact format specified in the instructions below:

      {format_instructions}
      
      Job Content: {html_content}`,
      inputVariables: ['html_content'],
      partialVariables: {
        format_instructions: parser.getFormatInstructions()
      }
    });

    // Format the prompt with the HTML content
    const prompt = await promptTemplate.format({
      html_content: htmlContent
    });

    console.log('Sending request to OpenAI...');
    const response = await model.invoke(prompt);
    console.log('Received response from OpenAI');

    try {
      // Parse the response into our schema
      const parsedJob = await parser.parse(response.content.toString());

      // Get the raw HTML content before trimming
      const rawHtml = docs[0].pageContent;
      console.log('Raw HTML content length:', rawHtml.length);

      // Add the original URL and raw HTML
      const jobDetails = {
        ...parsedJob,
        url: parsedJob.url || url,
        rawHtml: rawHtml // This is the untrimmed HTML content
      };

      console.log('Returning job details with HTML length:', jobDetails.rawHtml.length);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(jobDetails)
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Try to extract required fields even if parsing fails
      const responseText = response.content.toString();
      const fallbackJob = {
        position: responseText.match(/"position":\s*"([^"]+)"/)?.[1] || 'Unknown Position',
        company: responseText.match(/"company":\s*"([^"]+)"/)?.[1] || 'Unknown Company',
        description: responseText.match(/"description":\s*"([^"]+)"/)?.[1] || 'No description available',
        keywords: [],
        url: url,
        rawHtml: docs[0].pageContent // Use the full HTML content for fallback too
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallbackJob)
      };
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scrape job details',
        details: error.message
      })
    };
  }
};
