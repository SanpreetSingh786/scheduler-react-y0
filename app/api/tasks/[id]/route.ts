import { type NextRequest, NextResponse } from "next/server"

// In a real MERN app, this would connect to MongoDB
const tasks: any[] = []

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const taskIndex = tasks.findIndex((task) => task.id === params.id)

    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ task: tasks[taskIndex] })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const taskIndex = tasks.findIndex((task) => task.id === params.id)

  if (taskIndex === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0]

  return NextResponse.json({ task: deletedTask })
}
