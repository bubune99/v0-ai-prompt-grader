"use client"

import { useState } from "react"
import { PromptInput } from "@/components/prompt-input"
import { ResultsDashboard } from "@/components/results-dashboard"

export type EvaluationResult = {
  originalPrompt: string
  targetOutput: string
  effectivenessScore: number
  clarity: number
  specificity: number
  efficiency: number
  energyConsumption: {
    tokens: number
    estimatedCO2: number
    estimatedCost: number
  }
  improvedPrompt: string
  feedback: string
  improvements: string[]
}

export default function Home() {
  const [result, setResult] = useState<EvaluationResult | null>(null)

  const handleReset = () => {
    setResult(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-3 font-sans text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Prompt Grader
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Evaluate your prompts for effectiveness, efficiency, and sustainability. Get AI-powered feedback and
            improvements.
          </p>
        </div>

        {!result ? <PromptInput onComplete={setResult} /> : <ResultsDashboard result={result} onReset={handleReset} />}
      </div>
    </main>
  )
}
