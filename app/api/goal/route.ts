// In-memory storage for goals (in production, use a database)
const goals = {
  stage1: "Write a professional email to a client explaining a project delay",
  stage2: "Write a professional email to a client explaining a project delay",
}

export async function GET() {
  return Response.json({ goals })
}

export async function POST(req: Request) {
  try {
    const { stage1, stage2 } = await req.json()

    if (stage1) goals.stage1 = stage1
    if (stage2) goals.stage2 = stage2

    return Response.json({ goals, success: true })
  } catch (error) {
    console.error("[v0] Error updating goals:", error)
    return Response.json({ error: "Failed to update goals" }, { status: 500 })
  }
}
