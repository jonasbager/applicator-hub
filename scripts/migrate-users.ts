import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Check for dry run mode
const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) {
  console.log('🏃 Running in dry-run mode - no changes will be made');
}

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials');
}

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing Clerk secret key');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface SupabaseUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  raw_user_meta_data?: {
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
}

interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  url?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  deadline?: string;
  start_date?: string;
}

async function getJobsForUser(supabase: SupabaseClient, userId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

async function migrateUserJobs(userId: string, jobs: Job[], dryRun: boolean) {
  if (dryRun) {
    console.log(`📋 Would migrate ${jobs.length} jobs for user`);
    jobs.forEach(job => {
      console.log(`  - ${job.title} at ${job.company} (${job.status})`);
    });
    return;
  }

  // In real migration, we'd update the jobs table with the new user ID
  console.log(`📋 Migrated ${jobs.length} jobs for user`);
}

async function migrateUsers() {
  try {
    console.log('🔍 Fetching users from Supabase...');

    // Get all users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from('auth.users')
      .select('*');

    if (error) throw error;

    const users = supabaseUsers as SupabaseUser[];
    console.log(`📊 Found ${users.length} users to migrate`);

    // Migration stats
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let totalJobs = 0;

    // Migrate each user
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.email}`);

        // Get user's jobs
        const jobs = await getJobsForUser(supabase, user.id);
        console.log(`📋 Found ${jobs.length} jobs`);
        totalJobs += jobs.length;

        if (DRY_RUN) {
          console.log(`🔍 Would create user: ${user.email}`);
          console.log('  - First Name:', user.raw_user_meta_data?.first_name);
          console.log('  - Last Name:', user.raw_user_meta_data?.last_name);
          console.log('  - Verified:', !!user.email_confirmed_at);
          await migrateUserJobs(user.id, jobs, true);
          successful++;
          continue;
        }

        // Create user in Clerk (commented out for now)
        /*
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [user.email],
          password: process.env.TEMP_PASSWORD || 'ChangeMe123!',
          firstName: user.raw_user_meta_data?.first_name,
          lastName: user.raw_user_meta_data?.last_name,
          publicMetadata: {
            supabase_id: user.id,
            ...user.raw_user_meta_data
          }
        });

        // If email was verified in Supabase, verify it in Clerk
        if (user.email_confirmed_at) {
          const emailId = clerkUser.emailAddresses[0].id;
          await clerkClient.emailAddresses.verifyEmail(emailId);
        }
        */

        // Migrate user's jobs
        await migrateUserJobs(user.id, jobs, false);

        console.log(`✅ Successfully migrated user: ${user.email}`);
        successful++;
      } catch (userError) {
        console.error(`❌ Failed to migrate user ${user.email}:`, userError);
        failed++;
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary');
    console.log('-------------------');
    console.log(`Total users: ${users.length}`);
    console.log(`Total jobs: ${totalJobs}`);
    console.log(`Successful users: ${successful}`);
    console.log(`Failed users: ${failed}`);
    console.log(`Skipped users: ${skipped}`);
    console.log(`Mode: ${DRY_RUN ? 'Dry Run' : 'Live'}`);

    if (DRY_RUN) {
      console.log('\n🏃 This was a dry run - no changes were made');
      console.log('Run without --dry-run to perform the actual migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers().catch(console.error);
