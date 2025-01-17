import { JobPreferences } from '../types/resume';
import { RecommendedJob } from '../types/recommended-job';

export async function findMatchingJobs(userId: string, preferences: JobPreferences): Promise<RecommendedJob[]> {
  try {
    const response = await fetch('/.netlify/functions/find-matching-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
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
