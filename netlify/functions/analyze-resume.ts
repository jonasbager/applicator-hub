import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { JobMatch } from './types/job-match';

// Schema for parsed resume data
const resumeSchema = z.object({
  skills: z.array(z.string()),
  experience_level: z.string(),
  roles: z.array(z.string()),
  industries: z.array(z.string()),
  education: z.array(z.string()),
  languages: z.array(z.string()),
  years_of_experience: z.number(),
  key_achievements: z.array(z.string()),
});

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
    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const { resumeId, userId } = JSON.parse(event.body || '{}');

    if (!resumeId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Resume ID and User ID are required' }),
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

    console.log('Starting OpenAI analysis...');
    // Initialize OpenAI with GPT-3.5 for faster processing
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      maxTokens: 1000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create parser for structured output
    const parser = StructuredOutputParser.fromZodSchema(resumeSchema);

    // Create prompt template for resume analysis
    const promptTemplate = new PromptTemplate({
      template: `Analyze the following resume content and extract key information.
      Return a JSON object with these fields:
      - "skills": Array of technical and soft skills
      - "experience_level": One of "Entry Level", "Mid Level", "Senior Level", or "Executive Level"
      - "roles": Array of job titles/roles the person has held or is qualified for
      - "industries": Array of industries the person has experience in
      - "education": Array of educational qualifications
      - "languages": Array of languages the person knows
      - "years_of_experience": Total years of relevant work experience (number)
      - "key_achievements": Array of notable achievements or accomplishments

      Be thorough in analyzing the entire resume. Look for both explicit and implicit information.
      Infer the experience level from the roles, responsibilities, and years of experience.

      {format_instructions}
      
      Resume Content: {resume_content}`,
      inputVariables: ['resume_content'],
      partialVariables: {
        format_instructions: parser.getFormatInstructions(),
      },
    });

    // Format prompt with resume content
    const prompt = await promptTemplate.format({
      resume_content: text,
    });

    // Get analysis from OpenAI with timeout handling
    console.log('Sending prompt to OpenAI...');
    const response = await Promise.race<any>([
      model.invoke(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI analysis timeout')), 20000)
      )
    ]) as Awaited<ReturnType<typeof model.invoke>>;
    
    console.log('Received OpenAI response, parsing...');
    const responseText = response.content.toString();
    const parsedResume = await parser.parse(responseText);
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

    // Create resume embedding
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const resumeEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });

    // Store resume embedding
    const { error: embeddingError } = await supabase
      .from('resumes')
      .update({ embedding: resumeEmbedding.data[0].embedding })
      .eq('id', resumeId);

    if (embeddingError) {
      throw new Error('Failed to store resume embedding');
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
