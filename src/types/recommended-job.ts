import { Job, JobStatus, DateValue } from './job';

// Base interface for job listings
export interface RecommendedJob {
  id: string;
  position: string;
  company: string;
  description: string;
  url: string;
  level: string;
  type: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  keywords: string[];
  applicants_count?: number;
  created_at: string;
  updated_at: string;
  deadline?: DateValue;
  start_date?: DateValue;
}

// Interface for converting a recommended job to a board job
export interface BoardJob extends Job {
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  interview_date?: string;
  applied_date?: string;
}

// Helper function to convert a RecommendedJob to a BoardJob
export function convertToBoardJob(
  recommendedJob: RecommendedJob, 
  userId: string,
  status: JobStatus = 'Not Started'
): Omit<BoardJob, 'id'> {
  return {
    user_id: userId,
    position: recommendedJob.position,
    company: recommendedJob.company,
    description: recommendedJob.description,
    url: recommendedJob.url,
    keywords: recommendedJob.keywords,
    status,
    notes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: recommendedJob.deadline,
    start_date: recommendedJob.start_date
  };
}
