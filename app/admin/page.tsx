"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { AdminNav } from "@/components/admin-nav"

type Session = {
  id: number
  name: string
  stage1_goal: string
  stage2_goal: string
  is_open: boolean
  created_at: string
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [newSessionName, setNewSessionName] = useState("")
  const [stage1Goal, setStage1Goal] = useState("")
  const [stage2Goal, setStage2Goal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sessions")
      const data = await response.json()
      setSessions(data.sessions)

      // Select the first open session or the most recent one
      const openSession = data.sessions.find((s: Session) => s.is_open)
      const sessionToSelect = openSession || data.sessions[0]

      if (sessionToSelect) {
        setSelectedSession(sessionToSelect)
        setStage1Goal(sessionToSelect.stage1_goal)
        setStage2Goal(sessionToSelect.stage2_goal)
      }
    } catch (error) {
      console.error("[v0] Error fetching sessions:", error)
      setMessage("Failed to load sessions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSessionName.trim() || !stage1Goal.trim() || !stage2Goal.trim()) return

    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSessionName,
          stage1_goal: stage1Goal,
          stage2_goal: stage2Goal,
        }),
      })

      if (!response.ok) throw new Error("Failed to create session")

      const data = await response.json()
      setMessage("Session created successfully!")
      setNewSessionName("")
      fetchSessions()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error creating session:", error)
      setMessage("Failed to create session")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSession = async (sessionId: number, currentState: boolean) => {
    try {
      const response = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, is_open: !currentState }),
      })

      if (!response.ok) throw new Error("Failed to toggle session")

      setMessage(`Session ${!currentState ? "opened" : "closed"} successfully!`)
      fetchSessions()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error toggling session:", error)
      setMessage("Failed to toggle session")
    }
  }

  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession) return

    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSession.id,
          stage1_goal: stage1Goal,
          stage2_goal: stage2Goal,
        }),
      })

      if (!response.ok) throw new Error("Failed to update goals")

      setMessage("Goals updated successfully!")
      fetchSessions()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error updating goals:", error)
      setMessage("Failed to update goals")
    } finally {
      setIsSaving(false)
    }
  }

  const selectSession = (session: Session) => {
    setSelectedSession(session)
    setStage1Goal(session.stage1_goal)
    setStage2Goal(session.stage2_goal)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 font-sans text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage workshop sessions and control submissions</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sessions List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>Manage workshop sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selectedSession?.id === session.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => selectSession(session)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{session.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={session.is_open ? "default" : "secondary"} className="shrink-0">
                        {session.is_open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleSession(session.id, session.is_open)
                      }}
                    >
                      {session.is_open ? "Close Session" : "Open Session"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/analytics?session=${session.id}`
                      }}
                    >
                      📊 View Analytics
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Session Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create New Session */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Session</CardTitle>
                  <CardDescription>Start a new workshop session with custom goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSession} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionName">Session Name</Label>
                      <Input
                        id="sessionName"
                        placeholder="e.g., Spring 2024 Workshop"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newStage1">Stage 1 Goal (Pre-Workshop)</Label>
                      <Textarea
                        id="newStage1"
                        placeholder="Enter the goal for stage 1..."
                        value={stage1Goal}
                        onChange={(e) => setStage1Goal(e.target.value)}
                        className="min-h-20 resize-none"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newStage2">Stage 2 Goal (Post-Workshop)</Label>
                      <Textarea
                        id="newStage2"
                        placeholder="Enter the goal for stage 2..."
                        value={stage2Goal}
                        onChange={(e) => setStage2Goal(e.target.value)}
                        className="min-h-20 resize-none"
                        disabled={isSaving}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSaving || !newSessionName.trim() || !stage1Goal.trim() || !stage2Goal.trim()}
                    >
                      {isSaving ? "Creating..." : "Create Session"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Edit Selected Session */}
              {selectedSession && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Session: {selectedSession.name}</CardTitle>
                    <CardDescription>Update goals for this session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateGoals} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editStage1">Stage 1 Goal</Label>
                        <Textarea
                          id="editStage1"
                          value={stage1Goal}
                          onChange={(e) => setStage1Goal(e.target.value)}
                          className="min-h-20 resize-none"
                          disabled={isSaving}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editStage2">Stage 2 Goal</Label>
                        <Textarea
                          id="editStage2"
                          value={stage2Goal}
                          onChange={(e) => setStage2Goal(e.target.value)}
                          className="min-h-20 resize-none"
                          disabled={isSaving}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <Button type="submit" disabled={isSaving || !stage1Goal.trim() || !stage2Goal.trim()}>
                          {isSaving ? "Saving..." : "Update Goals"}
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
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
