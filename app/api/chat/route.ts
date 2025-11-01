import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"

export const maxDuration = 30

// Define the grading state interface
interface GradingState {
  effectivenessScore?: number
  clarity?: number
  specificity?: number
  efficiency?: number
  feedback?: string
  improvements?: string[]
  improvedPrompt?: string
}

export async function POST(req: Request) {
  try {
    const { prompt, targetOutput, userId, stage } = await req.json()

    console.log("[v0] Chat API - Evaluating prompt:", { userId, stage })

    if (!prompt || !targetOutput || !userId || !stage) {
      return Response.json({ error: "Prompt, target output, userId, and stage are required" }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[v0] ANTHROPIC_API_KEY is not set")
      return Response.json({ error: "Anthropic API key is not configured" }, { status: 500 })
    }

    // Check for active session
    const activeSession = await sql`
      SELECT id, is_open FROM sessions WHERE is_open = true ORDER BY created_at DESC LIMIT 1
    `

    if (activeSession.length === 0 || !activeSession[0].is_open) {
      return Response.json({ error: "No active session. Submissions are currently closed." }, { status: 403 })
    }

    const sessionId = activeSession[0].id

    // Initialize grading state - this will be populated by the tools
    const gradingState: GradingState = {}
    let totalTokens = 0

    const systemPrompt = `You are an expert prompt engineer tasked with evaluating prompts.

Your task is to:
1. Analyze the prompt's effectiveness in achieving the stated goal
2. Use the provided tools to fill in specific grading scores and feedback
3. Calculate scores on a 0-100 scale for:
   - CLARITY: How clear and unambiguous is the prompt?
   - SPECIFICITY: How specific and detailed is the prompt for achieving the goal?
   - EFFICIENCY: How concise yet complete is the prompt?
4. Calculate an OVERALL EFFECTIVENESS SCORE (0-100) as a weighted average
5. Provide detailed, constructive feedback
6. Suggest 3-5 specific improvements
7. Create an improved version of the prompt

Be thorough and educational in your evaluation. Use all the grading tools to fill in the complete evaluation, then call completeEvaluation when done.`

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      prompt: `Please evaluate this prompt:

USER'S PROMPT:
"${prompt}"

GOAL TO ACHIEVE:
"${targetOutput}"

Analyze the prompt and use all the grading tools to provide a complete evaluation.`,
      tools: {
        fillClarityScore: {
          description: "Fill in the clarity score for how clear and unambiguous the prompt is (0-100)",
          parameters: z.object({
            score: z.number().min(0).max(100).describe("The clarity score from 0 to 100"),
            reasoning: z.string().describe("Brief explanation of the clarity score"),
          }),
          execute: async ({ score, reasoning }) => {
            gradingState.clarity = score
            return { success: true, message: `Clarity score set to ${score}. ${reasoning}` }
          },
        },
        fillSpecificityScore: {
          description: "Fill in the specificity score for how specific and detailed the prompt is (0-100)",
          parameters: z.object({
            score: z.number().min(0).max(100).describe("The specificity score from 0 to 100"),
            reasoning: z.string().describe("Brief explanation of the specificity score"),
          }),
          execute: async ({ score, reasoning }) => {
            gradingState.specificity = score
            return { success: true, message: `Specificity score set to ${score}. ${reasoning}` }
          },
        },
        fillEfficiencyScore: {
          description: "Fill in the efficiency score for how concise yet complete the prompt is (0-100)",
          parameters: z.object({
            score: z.number().min(0).max(100).describe("The efficiency score from 0 to 100"),
            reasoning: z.string().describe("Brief explanation of the efficiency score"),
          }),
          execute: async ({ score, reasoning }) => {
            gradingState.efficiency = score
            return { success: true, message: `Efficiency score set to ${score}. ${reasoning}` }
          },
        },
        fillEffectivenessScore: {
          description:
            "Fill in the overall effectiveness score based on how well the prompt achieves the goal (0-100)",
          parameters: z.object({
            score: z.number().min(0).max(100).describe("The overall effectiveness score from 0 to 100"),
            reasoning: z.string().describe("Brief explanation of the effectiveness score"),
          }),
          execute: async ({ score, reasoning }) => {
            gradingState.effectivenessScore = score
            return { success: true, message: `Effectiveness score set to ${score}. ${reasoning}` }
          },
        },
        fillFeedback: {
          description:
            "Provide detailed feedback explaining the strengths and weaknesses of the prompt in relation to the goal",
          parameters: z.object({
            feedback: z.string().describe("Detailed constructive feedback about the prompt"),
          }),
          execute: async ({ feedback }) => {
            gradingState.feedback = feedback
            return { success: true, message: "Feedback recorded successfully" }
          },
        },
        fillImprovements: {
          description: "Provide a list of 3-5 specific improvements that could be made to better achieve the goal",
          parameters: z.object({
            improvements: z
              .array(z.string())
              .min(3)
              .max(5)
              .describe("Array of 3-5 specific improvement suggestions"),
          }),
          execute: async ({ improvements }) => {
            gradingState.improvements = improvements
            return { success: true, message: `Recorded ${improvements.length} improvement suggestions` }
          },
        },
        fillImprovedPrompt: {
          description: "Provide an improved version of the prompt that would more effectively achieve the goal",
          parameters: z.object({
            improvedPrompt: z.string().describe("The improved version of the original prompt"),
          }),
          execute: async ({ improvedPrompt }) => {
            gradingState.improvedPrompt = improvedPrompt
            return { success: true, message: "Improved prompt recorded successfully" }
          },
        },
        completeEvaluation: {
          description:
            "Call this tool when you have filled in all the grading information and are ready to complete the evaluation",
          parameters: z.object({
            summary: z.string().describe("Brief summary of the evaluation"),
          }),
          execute: async ({ summary }) => {
            // Save to database
            try {
              const estimatedCO2 = (totalTokens * 0.0004).toFixed(2)

              await sql`
                INSERT INTO submissions (
                  session_id, user_id, stage, prompt, goal,
                  overall_score, clarity_score, specificity_score,
                  efficiency_score, effectiveness_score,
                  token_count, co2_grams, feedback, improved_prompt
                ) VALUES (
                  ${sessionId}, ${userId}, ${stage}, ${prompt}, ${targetOutput},
                  ${gradingState.effectivenessScore || 0}, ${gradingState.clarity || 0}, ${gradingState.specificity || 0},
                  ${gradingState.efficiency || 0}, ${gradingState.effectivenessScore || 0},
                  ${totalTokens}, ${Number.parseFloat(estimatedCO2)}, ${gradingState.feedback || ""}, ${gradingState.improvedPrompt || ""}
                )
              `
              console.log("[v0] Saved evaluation to database")
            } catch (dbError) {
              console.error("[v0] Failed to save submission to database:", dbError)
            }

            return {
              success: true,
              message: "Evaluation completed",
              gradingState,
              summary,
            }
          },
        },
      },
      maxSteps: 10,
      onFinish: async ({ usage }) => {
        totalTokens = (usage?.promptTokens || 0) + (usage?.completionTokens || 0)
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Error in chat API:", error)
    return Response.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
