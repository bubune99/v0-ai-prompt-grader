"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { EvaluationResult } from "@/app/page"

type ResultsDashboardProps = {
  result: EvaluationResult
  onReset: () => void
}

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
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

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Effectiveness Score</CardTitle>
              <CardDescription>Based on clarity, specificity, and efficiency</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {getScoreBadge(result.effectivenessScore)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(result.effectivenessScore)}`}>
              {result.effectivenessScore}
            </div>
            <div className="mb-2 text-3xl text-muted-foreground">/100</div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clarity</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.clarity}/100</div>
            <Progress value={result.clarity} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Specificity</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.specificity}/100</div>
            <Progress value={result.specificity} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.efficiency}/100</div>
            <Progress value={result.efficiency} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Sustainability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            Sustainability Metrics
          </CardTitle>
          <CardDescription>Energy consumption and environmental impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>⚡</span>
                Tokens Used
              </div>
              <div className="text-2xl font-bold">{result.energyConsumption.tokens.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>🌱</span>
                Est. CO₂ Emissions
              </div>
              <div className="text-2xl font-bold">{result.energyConsumption.estimatedCO2}g</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>💰</span>
                Est. Cost
              </div>
              <div className="text-2xl font-bold">${result.energyConsumption.estimatedCost.toFixed(4)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            AI Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-pretty leading-relaxed text-foreground">{result.feedback}</p>
        </CardContent>
      </Card>

      {/* Improvements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            Key Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">✓</span>
                <span className="text-sm leading-relaxed">{improvement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Improved Prompt */}
      <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            Improved Prompt
          </CardTitle>
          <CardDescription>Optimized version for better results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-mono text-sm leading-relaxed text-foreground">{result.improvedPrompt}</p>
          </div>
        </CardContent>
      </Card>

      {/* Try Again Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onReset} size="lg" variant="outline" className="gap-2 bg-transparent">
          <span>↻</span>
          Try Another Prompt
        </Button>
      </div>
    </div>
  )
}
