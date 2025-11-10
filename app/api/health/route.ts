import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection
    await sql`SELECT 1 as health_check`

    // Check if tables exist and get counts
    const sessionsResult = await sql`
      SELECT COUNT(*) as count FROM sessions
    `
    const submissionsResult = await sql`
      SELECT COUNT(*) as count FROM submissions
    `

    // Check if there's an active session
    const activeSessionResult = await sql`
      SELECT COUNT(*) as count FROM sessions WHERE is_open = true
    `

    // Check for criteria columns
    const schemaCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'submissions'
      AND column_name IN ('criteria_scores', 'clarity_score', 'specificity_score', 'efficiency_score', 'effectiveness_score')
    `

    const hasNewSchema = schemaCheck.some((col) => col.column_name === "criteria_scores")
    const hasOldSchema = schemaCheck.some((col) => col.column_name === "clarity_score")

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
      },
      tables: {
        sessions: {
          exists: true,
          count: Number.parseInt(sessionsResult[0].count),
          activeCount: Number.parseInt(activeSessionResult[0].count),
        },
        submissions: {
          exists: true,
          count: Number.parseInt(submissionsResult[0].count),
        },
      },
      schema: {
        hasDynamicCriteria: hasNewSchema,
        hasStaticCriteria: hasOldSchema,
        migrationStatus: hasNewSchema && hasOldSchema ? "migrated" : hasNewSchema ? "new-only" : "old-only",
      },
      environment: {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasDatabaseUrl: !!process.env.NEON_DATABASE_URL,
      },
    })
  } catch (error: any) {
    console.error("[v0] Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message,
        },
        environment: {
          hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
          hasDatabaseUrl: !!process.env.NEON_DATABASE_URL,
        },
      },
      { status: 503 },
    )
  }
}
