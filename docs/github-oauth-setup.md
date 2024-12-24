# Setting up GitHub OAuth with Clerk

This guide will help you set up GitHub OAuth authentication for your application.

## 1. Create GitHub OAuth Application

1. Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
2. Fill in the application details:
   ```
   Application name: ApplyMate (Development)
   Homepage URL: http://localhost:5173
   Authorization callback URL: https://{your-clerk-frontend-api}.clerk.accounts.dev/v1/oauth/callback
   ```
   - Note: Replace `{your-clerk-frontend-api}` with your actual Clerk Frontend API URL
   - For production, use your actual domain instead of localhost

3. Click "Register application"
4. Generate a new client secret
5. Save both the Client ID and Client Secret - you'll need these for Clerk

## 2. Configure Clerk

1. Go to your Clerk Dashboard
2. Navigate to User & Authentication > Social Connections
3. Click on "Add social connection" and select GitHub
4. Enter the GitHub OAuth credentials:
   - Client ID: from GitHub OAuth App
   - Client Secret: from GitHub OAuth App
5. Configure scopes:
   ```
   Required:
   - read:user
   - user:email

   Optional:
   - read:org (if you want to access user's organizations)
   ```

## 3. Update Environment Variables

Add these to your `.env` file:
```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# GitHub OAuth (optional, for reference)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 4. Testing OAuth Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try signing in with GitHub:
   - Click "Sign in"
   - Click "Continue with GitHub"
   - Authorize the application
   - You should be redirected back to your app

## 5. Production Setup

When deploying to production:

1. Create a new GitHub OAuth App for production
   - Use your production domain
   - Update callback URLs

2. Update Clerk settings:
   - Add your production domain to allowed origins
   - Update GitHub OAuth credentials
   - Test the flow in production

## Troubleshooting

### Common Issues

1. Invalid callback URL
   - Make sure the callback URL in GitHub matches exactly what Clerk provides
   - Check for trailing slashes

2. Scope issues
   - Ensure all required scopes are enabled in GitHub app
   - Check Clerk logs for scope-related errors

3. CORS issues
   - Add your domain to Clerk's allowed origins
   - Check browser console for CORS errors

### Debug Steps

1. Check Clerk logs:
   - Go to Clerk Dashboard > Logs
   - Filter for OAuth-related events
   - Look for error messages

2. Verify environment variables:
   ```bash
   # Print all Clerk-related env vars
   grep CLERK .env
   ```

3. Test OAuth flow in development:
   ```bash
   # Start dev server with debug logging
   DEBUG=clerk* npm run dev
   ```

## Security Notes

1. Never commit OAuth secrets to version control
2. Use environment variables for all sensitive values
3. Regularly rotate client secrets
4. Monitor OAuth usage in GitHub and Clerk dashboards

## Next Steps

1. Add error handling for OAuth failures
2. Implement user onboarding after OAuth signup
3. Consider adding more OAuth providers (Google, etc.)
4. Set up monitoring for OAuth-related issues
