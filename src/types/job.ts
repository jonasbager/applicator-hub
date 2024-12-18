export type JobStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Interview';

export const JOB_STATUS_ORDER: JobStatus[] = [
  'Not Started',
  'In Progress',
  'Submitted',
  'Interview'
];

export type DeadlineStatus = 'green' | 'yellow' | 'red' | null;

export interface Job {
  id: string;
  user_id: string;
  position: string;
  company: string;
  description: string;
  keywords: string[];
  url: string;
  status: JobStatus;
  notes: string[];
  application_draft_url?: string;
  deadline?: string;  // ISO date string
  created_at: string;
  updated_at: string;
}

export function getDeadlineStatus(deadline?: string): DeadlineStatus {
  if (!deadline) return null;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline <= 2) return 'red';
  if (daysUntilDeadline <= 7) return 'yellow';
  return 'green';
}
