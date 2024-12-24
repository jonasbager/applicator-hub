# SuperTokens Migration Plan

## Overview
Switch from Supabase Auth to SuperTokens while keeping all other functionality intact. This includes database, job scraping, and all UI/UX elements.

## Current Auth Features to Preserve
1. Email/Password Authentication
2. Email Verification
3. Password Reset Flow
4. LinkedIn OAuth
5. Protected Routes
6. Auth State Management

## Migration Steps

### 1. Install SuperTokens
```bash
npm install supertokens-auth-react supertokens-node
```

### 2. Create SuperTokens Config
- Set up SuperTokens core instance
- Configure email templates
- Configure LinkedIn OAuth
- Keep all email content and styling identical

### 3. Replace Auth Files
Files to modify (keeping same structure/names):
- src/lib/auth.tsx (replace Supabase auth with SuperTokens)
- src/lib/auth-context.ts (update types for SuperTokens)
- src/pages/auth/* (update components to use SuperTokens)

### 4. Database Integration
- Keep using Supabase for database
- Only replace auth-related API calls
- Update user metadata handling

### 5. Testing Plan
- Verify all auth flows:
  * Sign up
  * Sign in
  * Password reset
  * Email verification
  * LinkedIn OAuth
- Ensure no changes to:
  * Job tracking functionality
  * UI/UX
  * Database operations
  * Scraping features

## Benefits of SuperTokens
1. Full control over auth flows
2. Built-in password reset/email verification
3. Open source and self-hosted
4. Active community and support

## Risks and Mitigations
1. Risk: Breaking existing sessions
   - Mitigation: Plan migration path for existing users
2. Risk: Data loss
   - Mitigation: Keep Supabase user data during transition
3. Risk: UI changes
   - Mitigation: Customize SuperTokens UI to match current design

Would you like me to proceed with this migration plan?
