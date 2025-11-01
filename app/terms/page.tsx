import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <Link href="/" className="text-sm text-primary hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Terms & Conditions</h1>

        <div className="prose prose-slate max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using the AI Prompt Grader application, you accept and agree to be bound by the terms and
              conditions outlined in this agreement. If you do not agree to these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Purpose of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              This application is designed as an educational tool for workshop participants to learn and improve their
              prompt engineering skills. The service provides AI-powered evaluation and feedback on submitted prompts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Users agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the service for educational purposes only</li>
              <li>Submit appropriate and respectful content</li>
              <li>Not attempt to manipulate or abuse the evaluation system</li>
              <li>Not submit any harmful, offensive, or illegal content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain service availability but do not guarantee uninterrupted access. The service may be
              temporarily unavailable due to maintenance, updates, or technical issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The AI Prompt Grader application, including its design, functionality, and content, is protected by
              intellectual property rights. Users retain ownership of their submitted prompts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              This service is provided "as is" for educational purposes. We make no warranties about the accuracy or
              completeness of the AI evaluations. The service should not be relied upon as the sole source of prompt
              engineering guidance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Usage</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using this service, you consent to the collection and use of anonymous data as described in our Privacy
              Policy. This data is used solely for workshop analytics and educational improvement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after changes
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend access to the service at any time, without prior notice, for
              conduct that violates these terms or is harmful to other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms & Conditions, please contact your workshop instructor.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
