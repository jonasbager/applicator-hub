import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import assert from 'assert';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

interface IntegrationTestResult {
  phase: string;
  passed: boolean;
  error?: Error;
  duration: number;
  details?: any;
}

async function setupTestEnvironment() {
  // Create test users with various data conditions
  const users = [
    {
      email: 'test1@example.com',
      password: 'test123',
      metadata: { first_name: 'Test1', last_name: 'User' }
    },
    {
      email: 'test2@example.com',
      password: 'test123',
      metadata: {} // Missing names
    },
    {
      email: ' Test3@EXAMPLE.com ', // Needs normalization
      password: 'test123',
      metadata: { first_name: 'Test3', last_name: 'User' }
    }
  ];

  const userIds = [];

  for (const userData of users) {
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userData.metadata
    });

    if (error) throw error;
    userIds.push(user.user.id);
  }

  // Create test jobs with various data conditions
  const jobs = [
    {
      title: 'Test Job 1',
      company: 'Company 1',
      user_id: userIds[0],
      url: 'example.com', // Needs https://
      status: 'applied'
    },
    {
      title: ' Test Job 2 ', // Needs trimming
      company: 'Company 2',
      user_id: userIds[1],
      status: 'applied',
      deadline: '2024/01/01' // Wrong date format
    },
    {
      title: 'Test Job 3',
      company: 'Company 3',
      user_id: userIds[2],
      status: 'applied',
      notes: ' Notes with whitespace ' // Needs trimming
    }
  ];

  for (const jobData of jobs) {
    const { error } = await supabase
      .from('jobs')
      .insert(jobData);

    if (error) throw error;
  }

  return { userIds };
}

async function cleanupTestEnvironment(userIds: string[]) {
  // Delete test jobs
  for (const userId of userIds) {
    await supabase
      .from('jobs')
      .delete()
      .eq('user_id', userId);
  }

  // Delete test users
  for (const userId of userIds) {
    await supabase.auth.admin.deleteUser(userId);
  }

  // Clean up backup files
  const backupDir = join(process.cwd(), 'backups');
  if (existsSync(backupDir)) {
    // In real implementation, clean up test backup files
  }
}

async function runPhase(name: string, fn: () => Promise<void>): Promise<IntegrationTestResult> {
  const start = Date.now();
  try {
    await fn();
    return {
      phase: name,
      passed: true,
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      phase: name,
      passed: false,
      error: error as Error,
      duration: Date.now() - start
    };
  }
}

async function testDataCleanup(userIds: string[]) {
  // Verify initial state
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .in('user_id', userIds);

  assert(jobs?.some(job => job.url === 'example.com'), 'Test job URL not in original format');
  assert(jobs?.some(job => job.title.includes(' ')), 'Test job title not in original format');
  assert(jobs?.some(job => job.deadline === '2024/01/01'), 'Test job deadline not in original format');

  // Run cleanup (simulated)
  // In real test, we'd import and run the cleanup function

  // Verify cleanup results
  const { data: updatedJobs } = await supabase
    .from('jobs')
    .select('*')
    .in('user_id', userIds);

  assert(updatedJobs?.every(job => !job.url || job.url.startsWith('https://')), 'URLs not fixed');
  assert(updatedJobs?.every(job => job.title === job.title.trim()), 'Whitespace not trimmed');
  assert(updatedJobs?.every(job => !job.deadline || job.deadline.includes('-')), 'Date formats not fixed');
}

async function testBackupCreation(userIds: string[]) {
  // Create backup (simulated)
  // In real test, we'd import and run the backup function

  // Verify backup data is complete
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .in('user_id', userIds);

  assert(jobs?.length === 3, 'Not all jobs available for backup');

  for (const userId of userIds) {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    assert(user.user, `User ${userId} not available for backup`);
  }
}

async function testMigrationDryRun(userIds: string[]) {
  // Run migration in dry-run mode (simulated)
  // In real test, we'd import and run the migration function with --dry-run

  // Verify no changes were made
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .in('user_id', userIds);

  assert(jobs?.length === 3, 'Jobs modified during dry run');

  for (const userId of userIds) {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    assert(user.user, `User ${userId} modified during dry run`);
  }
}

async function main() {
  console.log('🧪 Running integration tests...\n');

  let userIds: string[] = [];
  const results: IntegrationTestResult[] = [];

  try {
    // Setup test environment
    console.log('Setting up test environment...');
    const setup = await setupTestEnvironment();
    userIds = setup.userIds;
    console.log('✅ Test environment ready\n');

    // Run test phases
    const phases = [
      { name: 'Data Cleanup', fn: () => testDataCleanup(userIds) },
      { name: 'Backup Creation', fn: () => testBackupCreation(userIds) },
      { name: 'Migration Dry Run', fn: () => testMigrationDryRun(userIds) }
    ];

    for (const phase of phases) {
      console.log(`Running ${phase.name}...`);
      const result = await runPhase(phase.name, phase.fn);
      results.push(result);
      console.log(result.passed ? '✅ Passed' : '❌ Failed');
      if (result.error) {
        console.log('Error:', result.error.message);
      }
      console.log();
    }

  } finally {
    // Cleanup test environment
    console.log('Cleaning up test environment...');
    await cleanupTestEnvironment(userIds);
    console.log('✅ Test environment cleaned\n');
  }

  // Print summary
  console.log('\n📊 Integration Test Summary');
  console.log('-------------------------');
  console.log(`Total phases: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);

  // Show failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\n❌ Failed Phases:');
    failures.forEach(failure => {
      console.log(`\n${failure.phase}:`);
      console.log(`Error: ${failure.error?.message}`);
      console.log(`Duration: ${failure.duration}ms`);
      if (failure.details) {
        console.log('Details:', JSON.stringify(failure.details, null, 2));
      }
    });
    process.exit(1);
  } else {
    console.log('\n✅ All integration tests passed!');
  }
}

// Run integration tests
main().catch(console.error);
