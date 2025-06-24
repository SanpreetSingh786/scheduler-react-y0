// MongoDB connection utility for real MERN implementation
// This would be used in a production environment

import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local")
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// Database models
export interface TaskModel {
  _id?: string
  title: string
  description?: string
  assignee: string
  date: string
  color: string
  startTime?: string
  endTime?: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamMemberModel {
  _id?: string
  name: string
  email: string
  role?: string
  createdAt: Date
}

// Database operations
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db("mern-scheduler")
}

export async function getTasks(): Promise<TaskModel[]> {
  const db = await getDatabase()
  const tasks = await db.collection<TaskModel>("tasks").find({}).toArray()
  return tasks
}

export async function createTask(task: Omit<TaskModel, "_id" | "createdAt" | "updatedAt">): Promise<TaskModel> {
  const db = await getDatabase()
  const newTask = {
    ...task,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await db.collection<TaskModel>("tasks").insertOne(newTask)
  return { ...newTask, _id: result.insertedId.toString() }
}

export async function updateTask(id: string, updates: Partial<TaskModel>): Promise<TaskModel | null> {
  const db = await getDatabase()
  const result = await db
    .collection<TaskModel>("tasks")
    .findOneAndUpdate({ _id: id as any }, { $set: { ...updates, updatedAt: new Date() } }, { returnDocument: "after" })
  return result.value
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await getDatabase()
  const result = await db.collection<TaskModel>("tasks").deleteOne({ _id: id as any })
  return result.deletedCount === 1
}

export async function getTeamMembers(): Promise<TeamMemberModel[]> {
  const db = await getDatabase()
  const members = await db.collection<TeamMemberModel>("team-members").find({}).toArray()
  return members
}
