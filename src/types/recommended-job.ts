export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  level: string[];
  created_at: string;
  updated_at: string;
  similarity: number;
}
