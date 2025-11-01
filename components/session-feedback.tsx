"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type SessionFeedbackProps = {
  onSubmit?: () => void
}

export function SessionFeedback({ onSubmit }: SessionFeedbackProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating before submitting")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          message: message.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setIsSubmitted(true)
      onSubmit?.()
    } catch (error) {
      console.error("[v0] Error submitting feedback:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">✓</div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Thank you for your feedback!</h3>
              <p className="text-sm text-muted-foreground mt-1">Your input helps us improve the workshop experience.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          Session Feedback
        </CardTitle>
        <CardDescription>How would you rate your experience with this prompt evaluation session?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Overall Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-4xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label={`Rate ${star} stars`}
              >
                {star <= (hoveredRating || rating) ? "⭐" : "☆"}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating === 1 && "Poor - Needs significant improvement"}
              {rating === 2 && "Fair - Could be better"}
              {rating === 3 && "Good - Met expectations"}
              {rating === 4 && "Very Good - Exceeded expectations"}
              {rating === 5 && "Excellent - Outstanding experience"}
            </p>
          )}
        </div>

        {/* Optional Message */}
        <div className="space-y-2">
          <Label htmlFor="feedback-message">Additional Comments (Optional)</Label>
          <Textarea
            id="feedback-message"
            placeholder="Share your thoughts about the session, what worked well, or what could be improved..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="w-full" size="lg">
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  )
}
