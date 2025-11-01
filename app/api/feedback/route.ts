// API route to store and retrieve session feedback

type Feedback = {
  id: string
  timestamp: string
  rating: number
  message: string | null
}

// In-memory store for feedback
let feedbackList: Feedback[] = []

export async function GET() {
  return Response.json({ feedback: feedbackList })
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return Response.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const feedback: Feedback = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      rating: data.rating,
      message: data.message || null,
    }

    feedbackList.push(feedback)

    // Keep only last 100 feedback entries to prevent memory issues
    if (feedbackList.length > 100) {
      feedbackList = feedbackList.slice(-100)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving feedback:", error)
    return Response.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}
