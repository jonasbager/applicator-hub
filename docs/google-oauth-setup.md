# Setting up Google OAuth with Clerk

This guide will help you set up Google OAuth authentication for your application.

## 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the OAuth consent screen:
   - Go to APIs & Services > OAuth consent screen
   - Choose User Type: External
   - Fill in application information:
     ```
     App name: ApplyMate
     User support email: your-email@domain.com
     Developer contact information: your-email@domain.com
     ```
   - Add scopes:
     - `userinfo.email`
     - `userinfo.profile`
   - Add test users if using External user type

4. Create OAuth credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose Application type: "Web application"
   - Fill in details:
     ```
     Name: ApplyMate Web Client
     Authorized JavaScript origins:
     - http://localhost:5173
     - https://{your-clerk-frontend-api}.clerk.accounts.dev

     Authorized redirect URIs:
     - https://{your-clerk-frontend-api}.clerk.accounts.dev/v1/oauth/callback
     ```
   - Click "Create"
   - Save the Client ID and Client Secret

## 2. Configure Clerk

1. Go to your Clerk Dashboard
2. Navigate to User & Authentication > Social Connections
3. Click on "Add social connection" and select Google
4. Enter the Google OAuth credentials:
   - Client ID: from Google Cloud Console
   - Client Secret: from Google Cloud Console
5. Configure scopes:
   ```
   Required:
   - openid
   - email
   - profile
   ```

## 3. Update Environment Variables

Add these to your `.env` file:
```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google OAuth (optional, for reference)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. Testing OAuth Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try signing in with Google:
   - Click "Sign in"
   - Click "Continue with Google"
   - Select your Google account
   - Accept the permissions
   - You should be redirected back to your app

## 5. Production Setup

When deploying to production:

1. Update Google OAuth configuration:
   - Add your production domain to authorized origins
   - Add production callback URL
   - Update consent screen information if needed

2. Update Clerk settings:
   - Add your production domain to allowed origins
   - Verify callback URLs
   - Test the flow in production

## Troubleshooting

### Common Issues

1. "Error 400: redirect_uri_mismatch"
   - Check that your callback URL exactly matches what's in Google Console
   - Include the full path including `/v1/oauth/callback`
   - Check for protocol mismatch (http vs https)

2. "Error 401: invalid_client"
   - Verify Client ID and Secret are correct
   - Check that credentials are for the right project
   - Ensure OAuth consent screen is configured

3. Consent screen not showing
   - Verify scopes are properly configured
   - Check OAuth consent screen settings
   - Ensure user is not already authenticated

### Debug Steps

1. Check Clerk logs:
   - Go to Clerk Dashboard > Logs
   - Filter for OAuth-related events
   - Look for specific Google OAuth errors

2. Verify Google configuration:
   ```bash
   # List authorized domains
   gcloud oauth-2.0-client list-domains

   # Check OAuth configuration
   gcloud oauth-2.0-client check-config
   ```

3. Test in incognito mode:
   - Eliminates cached credentials
   - Tests fresh OAuth flow
   - Helps identify session issues

## Security Notes

1. OAuth best practices:
   - Use state parameter (handled by Clerk)
   - Validate tokens on backend
   - Use HTTPS everywhere
   - Keep credentials secure

2. Google-specific security:
   - Regularly review authorized applications
   - Monitor OAuth consent screen settings
   - Check for suspicious activity
   - Use application-specific credentials

3. Production safeguards:
   - Enable application verification
   - Monitor usage quotas
   - Set up alerts for unusual activity
   - Regular security reviews

## Next Steps

1. Enhance user experience:
   - Add loading states
   - Improve error messages
   - Add "Remember me" functionality
   - Implement account linking

2. Additional features:
   - Add Google Calendar integration
   - Enable Google Drive access
   - Implement Google Contacts sync
   - Add Google Workspace features

3. Monitoring and maintenance:
   - Set up error tracking
   - Monitor OAuth usage
   - Track user conversion
   - Regular security audits
