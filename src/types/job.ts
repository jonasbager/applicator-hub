export type JobStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Interview';

export const JOB_STATUS_ORDER: JobStatus[] = [
  'Not Started',
  'In Progress',
  'Submitted',
  'Interview'
];

export interface Job {
  id: string;
  user_id: string;
  position: string;
  company: string;
  description: string;
  keywords: string[];
  url: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}
