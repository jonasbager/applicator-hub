import { SignUp } from '@clerk/clerk-react';

export function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUp
        appearance={{
          layout: {
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'blockButton',
            shimmer: true
          },
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            formFieldInput: 'bg-background border-input',
            formFieldLabel: 'text-foreground',
            socialButtonsBlockButton: 'border-border bg-background hover:bg-muted',
            socialButtonsBlockButtonText: 'text-foreground',
            dividerLine: 'bg-border',
            dividerText: 'text-muted-foreground',
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
        afterSignUpUrl="/jobs"
        signInUrl="/sign-in"
      />
    </div>
  );
}
