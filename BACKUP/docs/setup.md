# Setup Instructions

## Prerequisites

1. Docker Desktop
   - Required for deploying Edge Functions
   - Download from: https://docs.docker.com/desktop
   - Must be running before deploying functions

2. Node.js and npm
   - Required for running the application
   - Recommended version: 16.x or higher

3. Supabase CLI
   - Will be installed via npx

## 1. Database Setup

1. First, execute the main setup script:
   ```sql
   -- Copy and paste the contents of supabase/setup.sql
   ```

2. Then create the test user:
   ```sql
   -- Copy and paste the contents of supabase/create-test-user.sql
   ```

   Test user credentials:
   - Email: test@example.com
   - Password: test123!@#

## 2. Edge Functions Setup

1. Ensure Docker Desktop is running
2. Initialize Supabase:
   ```bash
   npx supabase init
   ```

3. Deploy the job scraping function:
   ```bash
   npx supabase functions deploy scrape-job
   ```

## 3. Authentication Setup

1. Configure LinkedIn OAuth:
   - Follow instructions in docs/linkedin-setup.md
   - Make sure to use the correct callback URL format:
     ```
     http://localhost:8081/auth/v1/callback  (for development)
     https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback  (for production)
     ```
   - Update LinkedIn Developer Console with the correct callback URL
   - Update Supabase project settings with the correct site URL

2. Enable Email/Password auth:
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure any email templates if desired

## 4. Testing

1. Start the development server:
   ```bash
   npm run dev
   ```
   Note: The application runs on port 8081

2. Test user login:
   ```
   Email: test@example.com
   Password: test123!@#
   ```

3. Test job scraping with Pleo URL:
   ```
   https://www.pleo.io/en/careers/jobs/6272012003
   ```
   
   This should automatically:
   - Fetch job details using the Edge Function
   - Extract keywords and required documents
   - Cache the results in the database
   - Display the formatted job description

## Troubleshooting

1. Port Issues:
   - The application runs on port 8081
   - Update all callback URLs accordingly
   - Check LinkedIn Developer Console settings
   - Verify Supabase project settings

2. Edge Function Issues:
   - Check Docker Desktop is running
   - Verify function deployment status
   - Check function logs in Supabase Dashboard
   - Test function directly in Dashboard

3. Authentication Issues:
   - Verify callback URLs match the port (8081)
   - Check browser console for auth errors
   - Verify provider settings in Supabase
   - Test both email and LinkedIn login

4. Job Scraping Issues:
   - Check browser console for errors
   - Verify Edge Function logs
   - Check network requests
   - Verify URL format

## Development Notes

1. Local Development:
   ```bash
   npm run dev
   # Application runs on http://localhost:8081
   ```

2. Testing Edge Functions:
   ```bash
   npx supabase functions serve scrape-job --no-verify-jwt
   ```

3. Database Migrations:
   - All schema changes should be added to setup.sql
   - Run migrations through Supabase Dashboard

## Monitoring and Maintenance

1. Regular Checks:
   - Monitor Edge Function logs
   - Check job scraping success rates
   - Review auth logs for issues
   - Monitor database performance

2. Updates:
   - Keep dependencies updated
   - Check for Supabase updates
   - Monitor job board HTML structure changes
   - Update scraping logic if needed

## Security Notes

1. Test User:
   - The test user is for development only
   - Change the password in production
   - Consider disabling the account in production

2. Edge Functions:
   - Monitor function invocations
   - Set up rate limiting if needed
   - Keep dependencies updated
   - Review scraping patterns regularly

3. Database:
   - Use RLS policies to restrict access
   - Monitor auth logs
   - Regularly review permissions
   - Keep triggers and functions updated
