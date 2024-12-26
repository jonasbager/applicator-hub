import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL}
      afterSignOutUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_OUT_URL}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
