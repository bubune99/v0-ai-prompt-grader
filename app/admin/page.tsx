"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AdminPage() {
  const [goal, setGoal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchCurrentGoal()
  }, [])

  const fetchCurrentGoal = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/goal")
      const data = await response.json()
      setGoal(data.goal)
    } catch (error) {
      console.error("[v0] Error fetching goal:", error)
      setMessage("Failed to load current goal")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      })

      if (!response.ok) throw new Error("Failed to update goal")

      setMessage("Goal updated successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error updating goal:", error)
      setMessage("Failed to update goal")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 font-sans text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Set the prompt goal/task that students will work towards</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prompt Goal Configuration</CardTitle>
            <CardDescription>
              Define what students should achieve with their prompts. This will be displayed to students and used by the
              AI for evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="goal">Prompt Goal/Task</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Write a professional email to a client explaining a project delay"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-32 resize-none"
                  disabled={isLoading || isSaving}
                />
                <p className="text-sm text-muted-foreground">
                  Students will see this goal and craft prompts to achieve it. The AI will evaluate how well their
                  prompts accomplish this task.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isLoading || isSaving || !goal.trim()}>
                  {isSaving ? "Saving..." : "Update Goal"}
                </Button>
                {message && (
                  <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                    {message}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How students will see the goal on the main page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">Current Goal:</p>
                <p className="mt-2 text-foreground">{goal || "No goal set"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
