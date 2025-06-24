"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User } from "lucide-react"

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

interface TaskSummaryProps {
  tasks: Task[]
  selectedDate?: string
  onTaskClick?: (task: Task) => void
}

export function TaskSummary({ tasks, selectedDate, onTaskClick }: TaskSummaryProps) {
  const selectedDateTasks = selectedDate ? tasks.filter((task) => task.date === selectedDate) : []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (!selectedDate || selectedDateTasks.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select a date to view tasks</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{formatDate(selectedDate)}</h3>
        <Badge variant="secondary" className="mt-1">
          {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {selectedDateTasks.map((task) => (
          <div
            key={task.id}
            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onTaskClick?.(task)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                </div>

                {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{task.assignee}</span>
                  </div>

                  {task.startTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {task.startTime}
                        {task.endTime && ` - ${task.endTime}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
