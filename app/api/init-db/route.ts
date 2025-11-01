import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    console.log("[v0] Initializing database tables...")

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        stage1_goal TEXT NOT NULL,
        stage2_goal TEXT NOT NULL,
        is_open BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id),
        user_id TEXT NOT NULL,
        stage INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        goal TEXT NOT NULL,
        clarity_score INTEGER NOT NULL,
        specificity_score INTEGER NOT NULL,
        efficiency_score INTEGER NOT NULL,
        overall_score INTEGER NOT NULL,
        feedback TEXT NOT NULL,
        improved_prompt TEXT NOT NULL,
        tokens_used INTEGER NOT NULL,
        co2_grams REAL NOT NULL,
        cost_usd REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_is_open ON sessions(is_open)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)
    `

    await sql`
      CREATE TABLE IF NOT EXISTS session_feedback (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_feedback_user_id ON session_feedback(user_id)
    `

    console.log("[v0] Tables created successfully")

    // Check if default session exists
    const existingSessions = await sql`SELECT COUNT(*) as count FROM sessions`

    if (existingSessions[0].count === 0) {
      console.log("[v0] Creating default session...")

      await sql`
        INSERT INTO sessions (name, stage1_goal, stage2_goal, is_open)
        VALUES (
          'Default Workshop Session',
          'Write a prompt that generates a professional email response to a customer complaint',
          'Write a prompt that generates a comprehensive marketing strategy for a new product launch',
          true
        )
      `

      console.log("[v0] Default session created")
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("[v0] Error initializing database:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
