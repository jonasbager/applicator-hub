export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  level: string[];
  keywords: string[];
  similarity: number;
  created_at: string;
  updated_at: string;
}
