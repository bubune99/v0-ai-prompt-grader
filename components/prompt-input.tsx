"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type PromptInputProps = {
  onEvaluate: (prompt: string, targetOutput: string, userId: string) => void
  isLoading: boolean
  currentStage: number
}

function generateAnonymousId(): string {
  return `user_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
}

export function PromptInput({ onEvaluate, isLoading, currentStage }: PromptInputProps) {
  const [prompt, setPrompt] = useState("")
  const [goal, setGoal] = useState("")
  const [userId, setUserId] = useState("")
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
  const [sessionOpen, setSessionOpen] = useState(true)
  const [sessionMessage, setSessionMessage] = useState("")

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
      onEvaluate(prompt, goal, userId)
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
