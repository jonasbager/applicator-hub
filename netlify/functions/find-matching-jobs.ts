import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { JobMatch } from './types/job-match';
import { analyzeJob, matchJobToPreferences } from './lib/openai';
import { scrapeJobs } from './lib/job-scraping';

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required environment variables are not configured');
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

interface RawJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
}

interface JobPreferences {
  roles: string[];
  skills: string[];
  locations: string[];
  level: string[];
}

async function searchJobs(preferences: JobPreferences): Promise<JobMatch[]> {
  console.log('Starting job search...');
  
  try {
    // Extract search parameters
    const roles = preferences.roles || [];
    const skills = preferences.skills || [];
    const locations = preferences.locations || [];
    const level = preferences.level || ['Entry Level'];

    // Build search keywords
    const keywords = [...roles, ...skills].filter(Boolean);
    const location = locations[0] || 'Remote';

    console.log('Search parameters:', { keywords, location, level });

    // Scrape jobs from multiple sources
    const rawJobs = await scrapeJobs(keywords, location);
    console.log(`Found ${rawJobs.length} jobs from all sources`);

    if (rawJobs.length === 0) {
      console.log('No jobs found with search parameters:', { keywords, location });
      return [];
    }

    // Analyze jobs with OpenAI
    console.log('Analyzing jobs with OpenAI...');
    const analyzedJobs = await Promise.all(
      rawJobs.map(async (job: RawJob, index: number) => {
        try {
          console.log(`Analyzing job ${index + 1}/${rawJobs.length}:`, {
            title: job.title,
            company: job.company
          });

          const analysis = await analyzeJob(job);
          if (!analysis) {
            throw new Error('Job analysis returned null');
          }

          console.log(`Job ${index + 1} analysis result:`, {
            level: analysis.level,
            skillsCount: analysis.skills.length,
            keywordsCount: analysis.keywords.length
          });

          const matchScore = await matchJobToPreferences(analysis, {
            skills: preferences.skills || [],
            level: preferences.level || [],
            roles: preferences.roles || []
          });

          const similarity = (
            (matchScore / 100) * 0.4 + // OpenAI match score (40%)
            (analysis.keywords.filter((keyword: string) => 
              preferences.skills?.some((skill: string) => 
                skill.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(skill.toLowerCase())
              )
            ).length / Math.max(analysis.keywords.length, 1)) * 0.3 + // Keyword relevance (30%)
            (preferences.level?.some((level: string) => 
              analysis.level.toLowerCase().includes(level.toLowerCase())
            ) ? 0.15 : 0) + // Level match (15%)
            (preferences.roles?.some((role: string) =>
              job.title.toLowerCase().includes(role.toLowerCase())
            ) ? 0.15 : 0) // Role match (15%)
          );

          const jobMatch: JobMatch = {
            id: Math.random().toString(36).substr(2, 9),
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            description: job.description,
            level: [analysis.level],
            keywords: analysis.keywords,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            similarity
          };

          return jobMatch;
        } catch (error) {
          console.error('Error analyzing job:', error);
          return null;
        }
      })
    );

    const validJobs = analyzedJobs.filter((job): job is JobMatch => job !== null);
    console.log(`Successfully analyzed ${validJobs.length} jobs`);

    // Sort by similarity score
    return validJobs.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error searching LinkedIn jobs:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

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

    // Get user's preferences
    console.log('Getting preferences for user:', userId);
    const { data: preferences, error: prefError } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw new Error(`Failed to fetch preferences: ${prefError.message}`);
    }
    if (!preferences) {
      console.error('No preferences found for user:', userId);
      throw new Error('No preferences found');
    }

    console.log('Found preferences:', {
      roles: preferences.roles,
      skills: preferences.skills,
      locations: preferences.locations,
      level: preferences.level,
      raw: preferences
    });

    // Ensure arrays exist and have default values
    const validatedPreferences: JobPreferences = {
      roles: preferences.roles || [],
      skills: preferences.skills || [],
      locations: preferences.locations || [],
      level: preferences.level || ['Entry Level']
    };

    // Validate preferences
    if (!validatedPreferences.roles.length && !validatedPreferences.skills.length) {
      console.log('No roles or skills found in preferences');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jobs: [],
          message: 'Please add some roles or skills to your preferences'
        }),
      };
    }

    // Search jobs
    const jobs = await searchJobs(validatedPreferences);
    console.log(`Found ${jobs.length} total jobs`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobs: jobs,
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
