import { Handler } from '@netlify/functions';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { extractStructured, aiErrorResponse } from './lib/anthropic';

interface ScrapedJob {
  position: string;
  company: string;
  description: string;
  keywords: string[];
}

// JSON schema for guaranteed-valid structured output from Claude.
const JOB_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    position: { type: 'string', description: 'The job title / position' },
    company: { type: 'string', description: 'The hiring company name' },
    description: { type: 'string', description: 'A one-sentence summary of the role' },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description:
        '8-12 key skills, technologies, requirements, qualifications, experience levels, education, or languages mentioned in the posting',
    },
  },
  required: ['position', 'company', 'description', 'keywords'],
};

const SYSTEM_PROMPT =
  'You extract structured information from job postings. Be thorough when collecting keywords — scan the entire posting for required skills, technologies, experience and education requirements, languages, and domain knowledge.';

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000);
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration error',
          details: 'ANTHROPIC_API_KEY is not configured',
        }),
      };
    }

    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { url } = JSON.parse(event.body);
    if (!url) {
      throw new Error('Missing URL parameter');
    }

    // Fetch the job page.
    console.log('Fetching job posting from:', url);
    const { data: rawHtml } = await axios.get<string>(url, {
      timeout: 15000,
      responseType: 'text',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });

    const text = htmlToText(rawHtml);
    console.log('Extracted page text, length:', text.length);

    // Extract structured job data with Claude (guaranteed-valid JSON).
    let job: ScrapedJob;
    try {
      job = await extractStructured<ScrapedJob>({
        system: SYSTEM_PROMPT,
        content: `Extract the job details from this posting:\n\n${text}`,
        schema: JOB_SCHEMA,
        maxTokens: 1024,
      });
    } catch (aiError) {
      const { statusCode, message } = aiErrorResponse(aiError);
      console.error('AI extraction failed:', aiError);
      return {
        statusCode,
        headers,
        body: JSON.stringify({ error: 'Failed to analyze job posting', details: message }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...job,
        url,
        rawHtml,
      }),
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error details:', { name: error.name, message: error.message });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scrape job details',
        details: error.message,
      }),
    };
  }
};
