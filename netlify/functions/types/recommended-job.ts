export interface RecommendedJob {
  id?: string;
  user_id: string;
  title: string;
  company: string;
  description: string;
  url: string;
  keywords: string[];
  level: string[];
  embedding?: number[];
  created_at?: string;
  similarity?: number;
}

export interface JobSearchResult {
  title: string;
  company: string;
  description: string;
  url: string;
  keywords: string[];
  level: string[];
}
