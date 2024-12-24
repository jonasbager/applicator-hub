import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface VerificationResult {
  type: string;
  message: string;
  details?: any;
  passed: boolean;
}

async function verifyJobs(): Promise<VerificationResult[]> {
  console.log('🔍 Verifying jobs...');
  const results: VerificationResult[] = [];

  // Get all jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*');

  if (error) throw error;

  // Verify URL formats
  const urlIssues = jobs?.filter(job => 
    job.url && !job.url.startsWith('http')
  ) || [];

  if (urlIssues.length > 0) {
    results.push({
      type: 'URL_FORMAT',
      message: `Found ${urlIssues.length} jobs with invalid URL format`,
      details: urlIssues.map(job => ({ id: job.id, url: job.url })),
      passed: false
    });
  } else {
    results.push({
      type: 'URL_FORMAT',
      message: 'All job URLs are properly formatted',
      passed: true
    });
  }

  // Verify required fields
  const requiredFields = ['title', 'company', 'user_id'];
  const missingFields = jobs?.filter(job => 
    requiredFields.some(field => !job[field])
  ) || [];

  if (missingFields.length > 0) {
    results.push({
      type: 'REQUIRED_FIELDS',
      message: `Found ${missingFields.length} jobs with missing required fields`,
      details: missingFields.map(job => ({
        id: job.id,
        missing: requiredFields.filter(field => !job[field])
      })),
      passed: false
    });
  } else {
    results.push({
      type: 'REQUIRED_FIELDS',
      message: 'All jobs have required fields',
      passed: true
    });
  }

  // Verify date formats
  const dateFields = ['deadline', 'start_date', 'created_at', 'updated_at'];
  const dateIssues = jobs?.filter(job => 
    dateFields.some(field => 
      job[field] && isNaN(Date.parse(job[field]))
    )
  ) || [];

  if (dateIssues.length > 0) {
    results.push({
      type: 'DATE_FORMAT',
      message: `Found ${dateIssues.length} jobs with invalid date formats`,
      details: dateIssues.map(job => ({
        id: job.id,
        invalid: dateFields.filter(field => 
          job[field] && isNaN(Date.parse(job[field]))
        )
      })),
      passed: false
    });
  } else {
    results.push({
      type: 'DATE_FORMAT',
      message: 'All job dates are properly formatted',
      passed: true
    });
  }

  return results;
}

async function verifyUsers(): Promise<VerificationResult[]> {
  console.log('🔍 Verifying users...');
  const results: VerificationResult[] = [];

  // Get all users
  const { data: users, error } = await supabase
    .from('auth.users')
    .select('*');

  if (error) throw error;

  // Verify email formats
  const emailIssues = users?.filter(user => 
    !user.email?.includes('@') || user.email !== user.email.toLowerCase().trim()
  ) || [];

  if (emailIssues.length > 0) {
    results.push({
      type: 'EMAIL_FORMAT',
      message: `Found ${emailIssues.length} users with invalid email format`,
      details: emailIssues.map(user => ({ id: user.id, email: user.email })),
      passed: false
    });
  } else {
    results.push({
      type: 'EMAIL_FORMAT',
      message: 'All user emails are properly formatted',
      passed: true
    });
  }

  // Verify metadata structure
  const metadataIssues = users?.filter(user => {
    if (!user.raw_user_meta_data || typeof user.raw_user_meta_data !== 'object') {
      return true;
    }
    return !user.raw_user_meta_data.first_name || !user.raw_user_meta_data.last_name;
  }) || [];

  if (metadataIssues.length > 0) {
    results.push({
      type: 'METADATA_STRUCTURE',
      message: `Found ${metadataIssues.length} users with invalid metadata structure`,
      details: metadataIssues.map(user => ({ id: user.id })),
      passed: false
    });
  } else {
    results.push({
      type: 'METADATA_STRUCTURE',
      message: 'All user metadata is properly structured',
      passed: true
    });
  }

  return results;
}

async function verifyRelationships(): Promise<VerificationResult[]> {
  console.log('🔍 Verifying relationships...');
  const results: VerificationResult[] = [];

  // Get all jobs and users
  const { data: jobs } = await supabase.from('jobs').select('id, user_id');
  const { data: users } = await supabase.from('auth.users').select('id');

  if (!jobs || !users) return results;

  // Create set of user IDs for quick lookup
  const userIds = new Set(users.map(u => u.id));

  // Check for orphaned jobs
  const orphanedJobs = jobs.filter(job => !userIds.has(job.user_id));

  if (orphanedJobs.length > 0) {
    results.push({
      type: 'ORPHANED_JOBS',
      message: `Found ${orphanedJobs.length} jobs with invalid user references`,
      details: orphanedJobs.map(job => ({ id: job.id, userId: job.user_id })),
      passed: false
    });
  } else {
    results.push({
      type: 'ORPHANED_JOBS',
      message: 'All jobs have valid user references',
      passed: true
    });
  }

  return results;
}

async function main() {
  try {
    console.log('🔍 Starting data verification...\n');

    const jobResults = await verifyJobs();
    const userResults = await verifyUsers();
    const relationshipResults = await verifyRelationships();
    const allResults = [...jobResults, ...userResults, ...relationshipResults];

    // Print summary
    console.log('\n📊 Verification Summary');
    console.log('--------------------');
    console.log(`Total checks: ${allResults.length}`);
    console.log(`Passed: ${allResults.filter(r => r.passed).length}`);
    console.log(`Failed: ${allResults.filter(r => !r.passed).length}`);

    // Group by type
    const byType = allResults.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        acc[result.type].passed++;
      } else {
        acc[result.type].failed++;
      }
      return acc;
    }, {} as Record<string, { passed: number; failed: number }>);

    console.log('\nResults by type:');
    Object.entries(byType).forEach(([type, counts]) => {
      console.log(`- ${type}: ${counts.passed} passed, ${counts.failed} failed`);
    });

    // Show failures in detail
    const failures = allResults.filter(r => !r.passed);
    if (failures.length > 0) {
      console.log('\n❌ Failed Checks:');
      failures.forEach(failure => {
        console.log(`\n${failure.type}:`);
        console.log(`- ${failure.message}`);
        if (failure.details) {
          console.log('- Details:', JSON.stringify(failure.details, null, 2));
        }
      });
    } else {
      console.log('\n✅ All checks passed!');
    }

    // Exit with error if any checks failed
    if (failures.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
main().catch(console.error);
