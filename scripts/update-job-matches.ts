import { createClient } from '@supabase/supabase-js';
import { calculateMatchPercentage } from '../src/lib/job-matching-utils';
import { Job } from '../src/types/job';
import { JobPreferences } from '../src/types/resume';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Required environment variables are not set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateJobMatches() {
  try {
    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*');

    if (jobsError) throw jobsError;
    if (!jobs) {
      console.log('No jobs found');
      return;
    }

    console.log(`Found ${jobs.length} jobs to update`);

    // Process each job
    for (const job of jobs) {
      try {
        // Get user preferences for this job
        const { data: preferences, error: prefsError } = await supabase
          .from('job_preferences')
          .select('*')
          .eq('user_id', job.user_id)
          .single();

        if (prefsError) {
          console.error(`Error getting preferences for job ${job.id}:`, prefsError);
          continue;
        }

        if (!preferences) {
          console.log(`No preferences found for job ${job.id}, skipping`);
          continue;
        }

        // Calculate match percentage
        const matchPercentage = calculateMatchPercentage(
          job.keywords,
          job.position,
          preferences
        );

        // Update job with match percentage
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ match_percentage: matchPercentage })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Error updating job ${job.id}:`, updateError);
          continue;
        }

        console.log(`Updated job ${job.id} with match percentage: ${matchPercentage}%`);
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
      }
    }

    console.log('Finished updating job matches');
  } catch (error) {
    console.error('Error updating job matches:', error);
  }
}

// Run the update
updateJobMatches().catch(console.error);
