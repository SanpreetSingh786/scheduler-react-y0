import { type NextRequest, NextResponse } from "next/server"

// In a real MERN app, this would connect to MongoDB
// For this demo, we'll use in-memory storage
const tasks: any[] = []

export async function GET() {
  return NextResponse.json({ tasks })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newTask = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    tasks.push(newTask)

    return NextResponse.json({ task: newTask }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
