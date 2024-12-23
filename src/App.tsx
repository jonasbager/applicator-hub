import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './lib/theme';
import { AuthProvider, Protected, Public } from './lib/clerk-provider';

// Pages
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
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Auth routes */}
            <Route
              path="/"
              element={
                <Public>
                  <Landing />
                </Public>
              }
            />
            <Route
              path="/sign-in/*"
              element={
                <Public>
                  <SignInPage />
                </Public>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <Public>
                  <SignUpPage />
                </Public>
              }
            />
            <Route
              path="/reset-password/*"
              element={
                <Public>
                  <ResetPasswordPage />
                </Public>
              }
            />
            <Route path="/auth/callback" element={<CallbackPage />} />

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
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
