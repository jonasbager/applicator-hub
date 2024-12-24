import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export function CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/jobs"
        afterSignUpUrl="/jobs"
      />
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
