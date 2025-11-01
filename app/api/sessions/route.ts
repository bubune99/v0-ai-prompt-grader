import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET all sessions
export async function GET() {
  try {
    const sessions = await sql`
      SELECT * FROM sessions ORDER BY created_at DESC
    `
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("[v0] Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

// POST create new session
export async function POST(request: NextRequest) {
  try {
    const { name, stage1_goal, stage2_goal } = await request.json()

    const result = await sql`
      INSERT INTO sessions (name, stage1_goal, stage2_goal, is_open)
      VALUES (${name}, ${stage1_goal}, ${stage2_goal}, true)
      RETURNING *
    `

    return NextResponse.json({ session: result[0] })
  } catch (error) {
    console.error("[v0] Error creating session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

// PATCH update session (toggle open/close or update goals)
export async function PATCH(request: NextRequest) {
  try {
    const { id, is_open, stage1_goal, stage2_goal } = await request.json()

    if (is_open !== undefined) {
      await sql`
        UPDATE sessions 
        SET is_open = ${is_open}
        WHERE id = ${id}
      `
    }

    if (stage1_goal !== undefined && stage2_goal !== undefined) {
      await sql`
        UPDATE sessions 
        SET stage1_goal = ${stage1_goal}, stage2_goal = ${stage2_goal}
        WHERE id = ${id}
      `
    }

    const result = await sql`
      SELECT * FROM sessions WHERE id = ${id}
    `

    return NextResponse.json({ session: result[0] })
  } catch (error) {
    console.error("[v0] Error updating session:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
