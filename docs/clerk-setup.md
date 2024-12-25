# Clerk Authentication Setup

This guide explains how to set up Clerk authentication for Applymate.

## 1. Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up for an account
2. Create a new application in the Clerk dashboard
3. Note your Publishable Key and Frontend API from the dashboard

## 2. Configure Application URLs

In your Clerk Dashboard under "Paths":

1. Set the following URLs:
   - Home URL: `https://applymate.app` (or `http://localhost:3000` for development)
   - Sign In URL: `/sign-in`
   - Sign Up URL: `/sign-up`
   - After Sign In URL: `/jobs`
   - After Sign Up URL: `/jobs`

2. Add your domains:
   - Development: `localhost:3000`
   - Production: `applymate.app`

## 3. Configure Authentication Methods

In your Clerk Dashboard:

1. Under **Email, Phone, Username**:
   - Enable Email/Password authentication
   - Configure password requirements
   - Customize email templates if desired

2. Under **Social Connections**:
   - Enable LinkedIn OAuth
   - Add redirect URI: `https://applymate.app/auth/callback`
   - Configure LinkedIn OAuth credentials:
     1. Get Client ID and Secret from LinkedIn Developer Console
     2. Add them to Clerk dashboard
     3. Configure allowed scopes (email, profile)

## 4. Environment Variables

Add these variables to your `.env` file for development:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
VITE_CLERK_FRONTEND_API=your-frontend-api

# URLs
VITE_SITE_URL=http://localhost:3000
```

For production, add these variables in your Netlify dashboard:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your-publishable-key
VITE_CLERK_FRONTEND_API=your-frontend-api
VITE_SITE_URL=https://applymate.app
```

## 5. Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test authentication flows:
   - Sign up with email
   - Sign in with email
   - Sign in with LinkedIn
   - Password reset
   - Email verification

## 6. Production Setup

1. Configure production environment:
   - Add environment variables in Netlify dashboard
   - Update Clerk dashboard with production URLs
   - Configure production OAuth credentials

2. Deploy and verify:
   - Test all auth flows in production
   - Verify email templates
   - Check OAuth redirects

## Architecture Notes

- **Authentication**: Handled entirely by Clerk
  - Sign up/in flows
  - Password reset
  - Email verification
  - OAuth (LinkedIn)
  - Session management

- **Database**: Handled by Supabase
  - User data stored with Clerk user ID
  - Database operations use Clerk session
  - No direct auth with Supabase

- **Components**:
  - `/sign-in`: Clerk's SignIn component
  - `/sign-up`: Clerk's SignUp component
  - `/reset-password`: Password reset flow
  - `/auth/callback`: OAuth callback handling

## Troubleshooting

1. **Email Not Arriving**:
   - Check Clerk dashboard for email logs
   - Verify email templates
   - Check spam folder

2. **OAuth Issues**:
   - Verify redirect URIs
   - Check OAuth credentials
   - Ensure scopes are configured

3. **Session Problems**:
   - Clear browser cache/cookies
   - Check Clerk session status
   - Verify environment variables

4. **Token Errors**:
   - Ensure FRONTEND_API is set correctly
   - Check publishable key format
   - Verify domain configuration
