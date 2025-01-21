import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface JobAnalysis {
  skills: string[];
  level: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
  score: number;
}

export async function analyzeJob(job: {
  title: string;
  company: string;
  description: string;
}): Promise<JobAnalysis> {
  const prompt = `
    Analyze this job posting and extract key information:
    Title: ${job.title}
    Company: ${job.company}
    Description: ${job.description}

    Extract and format as JSON:
    1. Required skills (technical and soft skills)
    2. Experience level (Entry, Mid, Senior)
    3. Key requirements
    4. Main responsibilities
    5. Important keywords for matching
    6. Match score (0-100) based on typical requirements for this role
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content || '{}';
  const analysis = JSON.parse(content);
  return {
    skills: analysis.skills || [],
    level: analysis.level || 'Not specified',
    requirements: analysis.requirements || [],
    responsibilities: analysis.responsibilities || [],
    keywords: analysis.keywords || [],
    score: analysis.score || 0
  };
}

export async function matchJobToPreferences(
  job: JobAnalysis,
  preferences: {
    skills: string[];
    level: string[];
    roles: string[];
  }
): Promise<number> {
  const prompt = `
    Compare these job requirements with user preferences:
    Job:
    ${JSON.stringify(job, null, 2)}

    User Preferences:
    ${JSON.stringify(preferences, null, 2)}

    Calculate a match score (0-100) based on:
    1. Skill match
    2. Experience level match
    3. Role relevance
    Return only the numeric score.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 10
  });

  const content = completion.choices[0].message.content || '0';
  const score = parseInt(content, 10);
  return isNaN(score) ? 0 : score;
}
