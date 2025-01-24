declare module 'linkedin-jobs-api' {
  interface QueryOptions {
    keyword?: string;
    location?: string;
    dateSincePosted?: 'past-24h' | 'past-week' | 'past-month' | 'any';
    jobType?: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'volunteer' | 'internship';
    remoteFilter?: 'remote' | 'on-site' | 'hybrid';
    limit?: string;
  }

  interface LinkedInJob {
    title: string;
    company: string;
    location: string;
    link: string;
    description: string;
    [key: string]: any;
  }

  export function query(options: QueryOptions): Promise<LinkedInJob[]>;
}
