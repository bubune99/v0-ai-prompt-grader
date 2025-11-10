import { sql } from "@/lib/db"

async function migrate() {
  try {
    console.log("[v0] Starting migration: Adding criteria columns...")

    // Add stage1_criteria column if it doesn't exist
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS stage1_criteria JSONB NOT NULL DEFAULT '[]'::jsonb
    `

    // Add stage2_criteria column if it doesn't exist
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS stage2_criteria JSONB NOT NULL DEFAULT '[]'::jsonb
    `

    // Update existing sessions with default criteria
    await sql`
      UPDATE sessions
      SET stage1_criteria = ${JSON.stringify([
        { name: "Professionalism", description: "Uses appropriate business language and tone" },
        { name: "Empathy", description: "Acknowledges customer concerns and shows understanding" },
        { name: "Actionability", description: "Provides clear next steps or solutions" },
        { name: "Completeness", description: "Addresses all aspects of the complaint" },
      ])},
      stage2_criteria = ${JSON.stringify([
        { name: "Strategic Thinking", description: "Shows clear understanding of market positioning" },
        { name: "Audience Targeting", description: "Identifies and addresses specific customer segments" },
        { name: "Channel Strategy", description: "Proposes appropriate marketing channels and tactics" },
        { name: "Measurability", description: "Includes metrics and KPIs for success tracking" },
      ])}
      WHERE stage1_criteria = '[]'::jsonb OR stage2_criteria = '[]'::jsonb
    `

    console.log("[v0] Migration completed successfully!")
    return { success: true }
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    throw error
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
