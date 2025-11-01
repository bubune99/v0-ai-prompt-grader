// API route to store and retrieve prompt submissions

type Submission = {
  id: string
  timestamp: string
  prompt: string
  targetOutput: string
  effectivenessScore: number
  clarity: number
  specificity: number
  efficiency: number
  tokens: number
  estimatedCO2: number
}

// In-memory store for submissions
let submissions: Submission[] = []

export async function GET() {
  return Response.json({ submissions })
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const submission: Submission = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      prompt: data.prompt,
      targetOutput: data.targetOutput,
      effectivenessScore: data.effectivenessScore,
      clarity: data.clarity,
      specificity: data.specificity,
      efficiency: data.efficiency,
      tokens: data.tokens,
      estimatedCO2: data.estimatedCO2,
    }

    submissions.push(submission)

    // Keep only last 100 submissions to prevent memory issues
    if (submissions.length > 100) {
      submissions = submissions.slice(-100)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving submission:", error)
    return Response.json({ error: "Failed to save submission" }, { status: 500 })
  }
}
