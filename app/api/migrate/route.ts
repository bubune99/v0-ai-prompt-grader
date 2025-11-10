import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    console.log("[v0] Starting database migration...")

    // Add criteria_scores JSONB column to submissions table
    console.log("[v0] Adding criteria_scores column...")
    await sql`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS criteria_scores JSONB NOT NULL DEFAULT '{}'::jsonb
    `

    // Create index for JSONB queries on criteria_scores
    console.log("[v0] Creating index on criteria_scores...")
    await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_criteria_scores
      ON submissions USING gin(criteria_scores)
    `

    // Ensure sessions table has criteria columns
    console.log("[v0] Adding criteria columns to sessions...")
    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS stage1_criteria JSONB NOT NULL DEFAULT '[]'::jsonb
    `
    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS stage2_criteria JSONB NOT NULL DEFAULT '[]'::jsonb
    `

    // Create indexes for JSONB queries on session criteria
    console.log("[v0] Creating indexes on session criteria...")
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_stage1_criteria
      ON sessions USING gin(stage1_criteria)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_stage2_criteria
      ON sessions USING gin(stage2_criteria)
    `

    // Update existing sessions with default criteria if they have empty arrays
    console.log("[v0] Updating existing sessions with default criteria...")
    const updateResult = await sql`
      UPDATE sessions
      SET stage1_criteria = jsonb_build_array(
        jsonb_build_object('name', 'Professionalism', 'description', 'Uses appropriate business language and tone'),
        jsonb_build_object('name', 'Empathy', 'description', 'Acknowledges customer concerns and shows understanding'),
        jsonb_build_object('name', 'Actionability', 'description', 'Provides clear next steps or solutions'),
        jsonb_build_object('name', 'Completeness', 'description', 'Addresses all aspects of the complaint')
      ),
      stage2_criteria = jsonb_build_array(
        jsonb_build_object('name', 'Strategic Thinking', 'description', 'Shows clear understanding of market positioning'),
        jsonb_build_object('name', 'Audience Targeting', 'description', 'Identifies and addresses specific customer segments'),
        jsonb_build_object('name', 'Channel Strategy', 'description', 'Proposes appropriate marketing channels and tactics'),
        jsonb_build_object('name', 'Measurability', 'description', 'Includes metrics and KPIs for success tracking')
      )
      WHERE stage1_criteria = '[]'::jsonb OR stage2_criteria = '[]'::jsonb
      RETURNING id
    `

    console.log(`[v0] Updated ${updateResult.length} sessions with default criteria`)

    // Optional: Migrate existing static scores to criteria_scores JSONB
    console.log("[v0] Migrating existing static scores to criteria_scores...")
    const migrateResult = await sql`
      UPDATE submissions
      SET criteria_scores = jsonb_build_object(
        'Clarity', clarity_score,
        'Specificity', specificity_score,
        'Efficiency', efficiency_score,
        'Effectiveness', effectiveness_score
      )
      WHERE criteria_scores = '{}'::jsonb
        AND clarity_score IS NOT NULL
        AND specificity_score IS NOT NULL
        AND efficiency_score IS NOT NULL
        AND effectiveness_score IS NOT NULL
      RETURNING id
    `

    console.log(`[v0] Migrated ${migrateResult.length} submissions to new schema`)

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
      details: {
        sessionsUpdated: updateResult.length,
        submissionsMigrated: migrateResult.length,
      },
    })
  } catch (error: any) {
    console.error("[v0] Migration error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
