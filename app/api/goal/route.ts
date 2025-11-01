// In-memory storage for the goal (in production, use a database)
let currentGoal = "Write a professional email to a client explaining a project delay"

export async function GET() {
  return Response.json({ goal: currentGoal })
}

export async function POST(req: Request) {
  try {
    const { goal } = await req.json()

    if (!goal || typeof goal !== "string") {
      return Response.json({ error: "Goal is required and must be a string" }, { status: 400 })
    }

    currentGoal = goal
    return Response.json({ goal: currentGoal, success: true })
  } catch (error) {
    console.error("[v0] Error updating goal:", error)
    return Response.json({ error: "Failed to update goal" }, { status: 500 })
  }
}
