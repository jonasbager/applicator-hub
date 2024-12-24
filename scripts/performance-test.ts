import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import assert from 'assert';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
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

interface PerformanceResult {
  operation: string;
  batchSize: number;
  totalItems: number;
  duration: number;
  itemsPerSecond: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
}

interface PerformanceReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuCount: number;
  };
  results: PerformanceResult[];
  summary: {
    totalDuration: number;
    averageItemsPerSecond: number;
    peakMemoryUsage: number;
  };
}

async function generateTestData(count: number) {
  const users = Array.from({ length: count }, (_, i) => ({
    email: `test${i}@example.com`,
    password: 'test123',
    metadata: {
      first_name: `Test${i}`,
      last_name: 'User',
      custom_field: 'x'.repeat(100) // Add some bulk to the metadata
    }
  }));

  const userIds: string[] = [];
  console.log(`Creating ${count} test users...`);

  // Create users in batches
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const promises = batch.map(async userData => {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.metadata
      });

      if (error) throw error;
      if (!data.user) throw new Error(`Failed to create user: ${userData.email}`);
      return data.user.id;
    });

    const batchIds = await Promise.all(promises);
    userIds.push(...batchIds);
    
    // Progress indicator
    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, users.length)}/${users.length}`);
  }
  console.log('\nUsers created');

  // Create jobs (3 per user)
  const jobs = [];
  for (const userId of userIds) {
    for (let i = 0; i < 3; i++) {
      jobs.push({
        title: `Test Job ${i}`,
        company: `Company ${i}`,
        user_id: userId,
        status: 'applied',
        notes: 'x'.repeat(500), // Add some bulk to test data size
        url: 'example.com',
        deadline: '2024/01/01'
      });
    }
  }

  console.log(`Creating ${jobs.length} test jobs...`);
  
  // Insert jobs in batches
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const { error } = await supabase.from('jobs').insert(batch);
    if (error) throw error;
    
    // Progress indicator
    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, jobs.length)}/${jobs.length}`);
  }
  console.log('\nJobs created');

  return { userIds, jobCount: jobs.length };
}

async function cleanupTestData(userIds: string[]) {
  console.log('Cleaning up test data...');
  
  // Delete jobs in batches
  const batchSize = 50;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const { error } = await supabase
      .from('jobs')
      .delete()
      .in('user_id', batch);
    
    if (error) throw error;
    
    // Progress indicator
    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, userIds.length)}/${userIds.length}`);
  }
  console.log('\nJobs deleted');

  // Delete users in batches
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const promises = batch.map(async id => {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
    });
    
    await Promise.all(promises);
    
    // Progress indicator
    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, userIds.length)}/${userIds.length}`);
  }
  console.log('\nUsers deleted');
}

async function measurePerformance(name: string, fn: () => Promise<void>, itemCount: number): Promise<PerformanceResult> {
  // Record initial memory usage
  const initialMemory = process.memoryUsage();
  
  // Run operation and measure time
  const start = Date.now();
  await fn();
  const duration = Date.now() - start;

  // Record final memory usage
  const finalMemory = process.memoryUsage();

  return {
    operation: name,
    batchSize: 50, // Default batch size
    totalItems: itemCount,
    duration,
    itemsPerSecond: (itemCount / duration) * 1000,
    memoryUsage: {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external,
      arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
    }
  };
}

async function saveReport(report: PerformanceReport) {
  const reportsDir = join(process.cwd(), 'performance-reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const filename = join(reportsDir, `report-${report.timestamp.replace(/[:.]/g, '-')}.json`);
  writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${filename}`);
}

async function main() {
  console.log('🏃 Running performance tests...\n');

  const TEST_USER_COUNT = 100; // Adjust based on your needs
  const results: PerformanceResult[] = [];
  let userIds: string[] = [];
  let jobCount = 0;

  try {
    // Generate test data
    console.log('Generating test data...');
    const setup = await generateTestData(TEST_USER_COUNT);
    userIds = setup.userIds;
    jobCount = setup.jobCount;
    console.log('✅ Test data generated\n');

    // Test data cleanup performance
    results.push(await measurePerformance(
      'Data Cleanup',
      async () => {
        // Simulate cleanup operations
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      jobCount + userIds.length
    ));

    // Test backup performance
    results.push(await measurePerformance(
      'Backup Creation',
      async () => {
        // Simulate backup operations
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      jobCount + userIds.length
    ));

    // Test migration performance
    results.push(await measurePerformance(
      'User Migration',
      async () => {
        // Simulate migration operations
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      userIds.length
    ));

    // Create performance report
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuCount: require('os').cpus().length
      },
      results,
      summary: {
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
        averageItemsPerSecond: results.reduce((sum, r) => sum + r.itemsPerSecond, 0) / results.length,
        peakMemoryUsage: Math.max(...results.map(r => r.memoryUsage.heapUsed))
      }
    };

    // Save report
    await saveReport(report);

    // Print summary
    console.log('\n📊 Performance Summary');
    console.log('--------------------');
    console.log(`Total Users: ${userIds.length}`);
    console.log(`Total Jobs: ${jobCount}`);
    console.log(`Total Duration: ${report.summary.totalDuration}ms`);
    console.log(`Avg Items/Second: ${report.summary.averageItemsPerSecond.toFixed(2)}`);
    console.log(`Peak Memory Usage: ${(report.summary.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`);

    // Print detailed results
    console.log('\nDetailed Results:');
    results.forEach(result => {
      console.log(`\n${result.operation}:`);
      console.log(`- Duration: ${result.duration}ms`);
      console.log(`- Items/Second: ${result.itemsPerSecond.toFixed(2)}`);
      console.log(`- Memory Delta: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    });

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup test data
    if (userIds.length > 0) {
      try {
        await cleanupTestData(userIds);
      } catch (error) {
        console.error('❌ Failed to clean up test data:', error);
      }
    }
  }
}

// Run performance tests
main().catch(console.error);
