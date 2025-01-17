import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { JobMatch } from './types/job-match';

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are not configured');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const { userId } = JSON.parse(event.body || '{}');

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Get the user's latest resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (resumeError || !resume) {
      throw new Error('No resume found');
    }

    // Get user's preferences
    const { data: preferences, error: prefError } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences) {
      throw new Error('No preferences found');
    }

    // Find matching jobs using vector similarity
    const { data: jobs, error: jobsError } = await supabase
      .rpc('match_jobs', {
        query_embedding: resume.embedding,
        match_threshold: 0.7,
        match_count: 20
      });

    if (jobsError) {
      throw new Error('Failed to fetch matching jobs');
    }

    // Sort jobs by both similarity and experience level match
    const sortedJobs = (jobs as JobMatch[]).sort((a: JobMatch, b: JobMatch) => {
      // Boost score if experience level matches
      const aLevelMatch = a.level.includes(preferences.level[0]) ? 0.2 : 0;
      const bLevelMatch = b.level.includes(preferences.level[0]) ? 0.2 : 0;
      
      return (b.similarity + bLevelMatch) - (a.similarity + aLevelMatch);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobs: sortedJobs,
      }),
    };

  } catch (error: unknown) {
    console.error('Error finding matching jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to find matching jobs',
        details: errorMessage,
      }),
    };
  }
};
