export type JobStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Interview' | 'Rejected';

export const JOB_STATUS_ORDER: JobStatus[] = [
  'Not Started',
  'In Progress',
  'Submitted',
  'Interview',
  'Rejected'
];

export type DateValue = string | 'ASAP' | null;  // string for ISO dates, 'ASAP', or null for unknown
export type DeadlineStatus = 'green' | 'yellow' | 'red' | 'asap' | 'unknown';

export interface Job {
  id: string;
  user_id: string;
  position: string;
  company: string;
  company_url?: string;
  description: string;
  keywords: string[];
  url: string;
  status: JobStatus;
  notes: string[];
  application_draft_url?: string;
  deadline?: DateValue;
  start_date?: DateValue;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  in_joblog?: boolean;
  match_percentage?: number;
}

export function getDeadlineStatus(deadline?: DateValue): DeadlineStatus {
  if (!deadline) return 'unknown';
  if (deadline === 'ASAP') return 'asap';
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline <= 2) return 'red';
  if (daysUntilDeadline <= 7) return 'yellow';
  return 'green';
}

export function formatDate(date?: DateValue): string {
  if (!date) return 'Unknown';
  if (date === 'ASAP') return 'ASAP';
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}
