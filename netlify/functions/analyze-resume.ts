import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getVerifiedUserId } from './lib/auth';
import { extractStructured, aiErrorResponse } from './lib/anthropic';

interface ResumeAnalysis {
  skills: string[];
  experience_level: string;
  roles: string[];
  industries: string[];
  education: string[];
  languages: string[];
  years_of_experience: number;
  key_achievements: string[];
  locations: string[];
}

// JSON schema for guaranteed-valid structured output from Claude.
const RESUME_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    skills: { type: 'array', items: { type: 'string' } },
    experience_level: {
      type: 'string',
      description: 'One of "Entry Level", "Mid Level", "Senior Level", or "Executive Level"',
    },
    roles: { type: 'array', items: { type: 'string' } },
    industries: { type: 'array', items: { type: 'string' } },
    education: { type: 'array', items: { type: 'string' } },
    languages: { type: 'array', items: { type: 'string' } },
    years_of_experience: { type: 'number' },
    key_achievements: { type: 'array', items: { type: 'string' } },
    locations: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'skills', 'experience_level', 'roles', 'industries', 'education',
    'languages', 'years_of_experience', 'key_achievements', 'locations',
  ],
};

const RESUME_SYSTEM_PROMPT =
  'You analyze resumes and extract structured information. Be thorough — capture both explicit and implicit details. Infer the experience level from roles, responsibilities, and years of experience. For locations, include specific cities and broader regions, current and previous work locations, relocation willingness, and remote preferences.';

// Initialize Supabase client with service role key
console.log('Environment variables:', {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasOpenAiKey: !!process.env.OPENAI_API_KEY
});

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:', {
    supabaseUrl: !process.env.VITE_SUPABASE_URL,
    serviceKey: !process.env.SUPABASE_SERVICE_ROLE_KEY
  });
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
    // Resume analysis runs on Claude; the AI key is required.
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Identity comes from the verified session token, never the request body.
    const userId = await getVerifiedUserId(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { resumeId } = JSON.parse(event.body || '{}');

    if (!resumeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Resume ID is required' }),
      };
    }

    // Get resume from Supabase
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (resumeError || !resume) {
      throw new Error('Failed to fetch resume');
    }

    // Download resume file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('resumes')
      .download(resume.file_path);

    if (fileError || !fileData) {
      throw new Error('Failed to download resume file');
    }

    // Convert file to text based on file type
    let text = '';
    const fileName = resume.file_name.toLowerCase();
    
    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      if (fileName.endsWith('.pdf')) {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else if (fileName.endsWith('.docx')) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (parseError: unknown) {
      console.error('Error parsing file:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`Failed to parse ${fileName}: ${errorMessage}`);
    }

    console.log('Extracted text from resume:', text.substring(0, 200) + '...');

    console.log('Analyzing resume with Claude...');
    let parsedResume: ResumeAnalysis;
    try {
      parsedResume = await extractStructured<ResumeAnalysis>({
        system: RESUME_SYSTEM_PROMPT,
        content: `Analyze this resume and extract the candidate's profile:\n\n${text}`,
        schema: RESUME_SCHEMA,
        maxTokens: 1500,
      });
    } catch (aiError) {
      const { statusCode, message } = aiErrorResponse(aiError);
      console.error('AI resume analysis failed:', aiError);
      return {
        statusCode,
        headers,
        body: JSON.stringify({ error: 'Failed to analyze resume', details: message }),
      };
    }
    console.log('Successfully parsed resume data');

    // Update job preferences based on resume analysis
    const preferences = {
      level: [parsedResume.experience_level],
      roles: parsedResume.roles,
      skills: parsedResume.skills,
      industries: parsedResume.industries,
      education: parsedResume.education,
      languages: parsedResume.languages,
      years_of_experience: parsedResume.years_of_experience,
      locations: parsedResume.locations,
    };

    // Update preferences in database
    console.log('Updating job preferences for user:', userId);
    console.log('Preferences payload:', preferences);

    const { data: existingPrefs, error: selectError } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing preferences:', selectError);
      throw new Error(`Failed to check existing preferences: ${selectError.message}`);
    }

    const { error: updateError } = await supabase
      .from('job_preferences')
      .upsert({
        id: existingPrefs?.id, // Include existing ID if it exists
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating preferences:', updateError);
      throw new Error(`Failed to update job preferences: ${updateError.message}`);
    }

    console.log('Successfully updated job preferences');

    // Best-effort: store a resume embedding for the (currently disabled) job
    // matching feature. Anthropic has no embeddings API, so this still uses
    // OpenAI — but it must not fail the analysis if OpenAI is unavailable.
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const resumeEmbedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        const { error: embeddingError } = await supabase
          .from('resumes')
          .update({ embedding: resumeEmbedding.data[0].embedding })
          .eq('id', resumeId);
        if (embeddingError) {
          console.warn('Could not store resume embedding:', embeddingError.message);
        }
      } catch (embeddingError) {
        console.warn('Skipping resume embedding (OpenAI unavailable):', embeddingError);
      }
    } else {
      console.log('OPENAI_API_KEY not set — skipping resume embedding.');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        analysis: parsedResume,
        preferences
      }),
    };

  } catch (error: unknown) {
    console.error('Error analyzing resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to analyze resume',
        details: errorMessage,
      }),
    };
  }
};
