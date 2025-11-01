"use client"

import { useState } from "react"
import { PromptInput } from "@/components/prompt-input"
import { ResultsDashboard } from "@/components/results-dashboard"
import { Footer } from "@/components/footer"

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
  const [currentStage, setCurrentStage] = useState(1)

  const handleReset = () => {
    setResult(null)
  }

  const handleNextStage = () => {
    setCurrentStage(2)
    setResult(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="mb-3 font-sans text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Prompt Grader
            </h1>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Evaluate your prompts for effectiveness, efficiency, and sustainability. Get AI-powered feedback and
              improvements.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm font-semibold text-primary">Stage {currentStage}</span>
              {currentStage === 2 && <span className="text-xs text-muted-foreground">(Post-Workshop)</span>}
            </div>
          </div>

          {!result ? (
            <PromptInput onComplete={setResult} currentStage={currentStage} />
          ) : (
            <ResultsDashboard
              result={result}
              onReset={handleReset}
              currentStage={currentStage}
              onNextStage={currentStage === 1 ? handleNextStage : undefined}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
