import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET all submissions, optionally filtered by session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session") || searchParams.get("sessionId")

    let submissions
    if (sessionId) {
      submissions = await sql`
        SELECT * FROM submissions 
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
      `
    } else {
      submissions = await sql`
        SELECT * FROM submissions 
        ORDER BY created_at DESC
      `
    }

    const formattedSubmissions = submissions.map((sub: any) => ({
      id: sub.id,
      timestamp: sub.created_at,
      userId: sub.user_id,
      stage: sub.stage,
      prompt: sub.prompt,
      targetOutput: sub.goal,
      effectivenessScore: sub.effectiveness_score,
      clarity: sub.clarity_score,
      specificity: sub.specificity_score,
      efficiency: sub.efficiency_score,
      tokens: sub.token_count,
      estimatedCO2: Number.parseFloat(sub.co2_grams),
      feedback: sub.feedback,
      improvedPrompt: sub.improved_prompt,
      userRating: sub.user_rating,
    }))

    return NextResponse.json({ submissions: formattedSubmissions })
  } catch (error) {
    console.error("[v0] Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

// POST create new submission
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Get the active session
    const activeSession = await sql`
      SELECT id FROM sessions WHERE is_open = true ORDER BY created_at DESC LIMIT 1
    `

    if (activeSession.length === 0) {
      return NextResponse.json({ error: "No active session available" }, { status: 400 })
    }

    const sessionId = activeSession[0].id

    await sql`
      INSERT INTO submissions (
        session_id, user_id, stage, prompt, goal,
        overall_score, clarity_score, specificity_score, 
        efficiency_score, effectiveness_score,
        token_count, co2_grams, feedback, improved_prompt
      ) VALUES (
        ${sessionId}, ${data.userId}, ${data.stage}, ${data.prompt}, ${data.targetOutput},
        ${data.effectivenessScore}, ${data.clarity}, ${data.specificity},
        ${data.efficiency}, ${data.effectivenessScore},
        ${data.tokens}, ${data.estimatedCO2}, ${data.feedback || ""}, ${data.improvedPrompt || ""}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving submission:", error)
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
  }
}
