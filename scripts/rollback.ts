import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface Job {
  id: string;
  user_id: string;
  clerk_user_id?: string;
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

async function getJobsWithClerkIds(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .not('clerk_user_id', 'is', null);

  if (error) throw error;
  return data || [];
}

async function rollbackJobs(jobs: Job[], dryRun: boolean) {
  if (dryRun) {
    console.log(`📋 Would rollback ${jobs.length} jobs`);
    jobs.forEach(job => {
      console.log(`  - ${job.title} at ${job.company}`);
      console.log(`    From Clerk ID: ${job.clerk_user_id}`);
      console.log(`    To Supabase ID: ${job.user_id}`);
    });
    return;
  }

  // Update jobs to remove Clerk user IDs
  const { error } = await supabase
    .from('jobs')
    .update({ clerk_user_id: null })
    .in('id', jobs.map(job => job.id));

  if (error) throw error;
  console.log(`📋 Rolled back ${jobs.length} jobs`);
}

async function rollback() {
  try {
    console.log('🔄 Starting rollback...');

    // Get all jobs with Clerk user IDs
    const jobs = await getJobsWithClerkIds();
    console.log(`📊 Found ${jobs.length} jobs to rollback`);

    // Rollback jobs
    await rollbackJobs(jobs, DRY_RUN);

    // Print summary
    console.log('\n📊 Rollback Summary');
    console.log('----------------');
    console.log(`Total jobs processed: ${jobs.length}`);
    console.log(`Mode: ${DRY_RUN ? 'Dry Run' : 'Live'}`);

    if (DRY_RUN) {
      console.log('\n🏃 This was a dry run - no changes were made');
      console.log('Run without --dry-run to perform the actual rollback');
    } else {
      console.log('\n✅ Rollback completed successfully');
      console.log('\nNext steps:');
      console.log('1. Verify job data in Supabase');
      console.log('2. Remove Clerk integration if needed');
      console.log('3. Update environment variables');
    }

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// Run rollback
rollback().catch(console.error);
