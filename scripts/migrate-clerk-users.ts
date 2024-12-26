import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function migrateUsers() {
  try {
    // Get all jobs with email-based user_ids
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('user_id')
      .not('user_id', 'like', 'user_%');

    if (jobsError) throw jobsError;
    
    console.log(`Found ${jobs?.length || 0} jobs to migrate`);

    // Get unique emails from jobs
    const emails = [...new Set(jobs?.map(job => job.user_id))];
    console.log('Unique emails to migrate:', emails);

    // For each email, get the Clerk user ID and update jobs
    for (const email of emails) {
      console.log(`\nProcessing email: ${email}`);
      
      // Get Clerk user ID for this email
      // Note: You'll need to manually provide this mapping
      const clerkUserId = await promptForClerkUserId(email);
      
      if (!clerkUserId) {
        console.log(`Skipping ${email} - no Clerk user ID provided`);
        continue;
      }

      // Update jobs for this user
      const { error: updateError } = await supabase.rpc(
        'update_job_user_ids',
        { 
          p_email: email,
          p_new_user_id: clerkUserId
        }
      );

      if (updateError) {
        console.error(`Error updating jobs for ${email}:`, updateError);
        continue;
      }

      console.log(`Successfully updated jobs for ${email} to use Clerk ID: ${clerkUserId}`);
    }

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Helper function to get Clerk user ID
// In a real implementation, you might want to:
// 1. Use Clerk's API to look up users by email
// 2. Or have a CSV mapping of email to Clerk IDs
async function promptForClerkUserId(email: string): Promise<string | null> {
  // For now, just log the email and wait for manual input
  console.log(`\nNeed Clerk user ID for email: ${email}`);
  console.log('To get this:');
  console.log('1. Go to Clerk dashboard');
  console.log('2. Find the user with this email');
  console.log('3. Copy their user ID (starts with "user_")');
  
  // In a real implementation, you would:
  // return await promptForInput('Enter Clerk user ID: ');
  
  // For now, just return null
  return null;
}

migrateUsers().catch(console.error);
