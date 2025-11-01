"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type SessionFeedbackProps = {
  onSubmit: () => void
}

export function SessionFeedback({ onSubmit }: SessionFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === null) {
      alert("Please select a rating before submitting")
      return
    }

    setIsSubmitting(true)

    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem("prompt-grader-user-id") || "anonymous"

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          rating,
          message: message.trim() || null,
        }),
      })

      setHasSubmitted(true)
      setTimeout(() => {
        onSubmit()
      }, 2000)
    } catch (error) {
      console.error("[v0] Failed to submit feedback:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSubmitted) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-card to-green-50">
        <CardContent className="py-12 text-center">
          <div className="mb-4 text-6xl">✓</div>
          <h3 className="mb-2 text-2xl font-bold text-green-700">Thank You!</h3>
          <p className="text-slate-600">Your feedback has been submitted successfully.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span className="text-2xl">💬</span>
          Session Feedback
        </CardTitle>
        <CardDescription>
          You've completed both stages! Please share your thoughts about this workshop experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="mb-3 block text-sm font-medium text-foreground">
            How would you rate this workshop session?
          </label>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-5xl transition-all hover:scale-110 ${
                  rating && star <= rating ? "opacity-100" : "opacity-30 hover:opacity-70"
                }`}
                aria-label={`Rate ${star} stars`}
                type="button"
              >
                ⭐
              </button>
            ))}
          </div>
          {rating && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You selected {rating} star{rating !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Optional Message */}
        <div>
          <label htmlFor="feedback-message" className="mb-2 block text-sm font-medium text-foreground">
            Additional Comments <span className="text-muted-foreground">(Optional)</span>
          </label>
          <Textarea
            id="feedback-message"
            placeholder="Share your thoughts about the workshop, what you learned, or suggestions for improvement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">{message.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === null} size="lg" className="gap-2">
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
