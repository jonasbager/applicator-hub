# ApplyMate Migration Scripts

This directory contains scripts for migrating ApplyMate from Supabase Auth to Clerk Auth.

## Prerequisites

1. Node.js and npm installed
2. Supabase credentials (URL and service role key)
3. Clerk account and API keys
4. Access to both development and production environments

## Setup

1. Install dependencies:
```bash
cd scripts
npm install
```

2. Create `.env` file:
```bash
npm run setup
```

3. Add your credentials to `.env`:
```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk
CLERK_SECRET_KEY=your-clerk-secret-key

# Migration
TEMP_PASSWORD=TemporaryPassword123!
```

## Migration Process

### 1. Data Cleanup
First, clean up any data issues:

```bash
# Test cleanup without making changes
npm run cleanup:dry

# Apply fixes
npm run cleanup
```

### 2. Data Validation
Validate data before migration:

```bash
npm run validate
```

### 3. Backup
Create a backup of current data:

```bash
npm run backup
```

### 4. Migration
Run the migration:

```bash
# Test migration without making changes
npm run migrate:dry

# Run actual migration
npm run migrate
```

### 5. Verification
Verify the migration results:

```bash
npm run verify
```

### 6. Rollback (if needed)
If something goes wrong:

```bash
# Test rollback without making changes
npm run rollback:dry

# Run actual rollback
npm run rollback
```

## Available Scripts

- \`npm run setup\`: Initialize environment and install dependencies
- \`npm run cleanup\`: Fix common data issues
- \`npm run cleanup:dry\`: Test cleanup without making changes
- \`npm run validate\`: Validate data before migration
- \`npm run verify\`: Verify data after migration
- \`npm run backup\`: Create data backup
- \`npm run migrate\`: Run migration
- \`npm run migrate:dry\`: Test migration without making changes
- \`npm run rollback\`: Revert migration
- \`npm run rollback:dry\`: Test rollback without making changes
- \`npm run test\`: Run migration tests
- \`npm run typecheck\`: Check TypeScript types

## Script Details

### cleanup.ts
- Fixes URL formats
- Trims whitespace
- Normalizes date formats
- Fixes email formats
- Ensures metadata structure

### validate.ts
- Checks data integrity
- Validates relationships
- Ensures required fields
- Reports issues

### verify.ts
- Verifies migration results
- Checks data consistency
- Validates relationships
- Provides detailed reporting

### backup.ts
- Creates timestamped backups
- Saves users and jobs
- Creates backup manifest

### migrate-users.ts
- Migrates users to Clerk
- Preserves metadata
- Maintains relationships
- Handles email verification

### rollback.ts
- Reverts to Supabase auth
- Restores original state
- Maintains data integrity

## Error Handling

All scripts:
1. Support dry-run mode
2. Provide detailed logging
3. Exit with error codes
4. Create audit trails

## Best Practices

1. Always run with \`--dry-run\` first
2. Create backups before migration
3. Test in development first
4. Verify all results
5. Keep backups for at least 30 days

## Troubleshooting

### Common Issues

1. Missing credentials:
   - Check .env file
   - Verify API keys

2. Data validation fails:
   - Run cleanup
   - Check error details
   - Fix manually if needed

3. Migration fails:
   - Check error messages
   - Verify prerequisites
   - Run rollback if needed

### Getting Help

1. Check error messages
2. Review logs
3. Run verification
4. Contact support if needed

## Post-Migration

1. Verify all auth flows
2. Test user sessions
3. Check job access
4. Monitor error rates
5. Update documentation

## Security Notes

1. Keep credentials secure
2. Use service role key carefully
3. Monitor access logs
4. Rotate keys after migration
