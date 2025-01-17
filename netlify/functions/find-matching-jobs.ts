import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import axios from 'axios';
import { JobSearchResult, RecommendedJob } from './types/recommended-job';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Schema for job search results
const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  description: z.string(),
  url: z.string().url(),
  keywords: z.array(z.string()),
  level: z.array(z.string()),
});

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userId, skills, level, roles } = JSON.parse(event.body || '{}');

    if (!userId || !skills || !level || !roles) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Use GPT to generate search queries based on user's skills and preferences
    const searchPrompt = `Generate 3 specific job search queries for someone with these skills and preferences:
    Skills: ${skills.join(', ')}
    Experience Level: ${level}
    Desired Roles: ${roles.join(', ')}

    Format each query to be effective on job sites like LinkedIn and Indeed.
    Return only the queries, one per line.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: searchPrompt }],
      temperature: 0.7,
    });

    const searchQueries = completion.choices[0].message.content?.split('\n') || [];

    // Search for jobs using the generated queries
    const jobs: JobSearchResult[] = [];
    for (const query of searchQueries) {
      // Here you would implement the actual job search logic
      // For example, using LinkedIn's API or web scraping
      // For now, we'll use a placeholder
      const searchResults = await searchJobs(query);
      jobs.push(...searchResults);
    }

    // Create embeddings for the jobs
    const jobsWithEmbeddings = await Promise.all(
      jobs.map(async (job) => {
        const embedding = await createJobEmbedding(job);
        return { ...job, embedding };
      })
    );

    // Store jobs in Supabase
    const { error } = await supabase
      .from('recommended_jobs')
      .insert(jobsWithEmbeddings.map(job => ({
        ...job,
        user_id: userId,
        created_at: new Date().toISOString(),
      })));

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ jobs }),
    };

  } catch (error) {
    console.error('Error finding matching jobs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to find matching jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Helper function to create job embedding
async function createJobEmbedding(job: JobSearchResult) {
  const textToEmbed = `
    Title: ${job.title}
    Company: ${job.company}
    Description: ${job.description}
    Keywords: ${job.keywords.join(', ')}
  `.trim();

  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: textToEmbed
  });

  return embedding.data[0].embedding;
}

// Placeholder function for job search implementation
async function searchJobs(query: string): Promise<JobSearchResult[]> {
  // This would be replaced with actual job search logic
  // For example, using LinkedIn's API or web scraping
  return [];
}
