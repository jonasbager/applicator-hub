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

interface CleanupResult {
  type: string;
  message: string;
  details?: any;
  fixed: boolean;
}

async function cleanupJobs(): Promise<CleanupResult[]> {
  console.log('🧹 Cleaning up jobs...');
  const results: CleanupResult[] = [];

  // Get all jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*');

  if (error) throw error;

  for (const job of jobs || []) {
    // Fix URLs
    if (job.url && !job.url.startsWith('http')) {
      const newUrl = `https://${job.url}`;
      const result: CleanupResult = {
        type: 'URL_FIX',
        message: `Job ${job.id}: Fixed URL format`,
        details: { jobId: job.id, oldUrl: job.url, newUrl },
        fixed: false
      };
      results.push(result);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ url: newUrl })
          .eq('id', job.id);

        if (!updateError) {
          result.fixed = true;
        }
      }
    }

    // Trim whitespace from text fields
    const trimmedFields: Record<string, string> = {};
    ['title', 'company', 'notes'].forEach(field => {
      if (typeof job[field] === 'string' && job[field].trim() !== job[field]) {
        trimmedFields[field] = job[field].trim();
      }
    });

    if (Object.keys(trimmedFields).length > 0) {
      const result: CleanupResult = {
        type: 'WHITESPACE_FIX',
        message: `Job ${job.id}: Trimmed whitespace`,
        details: { jobId: job.id, fields: Object.keys(trimmedFields) },
        fixed: false
      };
      results.push(result);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(trimmedFields)
          .eq('id', job.id);

        if (!updateError) {
          result.fixed = true;
        }
      }
    }

    // Fix date formats
    for (const dateField of ['deadline', 'start_date']) {
      if (job[dateField] && isNaN(Date.parse(job[dateField]))) {
        // Try to parse common date formats
        const dateStr = job[dateField];
        let fixedDate: string | null = null;

        // Try DD/MM/YYYY format
        const ddmmyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (ddmmyyyy) {
          fixedDate = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
        }

        if (fixedDate) {
          const result: CleanupResult = {
            type: 'DATE_FIX',
            message: `Job ${job.id}: Fixed ${dateField} format`,
            details: { jobId: job.id, oldDate: dateStr, newDate: fixedDate },
            fixed: false
          };
          results.push(result);

          if (!DRY_RUN) {
            const { error: updateError } = await supabase
              .from('jobs')
              .update({ [dateField]: fixedDate })
              .eq('id', job.id);

            if (!updateError) {
              result.fixed = true;
            }
          }
        }
      }
    }
  }

  return results;
}

async function cleanupUsers(): Promise<CleanupResult[]> {
  console.log('🧹 Cleaning up users...');
  const results: CleanupResult[] = [];

  // Get all users
  const { data: users, error } = await supabase
    .from('auth.users')
    .select('*');

  if (error) throw error;

  for (const user of users || []) {
    // Normalize email addresses
    const email = user.email?.toLowerCase().trim();
    if (email && email !== user.email) {
      const result: CleanupResult = {
        type: 'EMAIL_FIX',
        message: `User ${user.id}: Normalized email`,
        details: { userId: user.id, oldEmail: user.email, newEmail: email },
        fixed: false
      };
      results.push(result);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('auth.users')
          .update({ email })
          .eq('id', user.id);

        if (!updateError) {
          result.fixed = true;
        }
      }
    }

    // Ensure metadata structure
    if (user.raw_user_meta_data && typeof user.raw_user_meta_data === 'object') {
      const metadata = { ...user.raw_user_meta_data };
      let needsUpdate = false;

      // Ensure first_name and last_name exist
      if (!metadata.first_name) {
        metadata.first_name = '';
        needsUpdate = true;
      }
      if (!metadata.last_name) {
        metadata.last_name = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        const result: CleanupResult = {
          type: 'METADATA_FIX',
          message: `User ${user.id}: Fixed metadata structure`,
          details: { userId: user.id },
          fixed: false
        };
        results.push(result);

        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from('auth.users')
            .update({ raw_user_meta_data: metadata })
            .eq('id', user.id);

          if (!updateError) {
            result.fixed = true;
          }
        }
      }
    }
  }

  return results;
}

async function main() {
  try {
    console.log('🧹 Starting data cleanup...\n');

    const jobResults = await cleanupJobs();
    const userResults = await cleanupUsers();
    const allResults = [...jobResults, ...userResults];

    // Print summary
    console.log('\n📊 Cleanup Summary');
    console.log('----------------');
    console.log(`Total issues found: ${allResults.length}`);
    console.log(`Issues fixed: ${allResults.filter(r => r.fixed).length}`);

    // Group by type
    const byType = allResults.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nIssues by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });

    if (DRY_RUN) {
      console.log('\n🏃 This was a dry run - no changes were made');
      console.log('Run without --dry-run to apply fixes');
    } else {
      console.log('\n✅ Cleanup completed successfully');
    }

    console.log('\nNext steps:');
    console.log('1. Run validation: npm run validate');
    console.log('2. Create backup: npm run backup');
    console.log('3. Start migration: npm run migrate:dry');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
main().catch(console.error);
