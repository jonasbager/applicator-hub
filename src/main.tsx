import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

if (!import.meta.env.VITE_CLERK_FRONTEND_API) {
  throw new Error('Missing Clerk Frontend API');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        clerkJSUrl={`https://${import.meta.env.VITE_CLERK_FRONTEND_API}/npm/@clerk/clerk-js@4/dist/clerk.browser.js`}
        signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL}
        signUpUrl={import.meta.env.VITE_CLERK_SIGN_UP_URL}
        afterSignInUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL}
        afterSignUpUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL}
        afterSignOutUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_OUT_URL}
        appearance={{
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            colorTextOnPrimaryBackground: 'hsl(var(--primary-foreground))',
            colorBackground: 'hsl(var(--background))',
            colorText: 'hsl(var(--foreground))',
            colorInputBackground: 'hsl(var(--background))',
            colorInputText: 'hsl(var(--foreground))',
            colorTextSecondary: 'hsl(var(--muted-foreground))',
            colorDanger: 'hsl(var(--destructive))',
            borderRadius: 'var(--radius)'
          },
          elements: {
            card: 'bg-background border-border shadow-none',
            navbar: 'bg-background border-border',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'bg-muted text-foreground border-border hover:bg-muted/80',
            socialButtonsBlockButtonText: 'text-foreground',
            dividerLine: 'bg-border',
            dividerText: 'text-muted-foreground',
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'bg-background border-input',
            formFieldInputPlaceholder: 'text-muted-foreground',
            formFieldError: 'text-destructive',
            footerActionLink: 'text-primary hover:text-primary/90',
            identityPreviewText: 'text-foreground',
            identityPreviewEditButton: 'text-primary hover:text-primary/90',
            userPreviewMainIdentifier: 'text-foreground',
            userPreviewSecondaryIdentifier: 'text-muted-foreground',
            userButtonPopoverCard: 'bg-background border-border',
            userButtonPopoverActionButton: 'text-foreground hover:bg-muted',
            userButtonPopoverActionButtonText: 'text-foreground',
            avatarBox: 'text-foreground'
          }
        }}
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
