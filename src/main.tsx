import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const isDevelopment = import.meta.env.MODE === 'development';

console.log('Environment:', {
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  NODE_ENV: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  isDevelopment,
});

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  console.error('Clerk key is missing or invalid:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        appearance={{
          layout: {
            shimmer: true
          }
        }}
        // Use development URLs in development mode
        signInUrl={isDevelopment ? 'https://exact-viper-93.accounts.dev/sign-in' : 'https://accounts.applymate.app/sign-in'}
        signUpUrl={isDevelopment ? 'https://exact-viper-93.accounts.dev/sign-up' : 'https://accounts.applymate.app/sign-up'}
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
