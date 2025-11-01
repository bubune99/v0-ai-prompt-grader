"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SessionFeedback } from "@/components/session-feedback"
import type { EvaluationResult } from "@/app/page"

type ResultsDashboardProps = {
  result: EvaluationResult
  onReset: () => void
  currentStage: number
  onNextStage?: () => void
}

export function ResultsDashboard({ result, onReset, currentStage, onNextStage }: ResultsDashboardProps) {
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hasRated, setHasRated] = useState(false)
  const [showSessionFeedback, setShowSessionFeedback] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent"
    if (score >= 60) return "text-chart-3"
    return "text-destructive"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Improvement"
  }

  const handleRating = async (rating: number) => {
    setUserRating(rating)
    setHasRated(true)

    try {
      await fetch("/api/rate-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: result.originalPrompt,
          rating,
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to save rating:", error)
    }
  }

  useEffect(() => {
    if (currentStage === 2 && hasRated) {
      setShowSessionFeedback(true)
    }
  }, [currentStage, hasRated])

  const handleSessionFeedbackComplete = () => {
    setShowSessionFeedback(false)
  }

  if (showSessionFeedback) {
    return (
      <div className="space-y-6">
        <SessionFeedback onSubmit={handleSessionFeedbackComplete} />
        <div className="flex justify-center pt-4">
          <Button onClick={onReset} size="lg" variant="outline" className="gap-2 bg-transparent">
            <span>↻</span>
            Start New Session
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            Your Prompt
          </CardTitle>
          <CardDescription>The prompt you submitted for evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-mono text-sm leading-relaxed text-foreground">{result.originalPrompt}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-chart-2/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Goal / Target Output
          </CardTitle>
          <CardDescription>What you were trying to achieve</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm leading-relaxed text-foreground">{result.targetOutput}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-accent/30 bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Your Grade</CardTitle>
              <CardDescription>Overall effectiveness score</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {getScoreBadge(result.effectivenessScore)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-end gap-4">
              <div className={`text-6xl font-bold ${getScoreColor(result.effectivenessScore)}`}>
                {result.effectivenessScore}
              </div>
              <div className="mb-2 text-3xl text-muted-foreground">/100</div>
            </div>

            {/* Score Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clarity</span>
                  <span className="font-semibold">{result.clarity}/100</span>
                </div>
                <Progress value={result.clarity} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Specificity</span>
                  <span className="font-semibold">{result.specificity}/100</span>
                </div>
                <Progress value={result.specificity} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Efficiency</span>
                  <span className="font-semibold">{result.efficiency}/100</span>
                </div>
                <Progress value={result.efficiency} />
              </div>
            </div>

            {/* Sustainability Metrics */}
            <div className="border-t pt-4">
              <div className="mb-3 text-sm font-medium text-muted-foreground">Sustainability Metrics</div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <div>
                    <div className="text-xs text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{result.energyConsumption.tokens.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <div>
                    <div className="text-xs text-muted-foreground">CO₂</div>
                    <div className="font-semibold">{result.energyConsumption.estimatedCO2}g</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <div>
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <div className="font-semibold">${result.energyConsumption.estimatedCost.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-chart-3/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            AI Evaluation & Feedback
          </CardTitle>
          <CardDescription>Detailed analysis of your prompt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback */}
          <div>
            <h4 className="mb-2 font-semibold text-sm">Detailed Feedback</h4>
            <p className="text-pretty leading-relaxed text-foreground">{result.feedback}</p>
          </div>

          {/* Improvements */}
          <div>
            <h4 className="mb-3 font-semibold text-sm">Key Improvements</h4>
            <ul className="space-y-2">
              {result.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-accent">✓</span>
                  <span className="text-sm leading-relaxed">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improved Prompt */}
          <div>
            <h4 className="mb-2 font-semibold text-sm">Improved Prompt Suggestion</h4>
            <div className="rounded-lg bg-muted p-4">
              <p className="font-mono text-sm leading-relaxed text-foreground">{result.improvedPrompt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-chart-4/20 bg-gradient-to-br from-card to-chart-4/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            Rate This Evaluation
          </CardTitle>
          <CardDescription>How helpful was this AI evaluation?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  disabled={hasRated}
                  className={`text-4xl transition-all hover:scale-110 disabled:cursor-not-allowed ${
                    userRating && rating <= userRating
                      ? "opacity-100"
                      : hasRated
                        ? "opacity-30"
                        : "opacity-40 hover:opacity-100"
                  }`}
                  aria-label={`Rate ${rating} stars`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {hasRated && (
              <p className="text-sm text-muted-foreground">
                Thank you for your feedback! You rated this evaluation {userRating}/5 stars.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
        <Button onClick={onReset} size="lg" variant="outline" className="gap-2 bg-transparent">
          <span>↻</span>
          Try Another Prompt
        </Button>
        {onNextStage && currentStage === 1 && (
          <Button onClick={onNextStage} size="lg" className="gap-2">
            <span>→</span>
            Continue to Stage 2
          </Button>
        )}
      </div>
    </div>
  )
}
