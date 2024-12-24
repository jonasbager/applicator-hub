import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import assert from 'assert';

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

interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

async function setupTestData() {
  // Create test user
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'test123',
    email_confirm: true,
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    }
  });

  if (userError) throw userError;

  // Create test job
  const { error: jobError } = await supabase
    .from('jobs')
    .insert({
      title: 'Test Job',
      company: 'Test Company',
      user_id: user.user.id,
      status: 'applied',
      url: 'example.com',
      deadline: '2024/01/01',
      notes: ' Test notes with whitespace '
    });

  if (jobError) throw jobError;

  return { userId: user.user.id };
}

async function cleanupTestData(userId: string) {
  // Delete test job
  await supabase
    .from('jobs')
    .delete()
    .eq('user_id', userId);

  // Delete test user
  await supabase.auth.admin.deleteUser(userId);
}

async function runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    return {
      name,
      passed: true,
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error as Error,
      duration: Date.now() - start
    };
  }
}

async function testCleanup() {
  const { userId } = await setupTestData();

  try {
    // Run cleanup script in dry-run mode
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    const job = jobs?.[0];
    assert(job, 'Test job not found');
    assert(job.url === 'example.com', 'URL not in original format');
    assert(job.notes.includes(' '), 'Notes still have whitespace');
    assert(job.deadline === '2024/01/01', 'Date in wrong format');

    // Run actual cleanup
    // Note: In a real test, we'd import and run the cleanup function
    // For now, we'll simulate the cleanup

    // Verify changes
    const { data: updatedJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    const updatedJob = updatedJobs?.[0];
    assert(updatedJob, 'Updated job not found');
    assert(updatedJob.url.startsWith('https://'), 'URL not fixed');
    assert(!updatedJob.notes.startsWith(' '), 'Whitespace not trimmed');
    assert(updatedJob.deadline === '2024-01-01', 'Date format not fixed');

  } finally {
    await cleanupTestData(userId);
  }
}

async function testValidation() {
  const { userId } = await setupTestData();

  try {
    // Test validation with valid data
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    assert(jobs?.length === 1, 'Test job not found');
    const job = jobs[0];

    // Verify relationships
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    assert(user.user, 'User not found');
    assert(job.user_id === user.user.id, 'Job-user relationship broken');

    // Test required fields
    assert(job.title, 'Title missing');
    assert(job.company, 'Company missing');
    assert(job.user_id, 'User ID missing');

  } finally {
    await cleanupTestData(userId);
  }
}

async function testBackup() {
  const { userId } = await setupTestData();

  try {
    // Test backup creation
    // Note: In a real test, we'd import and run the backup function
    // For now, we'll verify the data is available to backup

    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    assert(jobs?.length === 1, 'Job data not available for backup');

    const { data: user } = await supabase.auth.admin.getUserById(userId);
    assert(user.user, 'User data not available for backup');

  } finally {
    await cleanupTestData(userId);
  }
}

async function main() {
  console.log('🧪 Running migration test suite...\n');

  const tests = [
    { name: 'Cleanup Script', fn: testCleanup },
    { name: 'Validation', fn: testValidation },
    { name: 'Backup', fn: testBackup }
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`Running ${test.name}...`);
    const result = await runTest(test.name, test.fn);
    results.push(result);
    console.log(result.passed ? '✅ Passed' : '❌ Failed');
    if (result.error) {
      console.log('Error:', result.error.message);
    }
    console.log();
  }

  // Print summary
  console.log('\n📊 Test Summary');
  console.log('-------------');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);

  // Show failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(failure => {
      console.log(`\n${failure.name}:`);
      console.log(`Error: ${failure.error?.message}`);
      console.log(`Duration: ${failure.duration}ms`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run tests
main().catch(console.error);
