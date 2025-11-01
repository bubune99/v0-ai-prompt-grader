"use client"

import type React from "react"
import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { EvaluationResult } from "@/app/page"

type PromptInputProps = {
  onComplete: (result: EvaluationResult) => void
  currentStage: number
}

function generateAnonymousId(): string {
  return `user_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
}

export function PromptInput({ onComplete, currentStage }: PromptInputProps) {
  const [prompt, setPrompt] = useState("")
  const [goal, setGoal] = useState("")
  const [userId, setUserId] = useState("")
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
  const [sessionOpen, setSessionOpen] = useState(true)
  const [sessionMessage, setSessionMessage] = useState("")
  const [submittedPrompt, setSubmittedPrompt] = useState("")
  const [submittedGoal, setSubmittedGoal] = useState("")

  // Track grading state from tool calls
  const [gradingState, setGradingState] = useState<{
    effectivenessScore?: number
    clarity?: number
    specificity?: number
    efficiency?: number
    feedback?: string
    improvements?: string[]
    improvedPrompt?: string
  }>({})

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    body: {
      prompt: submittedPrompt,
      targetOutput: submittedGoal,
      userId,
      stage: currentStage,
    },
    onToolCall: ({ toolCall }) => {
      // Extract data from tool calls as they happen
      if (toolCall.toolName === "fillClarityScore") {
        setGradingState((prev) => ({ ...prev, clarity: toolCall.args.score }))
      } else if (toolCall.toolName === "fillSpecificityScore") {
        setGradingState((prev) => ({ ...prev, specificity: toolCall.args.score }))
      } else if (toolCall.toolName === "fillEfficiencyScore") {
        setGradingState((prev) => ({ ...prev, efficiency: toolCall.args.score }))
      } else if (toolCall.toolName === "fillEffectivenessScore") {
        setGradingState((prev) => ({ ...prev, effectivenessScore: toolCall.args.score }))
      } else if (toolCall.toolName === "fillFeedback") {
        setGradingState((prev) => ({ ...prev, feedback: toolCall.args.feedback }))
      } else if (toolCall.toolName === "fillImprovements") {
        setGradingState((prev) => ({ ...prev, improvements: toolCall.args.improvements }))
      } else if (toolCall.toolName === "fillImprovedPrompt") {
        setGradingState((prev) => ({ ...prev, improvedPrompt: toolCall.args.improvedPrompt }))
      } else if (toolCall.toolName === "completeEvaluation") {
        // Evaluation is complete, compile results
        const state = toolCall.result?.gradingState || gradingState
        if (
          state.effectivenessScore !== undefined &&
          state.clarity !== undefined &&
          state.specificity !== undefined &&
          state.efficiency !== undefined &&
          state.feedback &&
          state.improvements &&
          state.improvedPrompt
        ) {
          // Calculate approximate token usage
          const totalContent = messages.map((m) => m.content).join(" ")
          const estimatedTokens = Math.ceil(totalContent.length / 4)
          const estimatedCO2 = Number.parseFloat((estimatedTokens * 0.0004).toFixed(2))
          const estimatedCost = estimatedTokens * 0.00002

          const result: EvaluationResult = {
            originalPrompt: submittedPrompt,
            targetOutput: submittedGoal,
            effectivenessScore: state.effectivenessScore,
            clarity: state.clarity,
            specificity: state.specificity,
            efficiency: state.efficiency,
            energyConsumption: {
              tokens: estimatedTokens,
              estimatedCO2,
              estimatedCost,
            },
            improvedPrompt: state.improvedPrompt,
            feedback: state.feedback,
            improvements: state.improvements,
          }

          onComplete(result)
        }
      }
    },
  })

  useEffect(() => {
    fetchActiveSession()
    let savedUserId = localStorage.getItem("promptGraderUserId")
    if (!savedUserId) {
      savedUserId = generateAnonymousId()
      localStorage.setItem("promptGraderUserId", savedUserId)
    }
    setUserId(savedUserId)
  }, [currentStage])

  const fetchActiveSession = async () => {
    try {
      const response = await fetch("/api/sessions/active")

      if (!response.ok) {
        console.error("[v0] API returned error status:", response.status)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.session) {
        setGoal(currentStage === 1 ? data.session.stage1_goal : data.session.stage2_goal)
        setSessionOpen(data.session.is_open)
        if (!data.session.is_open) {
          setSessionMessage("Submissions are currently closed. Please check back later.")
        }
      } else {
        setSessionOpen(false)
        setSessionMessage("No active session available. Please contact the administrator.")
      }
    } catch (error) {
      console.error("[v0] Error fetching active session:", error)
      setGoal("Write a professional email to a client explaining a project delay")
      setSessionOpen(false)
      setSessionMessage("Unable to connect to the server. Please try again later.")
    } finally {
      setIsLoadingGoal(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && goal && sessionOpen) {
      setSubmittedPrompt(prompt)
      setSubmittedGoal(goal)
      setGradingState({})
      append({
        role: "user",
        content: "Evaluate this prompt.",
      })
    }
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Submit Your Prompt</CardTitle>
        <CardDescription>
          Write a prompt that will help achieve the goal below. We'll evaluate its effectiveness and provide improvement
          suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sessionOpen && !isLoadingGoal && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-semibold text-red-600">⚠️ {sessionMessage}</p>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="mb-1 text-sm font-semibold text-primary">Goal:</p>
          {isLoadingGoal ? (
            <p className="text-sm text-muted-foreground">Loading goal...</p>
          ) : (
            <p className="text-foreground">{goal}</p>
          )}
        </div>

        {isLoading && (
          <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="mb-3 text-sm font-semibold text-blue-600">Evaluating your prompt...</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {gradingState.clarity !== undefined ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className={gradingState.clarity !== undefined ? "text-green-600" : "text-muted-foreground"}>
                  Clarity Score {gradingState.clarity !== undefined && `(${gradingState.clarity}/100)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingState.specificity !== undefined ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className={gradingState.specificity !== undefined ? "text-green-600" : "text-muted-foreground"}>
                  Specificity Score {gradingState.specificity !== undefined && `(${gradingState.specificity}/100)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingState.efficiency !== undefined ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className={gradingState.efficiency !== undefined ? "text-green-600" : "text-muted-foreground"}>
                  Efficiency Score {gradingState.efficiency !== undefined && `(${gradingState.efficiency}/100)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingState.effectivenessScore !== undefined ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span
                  className={gradingState.effectivenessScore !== undefined ? "text-green-600" : "text-muted-foreground"}
                >
                  Effectiveness Score{" "}
                  {gradingState.effectivenessScore !== undefined && `(${gradingState.effectivenessScore}/100)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingState.feedback ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className={gradingState.feedback ? "text-green-600" : "text-muted-foreground"}>
                  Detailed Feedback
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingState.improvements ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className={gradingState.improvements ? "text-green-600" : "text-muted-foreground"}>
                  Improvement Suggestions
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingState.improvedPrompt ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className={gradingState.improvedPrompt ? "text-green-600" : "text-muted-foreground"}>
                  Improved Prompt
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Your Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt to achieve the goal above..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 resize-none"
              disabled={isLoading || isLoadingGoal || !sessionOpen}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLoadingGoal || !prompt.trim() || !sessionOpen}
          >
            {isLoading ? "Evaluating..." : sessionOpen ? "Evaluate Prompt" : "Submissions Closed"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
