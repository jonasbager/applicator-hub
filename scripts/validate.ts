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

interface ValidationError {
  type: string;
  message: string;
  details?: any;
}

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

async function validateUsers(): Promise<ValidationResult> {
  console.log('🔍 Validating users...');
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const { data: users, error } = await supabase
    .from('auth.users')
    .select('*');

  if (error) throw error;

  // Check each user
  users?.forEach((user, index) => {
    // Required fields
    if (!user.email) {
      errors.push({
        type: 'MISSING_EMAIL',
        message: `User at index ${index} is missing email`,
        details: { userId: user.id }
      });
    }

    // Email format
    if (user.email && !user.email.includes('@')) {
      errors.push({
        type: 'INVALID_EMAIL',
        message: `User ${user.email} has invalid email format`,
        details: { userId: user.id }
      });
    }

    // Metadata
    if (!user.raw_user_meta_data) {
      warnings.push({
        type: 'MISSING_METADATA',
        message: `User ${user.email} has no metadata`,
        details: { userId: user.id }
      });
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

async function validateJobs(): Promise<ValidationResult> {
  console.log('🔍 Validating jobs...');
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*');

  if (error) throw error;

  // Check each job
  jobs?.forEach(job => {
    // Required fields
    if (!job.title) {
      errors.push({
        type: 'MISSING_TITLE',
        message: `Job ${job.id} is missing title`,
        details: { jobId: job.id }
      });
    }

    if (!job.company) {
      errors.push({
        type: 'MISSING_COMPANY',
        message: `Job ${job.id} is missing company`,
        details: { jobId: job.id }
      });
    }

    if (!job.user_id) {
      errors.push({
        type: 'MISSING_USER_ID',
        message: `Job ${job.id} is missing user_id`,
        details: { jobId: job.id }
      });
    }

    // URL format
    if (job.url && !job.url.startsWith('http')) {
      warnings.push({
        type: 'INVALID_URL',
        message: `Job ${job.id} has invalid URL format`,
        details: { jobId: job.id, url: job.url }
      });
    }

    // Date formats
    if (job.deadline && isNaN(Date.parse(job.deadline))) {
      errors.push({
        type: 'INVALID_DEADLINE',
        message: `Job ${job.id} has invalid deadline format`,
        details: { jobId: job.id, deadline: job.deadline }
      });
    }

    if (job.start_date && isNaN(Date.parse(job.start_date))) {
      errors.push({
        type: 'INVALID_START_DATE',
        message: `Job ${job.id} has invalid start_date format`,
        details: { jobId: job.id, start_date: job.start_date }
      });
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

async function validateRelationships(): Promise<ValidationResult> {
  console.log('🔍 Validating relationships...');
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Get all jobs and users
  const { data: jobs } = await supabase.from('jobs').select('id, user_id');
  const { data: users } = await supabase.from('auth.users').select('id');

  if (!jobs || !users) return { passed: false, errors: [], warnings: [] };

  // Create set of user IDs for quick lookup
  const userIds = new Set(users.map(u => u.id));

  // Check each job's user_id exists
  jobs.forEach(job => {
    if (!userIds.has(job.user_id)) {
      errors.push({
        type: 'ORPHANED_JOB',
        message: `Job ${job.id} references non-existent user ${job.user_id}`,
        details: { jobId: job.id, userId: job.user_id }
      });
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

async function validate() {
  try {
    console.log('🧪 Starting data validation...\n');

    // Run all validations
    const userResult = await validateUsers();
    const jobResult = await validateJobs();
    const relationshipResult = await validateRelationships();

    // Combine results
    const allErrors = [
      ...userResult.errors,
      ...jobResult.errors,
      ...relationshipResult.errors
    ];

    const allWarnings = [
      ...userResult.warnings,
      ...jobResult.warnings,
      ...relationshipResult.warnings
    ];

    // Print summary
    console.log('\n📊 Validation Summary');
    console.log('------------------');
    console.log(`Total Errors: ${allErrors.length}`);
    console.log(`Total Warnings: ${allWarnings.length}`);

    if (allErrors.length > 0) {
      console.log('\n❌ Errors:');
      allErrors.forEach(error => {
        console.log(`- ${error.type}: ${error.message}`);
      });
    }

    if (allWarnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      allWarnings.forEach(warning => {
        console.log(`- ${warning.type}: ${warning.message}`);
      });
    }

    if (allErrors.length === 0) {
      console.log('\n✅ All validations passed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review any warnings');
      console.log('2. Run backup: npm run backup');
      console.log('3. Start migration: npm run migrate:dry');
    } else {
      console.log('\n❌ Validation failed. Please fix errors before proceeding.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation
validate().catch(console.error);
