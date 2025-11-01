"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { AdminNav } from "@/components/admin-nav"

type Submission = {
  id: string
  timestamp: string
  userId: string
  stage: number
  prompt: string
  targetOutput: string
  effectivenessScore: number
  clarity: number
  specificity: number
  efficiency: number
  tokens: number
  estimatedCO2: number
  userRating?: number | null
}

type UserProgress = {
  userId: string
  stage1Score: number | null
  stage2Score: number | null
  improvement: number | null
  stage1Submissions: number
  stage2Submissions: number
}

type SessionFeedback = {
  id: number
  userId: string
  rating: number
  message: string | null
  timestamp: string
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback[]>([])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const url = sessionId ? `/api/submissions?session=${sessionId}` : "/api/submissions"
      const response = await fetch(url)
      const data = await response.json()
      setSubmissions(data.submissions || [])

      if (sessionId) {
        const sessionResponse = await fetch("/api/sessions")
        const sessionData = await sessionResponse.json()
        const session = sessionData.sessions.find((s: any) => s.id === Number(sessionId))
        setSessionName(session?.name || null)
      }

      const feedbackResponse = await fetch("/api/feedback")
      const feedbackData = await feedbackResponse.json()
      setSessionFeedback(feedbackData.feedback || [])
    } catch (error) {
      console.error("[v0] Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [sessionId])

  const stage1Submissions = submissions.filter((s) => s.stage === 1)
  const stage2Submissions = submissions.filter((s) => s.stage === 2)

  const stage1AvgScore =
    stage1Submissions.length > 0
      ? (stage1Submissions.reduce((sum, s) => sum + s.effectivenessScore, 0) / stage1Submissions.length).toFixed(1)
      : "0"

  const stage2AvgScore =
    stage2Submissions.length > 0
      ? (stage2Submissions.reduce((sum, s) => sum + s.effectivenessScore, 0) / stage2Submissions.length).toFixed(1)
      : "0"

  const avgImprovement =
    stage1Submissions.length > 0 && stage2Submissions.length > 0
      ? (Number.parseFloat(stage2AvgScore) - Number.parseFloat(stage1AvgScore)).toFixed(1)
      : "0"

  const userProgress: UserProgress[] = []
  const userMap = new Map<string, UserProgress>()

  submissions.forEach((sub) => {
    if (!userMap.has(sub.userId)) {
      userMap.set(sub.userId, {
        userId: sub.userId,
        stage1Score: null,
        stage2Score: null,
        improvement: null,
        stage1Submissions: 0,
        stage2Submissions: 0,
      })
    }

    const user = userMap.get(sub.userId)!
    if (sub.stage === 1) {
      user.stage1Submissions++
      if (user.stage1Score === null || sub.effectivenessScore > user.stage1Score) {
        user.stage1Score = sub.effectivenessScore
      }
    } else if (sub.stage === 2) {
      user.stage2Submissions++
      if (user.stage2Score === null || sub.effectivenessScore > user.stage2Score) {
        user.stage2Score = sub.effectivenessScore
      }
    }
  })

  userMap.forEach((user) => {
    if (user.stage1Score !== null && user.stage2Score !== null) {
      user.improvement = user.stage2Score - user.stage1Score
    }
    userProgress.push(user)
  })

  userProgress.sort((a, b) => (b.improvement || 0) - (a.improvement || 0))

  const totalTokens = submissions.reduce((sum, s) => sum + s.tokens, 0)
  const totalCO2 = submissions.reduce((sum, s) => sum + s.estimatedCO2, 0).toFixed(2)

  const userDisplayNames = new Map<string, string>()
  let userCounter = 1

  const sortedUserIds = Array.from(new Set(submissions.map((s) => s.userId))).sort((a, b) => {
    const aFirstSubmission = submissions.find((s) => s.userId === a)?.timestamp || ""
    const bFirstSubmission = submissions.find((s) => s.userId === b)?.timestamp || ""
    return aFirstSubmission.localeCompare(bFirstSubmission)
  })

  sortedUserIds.forEach((userId) => {
    userDisplayNames.set(userId, `User ${userCounter}`)
    userCounter++
  })

  const ratedSubmissions = submissions.filter((s) => s.userRating !== null && s.userRating !== undefined)
  const avgUserRating =
    ratedSubmissions.length > 0
      ? (ratedSubmissions.reduce((sum, s) => sum + (s.userRating || 0), 0) / ratedSubmissions.length).toFixed(1)
      : "0"

  const avgSessionRating =
    sessionFeedback.length > 0
      ? (sessionFeedback.reduce((sum, f) => sum + f.rating, 0) / sessionFeedback.length).toFixed(1)
      : "0"

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Workshop Analytics</h1>
              <p className="mt-2 text-slate-600">
                {sessionName ? `Session: ${sessionName}` : "Track student progress across workshop stages"}
              </p>
            </div>
            <div className="flex gap-2">
              {sessionId && (
                <Button onClick={() => (window.location.href = "/analytics")} variant="outline">
                  View All Sessions
                </Button>
              )}
              <Button onClick={fetchSubmissions} variant="outline">
                🔄 Refresh
              </Button>
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Submissions</CardDescription>
                <CardTitle className="text-3xl">{submissions.length}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Stage 1 Avg Score</CardDescription>
                <CardTitle className="text-3xl">{stage1AvgScore}%</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Stage 2 Avg Score</CardDescription>
                <CardTitle className="text-3xl">{stage2AvgScore}%</CardTitle>
              </CardHeader>
            </Card>

            <Card className={Number.parseFloat(avgImprovement) > 0 ? "border-green-200 bg-green-50" : ""}>
              <CardHeader className="pb-2">
                <CardDescription>Avg Improvement</CardDescription>
                <CardTitle className={`text-3xl ${Number.parseFloat(avgImprovement) > 0 ? "text-green-600" : ""}`}>
                  {Number.parseFloat(avgImprovement) > 0 ? "+" : ""}
                  {avgImprovement}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unique Users</CardDescription>
                <CardTitle className="text-3xl">{userProgress.length}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardDescription>Avg Eval Rating</CardDescription>
                <CardTitle className="text-3xl text-yellow-700">{avgUserRating} ⭐</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-600">{ratedSubmissions.length} ratings</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardDescription>Session Rating</CardDescription>
                <CardTitle className="text-3xl text-purple-700">{avgSessionRating} ⭐</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-600">{sessionFeedback.length} responses</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Individual User Progress</CardTitle>
              <CardDescription>Track how each student improved from Stage 1 to Stage 2</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">Loading data...</div>
              ) : userProgress.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No user data yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm font-medium text-slate-600">
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 pr-4 text-center">Stage 1 Score</th>
                        <th className="pb-3 pr-4 text-center">Stage 2 Score</th>
                        <th className="pb-3 pr-4 text-center">Improvement</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userProgress.map((user) => (
                        <tr key={user.userId} className="border-b text-sm">
                          <td className="py-3 pr-4 font-medium text-slate-900">{userDisplayNames.get(user.userId)}</td>
                          <td className="py-3 pr-4 text-center">
                            {user.stage1Score !== null ? (
                              <span className="font-semibold text-slate-700">{user.stage1Score}%</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {user.stage2Score !== null ? (
                              <span className="font-semibold text-slate-700">{user.stage2Score}%</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {user.improvement !== null ? (
                              <span
                                className={`font-bold ${
                                  user.improvement > 0
                                    ? "text-green-600"
                                    : user.improvement < 0
                                      ? "text-red-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {user.improvement > 0 ? "+" : ""}
                                {user.improvement}%
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {user.stage1Score !== null && user.stage2Score !== null ? (
                              <Badge variant="default" className="bg-green-100 text-green-700">
                                Complete
                              </Badge>
                            ) : user.stage1Score !== null ? (
                              <Badge variant="secondary">Stage 1 Only</Badge>
                            ) : (
                              <Badge variant="secondary">Stage 2 Only</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>Complete history of prompt evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No submissions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm font-medium text-slate-600">
                        <th className="pb-3 pr-4">Time</th>
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 pr-4 text-center">Stage</th>
                        <th className="pb-3 pr-4">Prompt</th>
                        <th className="pb-3 pr-4 text-center">Score</th>
                        <th className="pb-3 pr-4 text-center">Clarity</th>
                        <th className="pb-3 pr-4 text-center">Specificity</th>
                        <th className="pb-3 pr-4 text-center">Efficiency</th>
                        <th className="pb-3 text-center">User Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions
                        .slice()
                        .reverse()
                        .map((submission) => (
                          <tr key={submission.id} className="border-b text-sm">
                            <td className="py-3 pr-4 text-slate-600">
                              {new Date(submission.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 pr-4 font-medium text-slate-700">
                              {userDisplayNames.get(submission.userId)}
                            </td>
                            <td className="py-3 pr-4 text-center">
                              <Badge variant={submission.stage === 1 ? "secondary" : "default"}>
                                Stage {submission.stage}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 max-w-md truncate text-slate-700">{submission.prompt}</td>
                            <td className="py-3 pr-4 text-center">
                              <span
                                className={`font-semibold ${
                                  submission.effectivenessScore >= 80
                                    ? "text-green-600"
                                    : submission.effectivenessScore >= 60
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }`}
                              >
                                {submission.effectivenessScore}%
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-center text-slate-600">{submission.clarity}%</td>
                            <td className="py-3 pr-4 text-center text-slate-600">{submission.specificity}%</td>
                            <td className="py-3 pr-4 text-center text-slate-600">{submission.efficiency}%</td>
                            <td className="py-3 text-center">
                              {submission.userRating ? (
                                <span className="text-yellow-600 font-medium">{submission.userRating} ⭐</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Session Feedback</CardTitle>
              <CardDescription>Overall workshop feedback from participants</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">Loading feedback...</div>
              ) : sessionFeedback.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No session feedback yet</div>
              ) : (
                <div className="space-y-4">
                  {sessionFeedback.map((feedback) => (
                    <div key={feedback.id} className="rounded-lg border bg-card p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">
                            {userDisplayNames.get(feedback.userId) || "Anonymous"}
                          </span>
                          <span className="text-yellow-600 font-medium">{feedback.rating} ⭐</span>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(feedback.timestamp).toLocaleString()}</span>
                      </div>
                      {feedback.message && <p className="text-sm text-slate-600 leading-relaxed">{feedback.message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
