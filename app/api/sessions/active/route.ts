import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET the currently active (open) session
export async function GET() {
  try {
    console.log("[v0] Fetching active session from database...")

    const result = await sql`
      SELECT * FROM sessions 
      WHERE is_open = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    console.log("[v0] Query result:", result.length, "sessions found")

    if (result.length === 0) {
      return NextResponse.json({ session: null, message: "No active session" })
    }

    return NextResponse.json({ session: result[0] })
  } catch (error) {
    console.error("[v0] Error fetching active session:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to fetch active session",
        details: errorMessage,
        hint: "Database tables may not be initialized. Please run the SQL setup script.",
      },
      { status: 500 },
    )
  }
}
