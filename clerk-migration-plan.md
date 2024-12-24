# Clerk Migration Plan for ApplyMate

## Overview
Replace Supabase Auth with Clerk while keeping all other functionality intact. This includes maintaining the Supabase database, job scraping, and all UI/UX elements.

## Step 1: Initial Setup

### Install Clerk SDK
```bash
npm install @clerk/clerk-react
```

### Environment Variables
```env
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

### Configure Clerk Instance
1. Create account at clerk.dev
2. Set up application
3. Configure email templates to match current ones
4. Set up LinkedIn OAuth
5. Configure application URLs

## Step 2: Replace Auth Files

### 1. Update Auth Context (src/lib/auth-context.ts)
```typescript
import { createContext } from 'react';
import { User } from '@clerk/clerk-react';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null
});
```

### 2. Replace Auth Provider (src/lib/auth.tsx)
```typescript
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
    >
      {children}
    </ClerkProvider>
  );
}
```

### 3. Update Protected Route (src/components/ProtectedRoute.tsx)
```typescript
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
```

## Step 3: Replace Auth Pages

### 1. Login Page (src/pages/auth/login.tsx)
```typescript
import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            // Match current styling
            formButtonPrimary: 'bg-primary text-white',
            // Add other style overrides as needed
          }
        }}
        routing="path"
        path="/auth/login"
        signUpUrl="/auth/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  );
}
```

### 2. Sign Up Page (src/pages/auth/sign-up.tsx)
```typescript
import { SignUp } from '@clerk/clerk-react';

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            // Match current styling
            formButtonPrimary: 'bg-primary text-white',
            // Add other style overrides as needed
          }
        }}
        routing="path"
        path="/auth/sign-up"
        signInUrl="/auth/login"
        redirectUrl="/dashboard"
      />
    </div>
  );
}
```

## Step 4: Update Database Integration

### 1. Create User Metadata Hook (src/hooks/use-user-metadata.ts)
```typescript
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export function useUserMetadata() {
  const { user } = useUser();
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (user) {
      // Fetch user metadata from Supabase
      const fetchMetadata = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error) {
          setMetadata(data);
        }
      };

      fetchMetadata();
    }
  }, [user]);

  return metadata;
}
```

## Step 5: Testing Plan

### 1. Auth Flows to Test
- Email/Password Sign Up
- Email/Password Sign In
- LinkedIn OAuth
- Password Reset
- Email Verification
- Session Management
- Protected Routes

### 2. Database Integration Tests
- User Creation in Supabase
- User Metadata Sync
- Existing Data Access

### 3. UI/UX Tests
- Styling Consistency
- Navigation Flows
- Error Handling
- Loading States

## Step 6: Migration Strategy

### 1. Development Phase
- Implement changes in a new branch
- Test all flows thoroughly
- Get UI/UX review

### 2. User Data Migration
- Export existing user data
- Map Supabase users to Clerk users
- Maintain existing user metadata

### 3. Deployment
- Deploy changes to staging
- Test in production-like environment
- Plan rollback strategy
- Deploy to production

### 4. Post-Migration
- Monitor auth flows
- Collect error logs
- Address any issues
- Update documentation

Would you like me to proceed with implementing any specific part of this plan?
