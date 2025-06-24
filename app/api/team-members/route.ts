import { type NextRequest, NextResponse } from "next/server"

// In a real MERN app, this would connect to MongoDB
const teamMembers = [
  { id: "1", name: "Jeremie", email: "jeremie@example.com" },
  { id: "2", name: "Lizzie", email: "lizzie@example.com" },
  { id: "3", name: "Lamar", email: "lamar@example.com" },
  { id: "4", name: "Jeff", email: "jeff@example.com" },
]

export async function GET() {
  return NextResponse.json({ teamMembers })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newMember = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
    }

    teamMembers.push(newMember)

    return NextResponse.json({ teamMember: newMember }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
