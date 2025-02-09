import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Job schema matching the database schema
const jobSchema = z.object({
  position: z.string(),
  company: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  url: z.string().url(),
});

type JobDetails = z.infer<typeof jobSchema>;

// Initialize OpenAI
const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
});

// Create a parser for structured output
const parser = StructuredOutputParser.fromZodSchema(jobSchema);

// Create a prompt template for job extraction
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

// Scraping endpoint
app.post('/api/scrape-job', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Load webpage content
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const htmlContent = docs[0].pageContent;

    // Format the prompt with the HTML content
    const prompt = await promptTemplate.format({
      html_content: htmlContent,
    });

    // Get structured output from OpenAI
    const response = await model.invoke(prompt);
    
    // Convert the response to a string
    const responseText = response.content.toString();

    console.log('OpenAI Response:', responseText);

    // Parse the response into our schema
    const parsedJob = await parser.parse(responseText);

    // Add the original URL if not present
    const jobDetails: JobDetails = {
      ...parsedJob,
      url: parsedJob.url || url,
    };

    console.log('Parsed Job Details:', jobDetails);

    res.json(jobDetails);
  } catch (error) {
    console.error('Error scraping job:', error);
    res.status(500).json({
      error: 'Failed to scrape job details',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
