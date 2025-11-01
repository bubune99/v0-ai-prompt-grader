import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { sql } from "@/lib/db"

export const maxDuration = 30

const evaluationSchema = z.object({
  effectivenessScore: z.number().min(0).max(100).describe("Overall effectiveness of the prompt in achieving the goal"),
  clarity: z.number().min(0).max(100).describe("How clear and unambiguous the prompt is"),
  specificity: z.number().min(0).max(100).describe("How specific and detailed the prompt is"),
  efficiency: z.number().min(0).max(100).describe("How concise yet complete the prompt is"),
  feedback: z.string().describe("Detailed feedback explaining strengths and weaknesses"),
  improvements: z.array(z.string()).describe("3-5 specific improvements that could be made"),
  improvedPrompt: z.string().describe("An improved version of the prompt"),
})

export async function POST(req: Request) {
  try {
    const { prompt, targetOutput, userId, stage } = await req.json()

    console.log("[v0] Evaluating prompt:", { prompt, targetOutput, userId, stage })

    if (!prompt || !targetOutput || !userId || !stage) {
      return Response.json({ error: "Prompt, target output, userId, and stage are required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OPENAI_API_KEY is not set")
      return Response.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    // Check for active session
    const activeSession = await sql`
      SELECT id, is_open FROM sessions WHERE is_open = true ORDER BY created_at DESC LIMIT 1
    `

    if (activeSession.length === 0 || !activeSession[0].is_open) {
      return Response.json({ error: "No active session. Submissions are currently closed." }, { status: 403 })
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

    let evaluation
    let usage

    try {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: evaluationSchema,
        prompt: evaluationPrompt,
        mode: "json",
      })

      evaluation = result.object
      usage = result.usage

      console.log("[v0] Generated evaluation successfully")
    } catch (aiError: any) {
      console.error("[v0] AI SDK Error:", {
        message: aiError.message,
        cause: aiError.cause,
        name: aiError.name,
      })

      return Response.json(
        {
          error: "Failed to generate evaluation. Please try again.",
          details: aiError.message,
        },
        { status: 500 },
      )
    }

    // Calculate sustainability metrics
    const totalTokens = (usage?.promptTokens || 0) + (usage?.completionTokens || 0)
    const estimatedCO2 = (totalTokens * 0.0004).toFixed(2)
    const estimatedCost = totalTokens * 0.00002

    // Save to database
    try {
      await sql`
        INSERT INTO submissions (
          session_id, user_id, stage, prompt, goal,
          overall_score, clarity_score, specificity_score, 
          efficiency_score, effectiveness_score,
          token_count, co2_grams, feedback, improved_prompt
        ) VALUES (
          ${activeSession[0].id}, ${userId}, ${stage}, ${prompt}, ${targetOutput},
          ${evaluation.effectivenessScore}, ${evaluation.clarity}, ${evaluation.specificity},
          ${evaluation.efficiency}, ${evaluation.effectivenessScore},
          ${totalTokens}, ${Number.parseFloat(estimatedCO2)}, ${evaluation.feedback}, ${evaluation.improvedPrompt}
        )
      `
      console.log("[v0] Saved evaluation to database")
    } catch (dbError) {
      console.error("[v0] Failed to save submission to database:", dbError)
    }

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

    return Response.json(result)
  } catch (error: any) {
    console.error("[v0] Error evaluating prompt:", error.message || error)
    return Response.json(
      {
        error: "Failed to evaluate prompt",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
