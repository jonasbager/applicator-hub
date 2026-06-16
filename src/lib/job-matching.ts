import { JobPreferences } from '../types/resume';
import { RecommendedJob } from '../types/recommended-job';
import { supabase } from './supabase';

export async function findMatchingJobs(preferences: JobPreferences): Promise<RecommendedJob[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/.netlify/functions/find-matching-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        skills: preferences.skills || [],
        level: preferences.level || [],
        roles: preferences.roles || [],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to find matching jobs');
    }

    const { jobs } = await response.json();
    return jobs;
  } catch (error) {
    console.error('Error finding matching jobs:', error);
    throw error;
  }
}
