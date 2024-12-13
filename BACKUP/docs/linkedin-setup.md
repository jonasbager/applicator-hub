# LinkedIn OAuth Setup Guide (Updated)

## 1. Create LinkedIn OAuth Application

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create App"
3. Fill in the application details:
   - App name: "Applicator Hub" (or your preferred name)
   - LinkedIn Page: Your company's LinkedIn page (or your profile URL)
   - App Logo: Upload an app logo
   - Legal Agreement: Accept the terms

4. Under "Products":
   - Find "Sign In with LinkedIn using OpenID Connect"
   - Click "Request access" or enable this product
   - This is the correct option as it provides modern OAuth 2.0 with OpenID Connect

5. Under "Auth" tab:
   - Add Authorized Redirect URLs:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   
   IMPORTANT: 
   - Use your actual Supabase project reference
   - The callback URL must be exact, no wildcards
   - For this project: https://qiowwdewasasyilriyfn.supabase.co/auth/v1/callback

6. Note down your credentials:
   - Client ID
   - Client Secret

## 2. Configure Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find "LinkedIn" in the list
4. Enable LinkedIn auth:
   - Toggle the "Enabled" switch to on
   - Select "LinkedIn (OpenID Connect)" from the dropdown
   - Enter your credentials:
     - Client ID: From LinkedIn OAuth app
     - Client Secret: From LinkedIn OAuth app
   - Save the configuration

5. Important Settings:
   - Site URL: http://localhost:8080 (for development)
   - Redirect URLs must include:
     ```
     https://qiowwdewasasyilriyfn.supabase.co/auth/v1/callback
     ```

## 3. Environment Setup

1. Create a `.env` file in your project root:
   ```env
   VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   ```

2. Set LinkedIn credentials in Supabase:
   ```bash
   supabase secrets set LINKEDIN_CLIENT_ID=your_client_id
   supabase secrets set LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

## 4. Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:8080
3. Click "Sign in with LinkedIn"
4. You should be redirected to LinkedIn for authentication
5. After successful authentication, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **Provider Not Enabled Error**
   - Double-check the callback URL in LinkedIn Developer Console
   - Must be exactly: https://qiowwdewasasyilriyfn.supabase.co/auth/v1/callback
   - No wildcards or variations allowed
   - Same URL must be used in:
     * LinkedIn Developer Console
     * Supabase Auth Settings
     * Your application code

2. **Invalid Redirect URI**
   - Must use the exact Supabase callback URL
   - Check for any typos or missing characters
   - Ensure the URL is added to all required places

3. **Authentication Failed**
   - Verify credentials are correct
   - Check browser console for specific error messages
   - Ensure all URLs match exactly

### Verifying Configuration

1. In Supabase Dashboard:
   - Authentication → Providers → LinkedIn should be enabled
   - Callback URL should be exact
   - Client ID and Secret should be set

2. In LinkedIn Developer Console:
   - OpenID Connect should be approved
   - Redirect URL should match exactly
   - Application status should be active

3. In Your Code:
   - Provider should be 'linkedin_oidc'
   - Redirect URL should match exactly
   - Scopes should be 'openid profile email'

## Security Notes

1. **Production Setup**
   - Always use HTTPS in production
   - Regularly rotate LinkedIn OAuth credentials
   - Monitor auth logs in Supabase

2. **Data Protection**
   - RLS policies protect user data
   - Profile information is stored securely
   - Sessions are managed by Supabase Auth

3. **Best Practices**
   - Keep credentials secure
   - Implement proper error handling
   - Monitor authentication failures
