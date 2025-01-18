import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
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

export async function createJobEmbedding(jobDetails: {
  position: string;
  company: string;
  description: string;
  keywords: string[];
}) {
  try {
    // Combine job details into a single text for embedding
    const textToEmbed = `
      Position: ${jobDetails.position}
      Company: ${jobDetails.company}
      Description: ${jobDetails.description}
      Keywords: ${jobDetails.keywords.join(', ')}
    `.trim();

    // Create embedding using OpenAI
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: textToEmbed
    });

    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error creating job embedding:', error);
    throw error;
  }
}

export async function storeJobWithEmbedding(jobId: string, embedding: number[]) {
  try {
    const { error } = await supabase
      .from('recommended_jobs')
      .update({ embedding })
      .eq('id', jobId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error storing job embedding:', error);
    throw error;
  }
}
