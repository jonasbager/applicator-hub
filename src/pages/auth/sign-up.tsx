import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Linkedin } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export function SignUpPage() {
  const { signUp, signInWithLinkedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
      setSubmitted(true);
    } catch {
      // error surfaced via toast
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedIn = async () => {
    setLoading(true);
    try {
      await signInWithLinkedIn();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Start tracking your job applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitted ? (
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation link to <span className="font-medium">{email}</span>. Please
              check your inbox to finish creating your account.
            </p>
          ) : (
            <>
              <Button variant="outline" className="w-full" onClick={handleLinkedIn} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Linkedin className="mr-2 h-4 w-4" />}
                Continue with LinkedIn
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign up
                </Button>
              </form>
            </>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-primary hover:text-primary/90">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
