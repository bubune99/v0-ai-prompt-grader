import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { prompt, rating } = await request.json()

    if (!prompt || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valid prompt and rating (1-5) are required" }, { status: 400 })
    }

    // Update the most recent submission with this prompt
    await sql`
      UPDATE submissions 
      SET user_rating = ${rating}
      WHERE prompt = ${prompt}
      ORDER BY created_at DESC
      LIMIT 1
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving rating:", error)
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 })
  }
}
