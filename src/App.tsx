import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './lib/theme';
import { Protected, Public } from './lib/clerk-provider';
import { useAuthState } from './hooks/use-auth-state';
import { NotFound } from './pages/NotFound';

// Pages
function RootRoute() {
  const { isAuthenticated, isLoaded } = useAuthState();
  
  if (!isLoaded) {
    return null; // or a loading spinner
  }
  
  return isAuthenticated ? <Navigate to="/jobs" replace /> : <Landing />;
}

import Landing from './pages/Landing';
import { Index } from './pages/Index';
import { Archived } from './pages/Archived';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { SignInPage } from './pages/auth/sign-in';
import { SignUpPage } from './pages/auth/sign-up';
import { CallbackPage } from './pages/auth/callback';
import { ResetPasswordPage } from './pages/auth/reset-password';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Auth routes - must come first */}
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route
          path="/sign-in"
          element={
            <Public>
              <SignInPage />
            </Public>
          }
        />
        <Route
          path="/sign-up"
          element={
            <Public>
              <SignUpPage />
            </Public>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Public>
              <ResetPasswordPage />
            </Public>
          }
        />

        {/* Public routes */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/"
          element={
            <RootRoute />
          }
        />

        {/* Protected routes */}
        <Route
          path="/jobs"
          element={
            <Protected>
              <Index />
            </Protected>
          }
        />
        <Route
          path="/archived"
          element={
            <Protected>
              <Archived />
            </Protected>
          }
        />

        {/* 404 catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}
