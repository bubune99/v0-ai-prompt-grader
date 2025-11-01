import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Prompt Grader. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/analytics"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
