"use client"

import { useState, useEffect } from "react"

interface Task {
  id: string
  title: string
  description?: string
  assignee: string
  date: string
  color: string
  startTime?: string
  endTime?: string
}

interface TeamMember {
  id: string
  name: string
  email?: string
}

export function useSchedulerAPI() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Create task
  const createTask = async (taskData: Omit<Task, "id">) => {
    try {
      setLoading(true)
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })
      if (!response.ok) throw new Error("Failed to create task")
      const data = await response.json()
      setTasks((prev) => [...prev, data.task])
      return data.task
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error("Failed to update task")
      const data = await response.json()
      setTasks((prev) => prev.map((task) => (task.id === id ? data.task : task)))
      return data.task
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete task")
      setTasks((prev) => prev.filter((task) => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/team-members")
      if (!response.ok) throw new Error("Failed to fetch team members")
      const data = await response.json()
      setTeamMembers(data.teamMembers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchTeamMembers()
  }, [])

  return {
    tasks,
    teamMembers,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
    fetchTeamMembers,
  }
}
