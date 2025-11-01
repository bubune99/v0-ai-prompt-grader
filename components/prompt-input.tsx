"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type PromptInputProps = {
  onEvaluate: (prompt: string, targetOutput: string) => void
  isLoading: boolean
}

export function PromptInput({ onEvaluate, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("")
  const [goal, setGoal] = useState("")
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)

  useEffect(() => {
    fetchGoal()
  }, [])

  const fetchGoal = async () => {
    try {
      const response = await fetch("/api/goal")
      const data = await response.json()
      setGoal(data.goal)
    } catch (error) {
      console.error("[v0] Error fetching goal:", error)
      setGoal("Write a professional email to a client explaining a project delay")
    } finally {
      setIsLoadingGoal(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && goal) {
      onEvaluate(prompt, goal)
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
              disabled={isLoading || isLoadingGoal}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isLoadingGoal || !prompt.trim()}>
            {isLoading ? "Evaluating..." : "Evaluate Prompt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
