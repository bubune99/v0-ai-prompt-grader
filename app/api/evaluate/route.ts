import { generateText } from "ai"
import { z } from "zod"

export const maxDuration = 30

const evaluationSchema = z.object({
  effectivenessScore: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  efficiency: z.number().min(0).max(100),
  feedback: z.string(),
  improvements: z.array(z.string()),
  improvedPrompt: z.string(),
})

export async function POST(req: Request) {
  try {
    const { prompt, targetOutput } = await req.json()

    if (!prompt || !targetOutput) {
      return Response.json({ error: "Prompt and target output are required" }, { status: 400 })
    }

    const evaluationPrompt = `You are an expert prompt engineer. Evaluate the following prompt based on how well it would achieve the specified goal.

USER'S PROMPT:
"${prompt}"

GOAL TO ACHIEVE:
"${targetOutput}"

Evaluate the prompt on these criteria (0-100 scale):
1. CLARITY: How clear and unambiguous is the prompt?
2. SPECIFICITY: How specific and detailed is the prompt for achieving the goal?
3. EFFICIENCY: How concise yet complete is the prompt?

Calculate an OVERALL EFFECTIVENESS SCORE (0-100) as a weighted average, focusing on how well this prompt would help an AI achieve the stated goal.

Provide:
- Detailed feedback explaining strengths and weaknesses in relation to the goal
- 3-5 specific improvements that could be made to better achieve the goal
- An improved version of the prompt that would more effectively achieve the goal

Be constructive and educational in your feedback.`

    const { text, usage } = await generateText({
      model: "openai/gpt-4o",
      prompt: evaluationPrompt,
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    // Parse the AI response to extract structured data
    const structuredPrompt = `Extract the evaluation metrics from this analysis and return them in JSON format:

${text}

Return a JSON object with:
- effectivenessScore (number 0-100)
- clarity (number 0-100)
- specificity (number 0-100)
- efficiency (number 0-100)
- feedback (string with detailed explanation)
- improvements (array of 3-5 improvement suggestions)
- improvedPrompt (the improved version of the prompt)`

    const { object } = await generateText({
      model: "openai/gpt-4o",
      prompt: structuredPrompt,
      maxOutputTokens: 1500,
      temperature: 0.3,
      output: "json",
    })

    const evaluation = evaluationSchema.parse(JSON.parse(object as string))

    // Calculate sustainability metrics
    const totalTokens = (usage?.promptTokens || 0) + (usage?.completionTokens || 0)
    const estimatedCO2 = (totalTokens * 0.0004).toFixed(2) // Rough estimate: 0.4mg CO2 per token
    const estimatedCost = totalTokens * 0.00002 // Rough estimate: $0.02 per 1K tokens

    const result = {
      originalPrompt: prompt,
      targetOutput,
      ...evaluation,
      energyConsumption: {
        tokens: totalTokens,
        estimatedCO2: Number.parseFloat(estimatedCO2),
        estimatedCost,
      },
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          targetOutput,
          effectivenessScore: evaluation.effectivenessScore,
          clarity: evaluation.clarity,
          specificity: evaluation.specificity,
          efficiency: evaluation.efficiency,
          tokens: totalTokens,
          estimatedCO2: Number.parseFloat(estimatedCO2),
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to save submission to analytics:", error)
      // Don't fail the request if analytics fails
    }

    return Response.json(result)
  } catch (error) {
    console.error("[v0] Error evaluating prompt:", error)
    return Response.json({ error: "Failed to evaluate prompt" }, { status: 500 })
  }
}
