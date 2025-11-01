import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AdminNav() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              Prompt Grader
            </Link>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="ghost" className="font-medium">
                  Admin Panel
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" className="font-medium">
                  Analytics
                </Button>
              </Link>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
