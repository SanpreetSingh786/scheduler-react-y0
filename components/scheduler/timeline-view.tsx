"use client"

import { useState } from "react"
import { Clock, Edit, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

interface TimelineViewProps {
  tasks: Task[]
  selectedDate: string
  onTaskClick?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
}

export function TimelineView({ tasks, selectedDate, onTaskClick, onTaskDelete }: TimelineViewProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  // Filter tasks for the selected date and sort by time
  const dayTasks = tasks
    .filter((task) => task.date === selectedDate && task.startTime)
    .sort((a, b) => a.startTime!.localeCompare(b.startTime!))

  // Generate hour slots from 8 AM to 6 PM
  const generateHourSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      slots.push({
        hour,
        displayHour: hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`,
        tasks: dayTasks.filter((task) => {
          if (!task.startTime) return false
          const taskHour = Number.parseInt(task.startTime.split(":")[0])
          return taskHour === hour
        }),
      })
    }
    return slots
  }

  const hourSlots = generateHourSlots()

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return ""

    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const duration = endMinutes - startMinutes

    if (duration <= 0) return ""

    const hours = Math.floor(duration / 60)
    const minutes = duration % 60

    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  if (dayTasks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No scheduled tasks</h3>
          <p className="text-sm">No tasks are scheduled for {formatDate(selectedDate)}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Timeline View</h3>
            <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
          </div>
          <Badge variant="secondary">
            {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        <div className="space-y-1">
          {hourSlots.map((slot) => (
            <div
              key={slot.hour}
              className={cn(
                "flex items-start space-x-4 p-3 rounded-lg transition-colors",
                slot.tasks.length > 0 ? "bg-blue-50" : "hover:bg-gray-50",
                selectedHour === slot.hour && "bg-blue-100 border border-blue-200",
              )}
              onClick={() => setSelectedHour(selectedHour === slot.hour ? null : slot.hour)}
            >
              {/* Time Column */}
              <div className="w-20 flex-shrink-0">
                <div className="text-sm font-medium text-gray-700">{slot.displayHour}</div>
                <div className="w-full h-px bg-gray-200 mt-1"></div>
              </div>

              {/* Tasks Column */}
              <div className="flex-1 min-w-0">
                {slot.tasks.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">No tasks scheduled</div>
                ) : (
                  <div className="space-y-2">
                    {slot.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all hover:shadow-md group",
                          task.color,
                          "text-white",
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick?.(task)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium truncate">{task.title}</h4>
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                {task.assignee}
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-4 text-sm opacity-90">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(task.startTime!)}
                                  {task.endTime && ` - ${formatTime(task.endTime)}`}
                                </span>
                              </div>

                              {task.endTime && (
                                <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                                  {calculateDuration(task.startTime!, task.endTime)}
                                </Badge>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-sm opacity-80 mt-2 line-clamp-2">{task.description}</p>
                            )}
                          </div>

                          {/* Task Actions */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskClick?.(task)
                              }}
                              title="Edit task"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskDelete?.(task.id)
                              }}
                              title="Delete task"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
