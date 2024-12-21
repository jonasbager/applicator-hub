import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for recovery session on mount
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Current session:', session);
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          navigate('/auth/login', { replace: true });
          return;
        }

        // If no session, check URL for recovery token
        if (!session) {
          const fragment = window.location.hash;
          if (!fragment) {
            console.error('No recovery session or token found');
            navigate('/auth/login', { replace: true });
            return;
          }

          // Parse the token from the URL fragment
          const params = new URLSearchParams(fragment.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          console.log('URL params:', { accessToken, refreshToken, type });

          if (!accessToken || type !== 'recovery') {
            console.error('Invalid recovery token');
            navigate('/auth/login', { replace: true });
            return;
          }

          // Set the recovery session
          const { data: { session: recoverySession }, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (setSessionError || !recoverySession) {
            console.error('Error setting recovery session:', setSessionError);
            navigate('/auth/login', { replace: true });
            return;
          }

          // Verify we have a user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('Error getting user:', userError);
            navigate('/auth/login', { replace: true });
            return;
          }

          console.log('Recovery session established for user:', user.email);
        }

        toast({
          title: "Ready to reset password",
          description: "Please enter your new password.",
        });
      } catch (error) {
        console.error('Error handling recovery session:', error);
        navigate('/auth/login', { replace: true });
      }
    };

    checkRecoverySession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Get current session to verify we're still in recovery mode
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Recovery session expired');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      // Sign out to clear the recovery session
      await supabase.auth.signOut();
      
      // Redirect to login
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error instanceof Error ? error.message : "Failed to reset password");
      
      // If session expired, redirect to login
      if (error instanceof Error && error.message === 'Recovery session expired') {
        navigate('/auth/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
