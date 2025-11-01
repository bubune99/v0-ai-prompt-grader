"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Submission = {
  id: string
  timestamp: string
  prompt: string
  targetOutput: string
  effectivenessScore: number
  clarity: number
  specificity: number
  efficiency: number
  tokens: number
  estimatedCO2: number
}

export default function AnalyticsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/submissions")
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error("[v0] Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const averageScore =
    submissions.length > 0
      ? (submissions.reduce((sum, s) => sum + s.effectivenessScore, 0) / submissions.length).toFixed(1)
      : "0"

  const totalTokens = submissions.reduce((sum, s) => sum + s.tokens, 0)
  const totalCO2 = submissions.reduce((sum, s) => sum + s.estimatedCO2, 0).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="mt-2 text-slate-600">Track student prompt submissions and performance</p>
          </div>
          <Button onClick={fetchSubmissions} variant="outline">
            🔄 Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Submissions</CardDescription>
              <CardTitle className="text-3xl">{submissions.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{averageScore}%</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tokens Used</CardDescription>
              <CardTitle className="text-3xl">{totalTokens.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total CO₂ (mg)</CardDescription>
              <CardTitle className="text-3xl">{totalCO2}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest prompt evaluations from students</CardDescription>
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
                      <th className="pb-3 pr-4">Goal</th>
                      <th className="pb-3 pr-4">Prompt</th>
                      <th className="pb-3 pr-4 text-center">Score</th>
                      <th className="pb-3 pr-4 text-center">Clarity</th>
                      <th className="pb-3 pr-4 text-center">Specificity</th>
                      <th className="pb-3 pr-4 text-center">Efficiency</th>
                      <th className="pb-3 text-center">Tokens</th>
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
                          <td className="py-3 pr-4 max-w-xs truncate text-slate-700">{submission.targetOutput}</td>
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
                          <td className="py-3 text-center text-slate-600">{submission.tokens}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
