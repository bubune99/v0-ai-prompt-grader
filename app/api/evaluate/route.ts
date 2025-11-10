import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { sql } from "@/lib/db"

export const maxDuration = 30

const createEvaluationSchema = (criteriaNames: string[]) => {
  const criteriaScores: Record<string, any> = {}
  criteriaNames.forEach((name) => {
    criteriaScores[name] = z.number().min(0).max(100).describe(`Score for ${name} (0-100)`)
  })

  return z.object({
    effectivenessScore: z
      .number()
      .min(0)
      .max(100)
      .describe("Overall effectiveness of the prompt in achieving the goal"),
    criteriaScores: z.object(criteriaScores),
    feedback: z.string().describe("Detailed feedback explaining strengths and weaknesses"),
    improvements: z.array(z.string()).describe("3-5 specific improvements that could be made"),
    improvedPrompt: z.string().describe("An improved version of the prompt"),
  })
}

export async function POST(req: Request) {
  try {
    const { prompt, targetOutput, userId, stage, criteria } = await req.json()

    console.log("[v0] Evaluating prompt:", { prompt, targetOutput, userId, stage, criteria })

    if (!prompt || !targetOutput || !userId || !stage || !criteria) {
      return Response.json(
        { error: "Prompt, target output, userId, stage, and criteria are required" },
        { status: 400 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[v0] ANTHROPIC_API_KEY is not set")
      return Response.json({ error: "Anthropic API key is not configured" }, { status: 500 })
    }

    const activeSession = await sql`
      SELECT id, is_open FROM sessions WHERE is_open = true ORDER BY created_at DESC LIMIT 1
    `

    if (activeSession.length === 0 || !activeSession[0].is_open) {
      return Response.json({ error: "No active session. Submissions are currently closed." }, { status: 403 })
    }

    const criteriaText = criteria
      .map((c: any, i: number) => `${i + 1}. ${c.name.toUpperCase()}: ${c.description}`)
      .join("\n")

    const evaluationPrompt = `You are an expert prompt engineer. Evaluate the following prompt based on how well it would achieve the specified goal.

USER'S PROMPT:
"${prompt}"

GOAL TO ACHIEVE:
"${targetOutput}"

EVALUATION CRITERIA (rate each 0-100):
${criteriaText}

For each criterion, carefully analyze how well the user's prompt would enable an AI to achieve that specific aspect of the goal.

${
  criteria.some((c: any) => c.name.toLowerCase().includes("sustainability"))
    ? `
SUSTAINABILITY EVALUATION GUIDANCE:
When evaluating SUSTAINABILITY, consider:
- Token Efficiency: Does the prompt request only necessary information without redundancy?
- Clarity vs. Verbosity: Is it concise yet clear, avoiding over-specification?
- Resource Optimization: Does it structure requests to minimize API calls and token usage?
- Output Scope: Does it avoid requesting unnecessarily long or detailed responses?
- Reusability: Could this prompt pattern be reused efficiently for similar tasks?

Score higher for prompts that achieve their goals with minimal resource consumption while maintaining effectiveness.
`
    : ""
}

Calculate an OVERALL EFFECTIVENESS SCORE (0-100) as a weighted average of the criteria scores.

Provide:
- A score for EACH criterion listed above
- Detailed feedback explaining strengths and weaknesses relative to each criterion
- 3-5 specific improvements that could be made to better meet the criteria
- An improved version of the prompt that would more effectively achieve the goal

Be constructive and educational in your feedback.`

    let evaluation
    let usage

    try {
      const evaluationSchema = createEvaluationSchema(criteria.map((c) => c.name))

      const result = await generateObject({
        model: anthropic("claude-sonnet-4-20250514"),
        schema: evaluationSchema,
        prompt: evaluationPrompt,
      })

      evaluation = result.object
      usage = result.usage

      console.log("[v0] Generated evaluation successfully")
    } catch (aiError: any) {
      console.error("[v0] AI SDK Error:", {
        message: aiError.message,
        cause: aiError.cause,
        name: aiError.name,
        stack: aiError.stack,
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

    try {
      // Extract static criteria scores for backward compatibility
      const criteriaScoresObj = evaluation.criteriaScores
      const clarityScore = criteriaScoresObj.Clarity || criteriaScoresObj.Professionalism || null
      const specificityScore = criteriaScoresObj.Specificity || criteriaScoresObj.Empathy || null
      const efficiencyScore =
        criteriaScoresObj.Efficiency || criteriaScoresObj.Actionability || criteriaScoresObj.Sustainability || null
      const effectivenessScore =
        criteriaScoresObj.Effectiveness ||
        criteriaScoresObj.Completeness ||
        criteriaScoresObj["Strategic Thinking"] ||
        null

      await sql`
        INSERT INTO submissions (
          session_id, user_id, stage, prompt, goal,
          overall_score, criteria_scores,
          clarity_score, specificity_score, efficiency_score, effectiveness_score,
          token_count, co2_grams, feedback, improved_prompt
        ) VALUES (
          ${activeSession[0].id}, ${userId}, ${stage}, ${prompt}, ${targetOutput},
          ${evaluation.effectivenessScore}, ${JSON.stringify(evaluation.criteriaScores)},
          ${clarityScore}, ${specificityScore}, ${efficiencyScore}, ${effectivenessScore},
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
      criteria,
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
