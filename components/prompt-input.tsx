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
  stage: 1 | 2
}

export function PromptInput({ onComplete, stage }: PromptInputProps) {
  const [prompt, setPrompt] = useState("")
  const [goal, setGoal] = useState("")
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
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
        const state = toolCall.result.gradingState || gradingState
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
    fetchGoal()
  }, [stage]) // Refetch goal when stage changes

  const fetchGoal = async () => {
    try {
      const response = await fetch(`/api/goal?stage=${stage}`)
      const data = await response.json()
      setGoal(data.goal)
    } catch (error) {
      console.error("[v0] Error fetching goal:", error)
      setGoal(
        stage === 1
          ? "Write a professional email to a client explaining a project delay"
          : "Write a comprehensive marketing strategy for a new product launch",
      )
    } finally {
      setIsLoadingGoal(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && goal) {
      setSubmittedPrompt(prompt)
      setSubmittedGoal(goal)
      setGradingState({})
      append({
        role: "user",
        content: "Evaluate this prompt.",
      })
    }
  }

  // Show evaluation progress if we have started evaluating
  const showProgress = isLoading || messages.length > 0

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>
          {showProgress ? `Evaluating Your Stage ${stage} Prompt` : `Submit Your Stage ${stage} Prompt`}
        </CardTitle>
        <CardDescription>
          {showProgress
            ? "The AI is analyzing your prompt and filling in the grading boxes..."
            : "Write a prompt that will help achieve the goal below. We'll evaluate its effectiveness and provide improvement suggestions."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="mb-1 text-sm font-semibold text-primary">Stage {stage} Goal:</p>
          {isLoadingGoal ? (
            <p className="text-sm text-muted-foreground">Loading goal...</p>
          ) : (
            <p className="text-foreground">{goal}</p>
          )}
        </div>

        {showProgress ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="mb-1 text-sm font-semibold">Your Prompt:</p>
              <p className="text-muted-foreground">{submittedPrompt}</p>
            </div>

            {/* Progress indicators */}
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm">
                {gradingState.clarity !== undefined ? (
                  <span className="text-green-600">✓ Clarity Score</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {gradingState.clarity !== undefined && (
                  <span className="text-muted-foreground">({gradingState.clarity})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {gradingState.specificity !== undefined ? (
                  <span className="text-green-600">✓ Specificity Score</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {gradingState.specificity !== undefined && (
                  <span className="text-muted-foreground">({gradingState.specificity})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {gradingState.efficiency !== undefined ? (
                  <span className="text-green-600">✓ Efficiency Score</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {gradingState.efficiency !== undefined && (
                  <span className="text-muted-foreground">({gradingState.efficiency})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {gradingState.effectivenessScore !== undefined ? (
                  <span className="text-green-600">✓ Effectiveness Score</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {gradingState.effectivenessScore !== undefined && (
                  <span className="text-muted-foreground">({gradingState.effectivenessScore})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {gradingState.feedback ? (
                  <span className="text-green-600">✓ Feedback</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {gradingState.improvements ? (
                  <span className="text-green-600">✓ Improvements</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {gradingState.improvements && (
                  <span className="text-muted-foreground">({gradingState.improvements.length})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {gradingState.improvedPrompt ? (
                  <span className="text-green-600">✓ Improved Prompt</span>
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Your Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt to achieve the goal above..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 resize-none"
                disabled={isLoading || isLoadingGoal}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isLoadingGoal || !prompt.trim()}>
              {isLoading ? "Evaluating..." : "Evaluate Prompt"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
