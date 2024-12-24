import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

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

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('auth.users').select('count');
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    return false;
  }
}

async function testJobsTable() {
  try {
    console.log('🔍 Testing jobs table access...');
    const { data, error } = await supabase.from('jobs').select('count');
    if (error) throw error;
    console.log('✅ Successfully accessed jobs table');
    return true;
  } catch (error) {
    console.error('❌ Failed to access jobs table:', error);
    return false;
  }
}

async function testClerkSetup() {
  try {
    console.log('🔍 Testing Clerk setup...');
    if (!process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') && !process.env.CLERK_SECRET_KEY?.startsWith('sk_live_')) {
      throw new Error('Invalid Clerk secret key format');
    }
    console.log('✅ Clerk secret key format is valid');
    return true;
  } catch (error) {
    console.error('❌ Failed to validate Clerk setup:', error);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting migration tests...\n');

  const results = {
    supabase: await testSupabaseConnection(),
    jobs: await testJobsTable(),
    clerk: await testClerkSetup()
  };

  console.log('\n📊 Test Results');
  console.log('-------------');
  console.log('Supabase Connection:', results.supabase ? '✅ Pass' : '❌ Fail');
  console.log('Jobs Table Access:', results.jobs ? '✅ Pass' : '❌ Fail');
  console.log('Clerk Setup:', results.clerk ? '✅ Pass' : '❌ Fail');

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n✅ All tests passed! You can proceed with the migration.');
    console.log('\nNext steps:');
    console.log('1. Run a dry run: npm run migrate -- --dry-run');
    console.log('2. Review the output carefully');
    console.log('3. Run the actual migration: npm run migrate');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues before proceeding.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
