import { Header } from "@/components/Header";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Last updated: March 13, 2024
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Applymate ("the Service"), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                Applymate is a job application tracking service that allows users to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Track job applications</li>
                <li>Analyze job postings</li>
                <li>Store application-related notes and documents</li>
                <li>Manage application status and progress</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p>
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Share account credentials</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Upload malicious content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by
                Applymate and are protected by international copyright, trademark, patent, trade
                secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately,
                without prior notice, for conduct that we believe violates these Terms or is
                harmful to other users of the Service, us, or third parties, or for any other
                reason.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision
                is material, we will provide at least 30 days' notice prior to any new terms
                taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
                <br />
                <a href="mailto:legal@applymate.app" className="text-primary hover:underline">
                  legal@applymate.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
