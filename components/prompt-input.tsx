"use client"

import type React from "react"
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
  const [criteria, setCriteria] = useState<Array<{ name: string; description: string }>>([])
  const [userId, setUserId] = useState("")
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
  const [sessionOpen, setSessionOpen] = useState(true)
  const [sessionMessage, setSessionMessage] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)

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
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.session) {
        const goalText = currentStage === 1 ? data.session.stage1_goal : data.session.stage2_goal
        const criteriaData = currentStage === 1 ? data.session.stage1_criteria : data.session.stage2_criteria

        setGoal(goalText)
        setCriteria(criteriaData || [])
        setSessionOpen(data.session.is_open)
        if (!data.session.is_open) {
          setSessionMessage("Submissions are currently closed. Please check back later.")
        }
      } else {
        setSessionOpen(false)
        setSessionMessage("No active session available. Please contact the administrator.")
      }
    } catch (error) {
      console.error("Error fetching active session:", error)
      setGoal("Write a professional email to a client explaining a project delay")
      setCriteria([
        { name: "Clarity", description: "How clear and understandable the prompt is" },
        { name: "Specificity", description: "How specific and detailed the prompt is" },
        { name: "Efficiency", description: "How efficient the prompt is" },
      ])
      setSessionOpen(false)
      setSessionMessage("Unable to connect to the server. Please try again later.")
    } finally {
      setIsLoadingGoal(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim() || !goal || !sessionOpen) {
      return
    }

    setIsEvaluating(true)

    onComplete(null)

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          targetOutput: goal,
          criteria,
          userId,
          stage: currentStage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to evaluate prompt")
      }

      const result = await response.json()
      onComplete(result)
    } catch (error: any) {
      console.error("Evaluation error:", error)
      alert(error.message || "Failed to evaluate prompt. Please try again.")
      setIsEvaluating(false)
    }
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Submit Your Prompt - Stage {currentStage}</CardTitle>
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
          <p className="mb-1 text-sm font-semibold text-primary">Target Response Format:</p>
          {isLoadingGoal ? (
            <p className="text-sm text-muted-foreground">Loading goal...</p>
          ) : (
            <p className="text-foreground">{goal}</p>
          )}
        </div>

        {isEvaluating && (
          <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-blue-600">
                Evaluating your prompt... This may take a few moments.
              </p>
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
              disabled={isEvaluating || isLoadingGoal || !sessionOpen}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isEvaluating || isLoadingGoal || !prompt.trim() || !sessionOpen}
          >
            {isEvaluating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : sessionOpen ? (
              "Evaluate Prompt"
            ) : (
              "Submissions Closed"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
