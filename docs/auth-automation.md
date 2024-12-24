# Authentication Automation Scripts

This guide covers automation scripts for common authentication operations and maintenance tasks.

## Health Check Script

```typescript
// scripts/health-check.ts
import { createClient } from '@clerk/clerk-sdk-node';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { metrics } from '../src/lib/monitoring';

interface HealthCheckResult {
  clerk: boolean;
  supabase: boolean;
  oauth: {
    github: boolean;
    google: boolean;
  };
  email: boolean;
  latency: {
    auth: number;
    database: number;
  };
}

async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log('🏥 Running health check...');
  
  const startTime = Date.now();
  const results: HealthCheckResult = {
    clerk: false,
    supabase: false,
    oauth: {
      github: false,
      google: false
    },
    email: false,
    latency: {
      auth: 0,
      database: 0
    }
  };

  try {
    // Check Clerk
    const clerkStart = Date.now();
    const clerk = createClient(process.env.CLERK_SECRET_KEY);
    await clerk.users.getUserList({ limit: 1 });
    results.clerk = true;
    results.latency.auth = Date.now() - clerkStart;

    // Check Supabase
    const dbStart = Date.now();
    const supabase = createSupabase(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    await supabase.from('jobs').select('id').limit(1);
    results.supabase = true;
    results.latency.database = Date.now() - dbStart;

    // Check OAuth providers
    results.oauth.github = await checkOAuthProvider('github');
    results.oauth.google = await checkOAuthProvider('google');

    // Check email delivery
    results.email = await checkEmailDelivery();

    // Update metrics
    metrics.gauge('health_check.duration', Date.now() - startTime);
    Object.entries(results).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        metrics.gauge(`health_check.${key}`, value ? 1 : 0);
      }
    });

    return results;

  } catch (error) {
    console.error('Health check failed:', error);
    metrics.increment('health_check.failure');
    throw error;
  }
}

// Run health check every 5 minutes
if (require.main === module) {
  const INTERVAL = 5 * 60 * 1000;
  
  async function check() {
    try {
      const results = await runHealthCheck();
      console.log('Health check results:', results);
    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  check();
  setInterval(check, INTERVAL);
}
```

## Session Cleanup Script

```typescript
// scripts/cleanup-sessions.ts
import { createClient } from '@clerk/clerk-sdk-node';
import { metrics } from '../src/lib/monitoring';

interface CleanupStats {
  expired: number;
  inactive: number;
  invalid: number;
  duration: number;
}

async function cleanupSessions(): Promise<CleanupStats> {
  console.log('🧹 Starting session cleanup...');
  
  const startTime = Date.now();
  const stats: CleanupStats = {
    expired: 0,
    inactive: 0,
    invalid: 0,
    duration: 0
  };

  try {
    const clerk = createClient(process.env.CLERK_SECRET_KEY);
    
    // Get all sessions
    const sessions = await clerk.sessions.getSessionList();
    
    // Process in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
      const batch = sessions.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (session) => {
        try {
          // Check session status
          if (session.expireAt < new Date()) {
            await clerk.sessions.revokeSession(session.id);
            stats.expired++;
          } else if (session.lastActiveAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
            await clerk.sessions.revokeSession(session.id);
            stats.inactive++;
          }
        } catch (error) {
          console.error(`Failed to process session ${session.id}:`, error);
          stats.invalid++;
        }
      }));
      
      // Progress indicator
      console.log(`Processed ${i + batch.length}/${sessions.length} sessions`);
    }
    
    stats.duration = Date.now() - startTime;
    
    // Update metrics
    metrics.gauge('session_cleanup.duration', stats.duration);
    metrics.gauge('session_cleanup.expired', stats.expired);
    metrics.gauge('session_cleanup.inactive', stats.inactive);
    metrics.gauge('session_cleanup.invalid', stats.invalid);
    
    return stats;
    
  } catch (error) {
    console.error('Session cleanup failed:', error);
    metrics.increment('session_cleanup.failure');
    throw error;
  }
}

// Run cleanup daily
if (require.main === module) {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  async function cleanup() {
    try {
      const stats = await cleanupSessions();
      console.log('Cleanup completed:', stats);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  cleanup();
  setInterval(cleanup, ONE_DAY);
}
```

## Token Rotation Script

```typescript
// scripts/rotate-tokens.ts
import { createClient } from '@clerk/clerk-sdk-node';
import { metrics } from '../src/lib/monitoring';

interface RotationResult {
  rotated: number;
  failed: number;
  duration: number;
}

async function rotateTokens(): Promise<RotationResult> {
  console.log('🔄 Starting token rotation...');
  
  const startTime = Date.now();
  const result: RotationResult = {
    rotated: 0,
    failed: 0,
    duration: 0
  };

  try {
    const clerk = createClient(process.env.CLERK_SECRET_KEY);
    
    // Get all API keys
    const keys = await clerk.apiKeys.getAPIKeyList();
    
    // Process each key
    for (const key of keys) {
      try {
        if (isKeyOld(key)) {
          // Create new key
          const newKey = await clerk.apiKeys.createAPIKey({
            name: `${key.name} (rotated)`,
            scope: key.scope
          });
          
          // Update applications using old key
          await updateApplicationKey(key.id, newKey.id);
          
          // Revoke old key
          await clerk.apiKeys.revokeAPIKey(key.id);
          
          result.rotated++;
        }
      } catch (error) {
        console.error(`Failed to rotate key ${key.id}:`, error);
        result.failed++;
      }
    }
    
    result.duration = Date.now() - startTime;
    
    // Update metrics
    metrics.gauge('token_rotation.duration', result.duration);
    metrics.gauge('token_rotation.rotated', result.rotated);
    metrics.gauge('token_rotation.failed', result.failed);
    
    return result;
    
  } catch (error) {
    console.error('Token rotation failed:', error);
    metrics.increment('token_rotation.failure');
    throw error;
  }
}

// Run rotation monthly
if (require.main === module) {
  const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
  
  async function rotate() {
    try {
      const result = await rotateTokens();
      console.log('Rotation completed:', result);
    } catch (error) {
      console.error('Rotation error:', error);
    }
  }

  rotate();
  setInterval(rotate, ONE_MONTH);
}
```

## Backup Script

```typescript
// scripts/backup-auth.ts
import { createClient } from '@clerk/clerk-sdk-node';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { S3 } from 'aws-sdk';
import { metrics } from '../src/lib/monitoring';

interface BackupResult {
  users: number;
  sessions: number;
  settings: number;
  size: number;
  duration: number;
}

async function backupAuth(): Promise<BackupResult> {
  console.log('💾 Starting auth backup...');
  
  const startTime = Date.now();
  const result: BackupResult = {
    users: 0,
    sessions: 0,
    settings: 0,
    size: 0,
    duration: 0
  };

  try {
    const clerk = createClient(process.env.CLERK_SECRET_KEY);
    const s3 = new S3();
    
    // Backup users
    const users = await clerk.users.getUserList();
    await s3.putObject({
      Bucket: process.env.BACKUP_BUCKET,
      Key: `auth/users-${Date.now()}.json`,
      Body: JSON.stringify(users)
    }).promise();
    result.users = users.length;
    
    // Backup sessions
    const sessions = await clerk.sessions.getSessionList();
    await s3.putObject({
      Bucket: process.env.BACKUP_BUCKET,
      Key: `auth/sessions-${Date.now()}.json`,
      Body: JSON.stringify(sessions)
    }).promise();
    result.sessions = sessions.length;
    
    // Backup settings
    const settings = await clerk.organizations.getOrganizationList();
    await s3.putObject({
      Bucket: process.env.BACKUP_BUCKET,
      Key: `auth/settings-${Date.now()}.json`,
      Body: JSON.stringify(settings)
    }).promise();
    result.settings = settings.length;
    
    result.duration = Date.now() - startTime;
    
    // Update metrics
    metrics.gauge('auth_backup.duration', result.duration);
    metrics.gauge('auth_backup.users', result.users);
    metrics.gauge('auth_backup.sessions', result.sessions);
    metrics.gauge('auth_backup.settings', result.settings);
    
    return result;
    
  } catch (error) {
    console.error('Auth backup failed:', error);
    metrics.increment('auth_backup.failure');
    throw error;
  }
}

// Run backup daily
if (require.main === module) {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  async function backup() {
    try {
      const result = await backupAuth();
      console.log('Backup completed:', result);
    } catch (error) {
      console.error('Backup error:', error);
    }
  }

  backup();
  setInterval(backup, ONE_DAY);
}
```

## Usage

Add these scripts to your package.json:

```json
{
  "scripts": {
    "health": "ts-node scripts/health-check.ts",
    "cleanup": "ts-node scripts/cleanup-sessions.ts",
    "rotate": "ts-node scripts/rotate-tokens.ts",
    "backup": "ts-node scripts/backup-auth.ts"
  }
}
```

Run with:
```bash
# Health check
npm run health

# Session cleanup
npm run cleanup

# Token rotation
npm run rotate

# Auth backup
npm run backup
```

## Best Practices

### 1. Error Handling
- Log all errors
- Retry operations
- Alert on failures
- Clean up resources

### 2. Performance
- Use batching
- Implement timeouts
- Monitor memory usage
- Cache results

### 3. Security
- Rotate credentials
- Validate inputs
- Audit operations
- Secure outputs

### 4. Monitoring
- Track metrics
- Set alerts
- Log operations
- Monitor trends
