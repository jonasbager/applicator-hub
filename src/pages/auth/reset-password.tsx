import { SignIn } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const isRecovery = searchParams.get('type') === 'recovery';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn
        appearance={{
          layout: {
            shimmer: true
          },
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            formFieldInput: 'bg-background border-input',
            formFieldLabel: 'text-foreground',
            formFieldError: 'text-destructive text-sm',
            footerActionLink: 'text-primary hover:text-primary/90',
            card: 'bg-background border-border shadow-md',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            identityPreviewText: 'text-foreground',
            identityPreviewEditButton: 'text-primary hover:text-primary/90',
            formFieldInputPlaceholder: 'text-muted-foreground'
          }
        }}
        routing="path"
        path="/reset-password"
        signUpUrl="/sign-up"
        redirectUrl="/jobs"
      />
    </div>
  );
}
