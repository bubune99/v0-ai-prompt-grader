import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"

// Load environment variables FIRST
dotenv.config()

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)

const sql = neon(process.env.DATABASE_URL)

async function checkDatabase() {
  try {
    console.log("Checking database tables...")

    // Check for tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log("\n✓ Found tables:")
    tables.forEach(t => console.log(`  - ${t.table_name}`))

    // Check sessions
    const sessions = await sql`SELECT COUNT(*) as count FROM sessions`
    console.log(`\n✓ Sessions: ${sessions[0].count} records`)

    // Check submissions
    const submissions = await sql`SELECT COUNT(*) as count FROM submissions`
    console.log(`✓ Submissions: ${submissions[0].count} records`)

    // Check active session
    const activeSessions = await sql`
      SELECT id, name, is_open, stage1_goal, stage2_goal
      FROM sessions
      WHERE is_open = true
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (activeSessions.length > 0) {
      console.log("\n✓ Active session found:")
      console.log(`  ID: ${activeSessions[0].id}`)
      console.log(`  Name: ${activeSessions[0].name}`)
      console.log(`  Status: ${activeSessions[0].is_open ? 'OPEN' : 'CLOSED'}`)
      console.log(`  Stage 1 Goal: ${activeSessions[0].stage1_goal.substring(0, 60)}...`)
      console.log(`  Stage 2 Goal: ${activeSessions[0].stage2_goal.substring(0, 60)}...`)
    } else {
      console.log("\n⚠ No active session found")
    }

  } catch (error) {
    console.error("❌ Database error:", error.message)
    process.exit(1)
  }
}

checkDatabase()
