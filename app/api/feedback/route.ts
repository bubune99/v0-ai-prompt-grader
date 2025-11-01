import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const feedback = await sql`
      SELECT 
        id,
        user_id,
        rating,
        message,
        created_at
      FROM session_feedback
      ORDER BY created_at DESC
    `

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("[v0] Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, rating, message } = await request.json()

    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid feedback data" }, { status: 400 })
    }

    await sql`
      INSERT INTO session_feedback (user_id, rating, message)
      VALUES (${userId}, ${rating}, ${message})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving feedback:", error)
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}
