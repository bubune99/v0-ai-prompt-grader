"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Cookie & Tracking Notice</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This application uses browser local storage to track anonymous user sessions for workshop analytics
              purposes. We generate a unique anonymous ID stored in your browser to track your progress across multiple
              prompt submissions (Stage 1 and Stage 2). This helps instructors analyze the effectiveness of the workshop
              by comparing before and after scores. No personally identifiable information is collected or stored. The
              data is used solely for educational analytics.
            </p>
          </div>
          <Button onClick={acceptCookies} className="shrink-0">
            Accept & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
