import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { Toaster } from "./components/ui/toaster";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import Callback from "./pages/auth/callback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Archived from "./pages/Archived";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/use-auth";

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/auth/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/auth/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/archived" element={
        <ProtectedRoute>
          <Archived />
        </ProtectedRoute>
      } />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
