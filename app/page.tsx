"use client"

import { useState } from "react"
import { PromptInput } from "@/components/prompt-input"
import { ResultsDashboard } from "@/components/results-dashboard"
import { SessionFeedback } from "@/components/session-feedback"
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

type WizardStep = 1 | 2 | 3 | 4 | 5

export default function Home() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [stage1Result, setStage1Result] = useState<EvaluationResult | null>(null)
  const [stage2Result, setStage2Result] = useState<EvaluationResult | null>(null)
  const [isLoadingStage1, setIsLoadingStage1] = useState(false)
  const [isLoadingStage2, setIsLoadingStage2] = useState(false)

  const handleStage1Complete = (evaluationResult: EvaluationResult | null) => {
    if (evaluationResult === null) {
      console.log("[v0] Stage 1 starting evaluation, showing loading state")
      setIsLoadingStage1(true)
      setCurrentStep(2)
    } else {
      console.log("[v0] Stage 1 evaluation complete, showing results")
      setStage1Result(evaluationResult)
      setIsLoadingStage1(false)
    }
  }

  const handleContinueToStage2 = () => {
    console.log("[v0] Continuing to Stage 2 input")
    setCurrentStep(3)
  }

  const handleStage2Complete = (evaluationResult: EvaluationResult | null) => {
    if (evaluationResult === null) {
      console.log("[v0] Stage 2 starting evaluation, showing loading state")
      setIsLoadingStage2(true)
      setCurrentStep(4)
    } else {
      console.log("[v0] Stage 2 evaluation complete, showing results")
      setStage2Result(evaluationResult)
      setIsLoadingStage2(false)
    }
  }

  const handleContinueToFeedback = () => {
    console.log("[v0] Continuing to feedback form")
    setCurrentStep(5)
  }

  const handleFeedbackComplete = () => {
    console.log("[v0] Session complete!")
    // Could redirect to thank you page or reset
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
            {currentStep <= 4 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className={`h-2 w-16 rounded-full ${currentStep >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`h-2 w-16 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
                <div className={`h-2 w-16 rounded-full ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
                <div className={`h-2 w-16 rounded-full ${currentStep >= 4 ? "bg-primary" : "bg-muted"}`} />
              </div>
            )}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm font-semibold text-primary">
                {currentStep <= 2 ? "Stage 1" : currentStep <= 4 ? "Stage 2" : "Complete"}
              </span>
            </div>
          </div>

          {currentStep === 1 && <PromptInput onComplete={handleStage1Complete} currentStage={1} />}

          {currentStep === 2 && (
            <ResultsDashboard
              result={stage1Result}
              currentStage={1}
              onNextStage={handleContinueToStage2}
              isLoading={isLoadingStage1}
            />
          )}

          {currentStep === 3 && <PromptInput onComplete={handleStage2Complete} currentStage={2} />}

          {currentStep === 4 && (
            <ResultsDashboard
              result={stage2Result}
              currentStage={2}
              stage1Result={stage1Result}
              onNextStage={handleContinueToFeedback}
              isLoading={isLoadingStage2}
            />
          )}

          {currentStep === 5 && <SessionFeedback onComplete={handleFeedbackComplete} />}
        </div>
      </main>
      <Footer />
    </div>
  )
}
