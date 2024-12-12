export type JobStatus = "Not Started" | "In Progress" | "Submitted" | "Interview";

export interface Job {
  company: string;
  position: string;
  deadline: string;
  matchRate: number;
  connections: number;
  documents: string[];
  status: JobStatus;
}

export const JOB_STATUS_ORDER: JobStatus[] = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Interview"
];