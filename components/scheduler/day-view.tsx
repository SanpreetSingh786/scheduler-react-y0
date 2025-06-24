"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, User, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface TeamMember {
  id: string
  name: string
}

interface DayViewProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  selectedDate?: string
  onDateChange?: (date: string) => void
  onTaskClick?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onAddTask?: (date: string, time?: string) => void
  onTaskMove?: (taskId: string, newDate: string, newTime: string) => void
}

export function DayView({
  tasks,
  teamMembers,
  selectedDate,
  onDateChange,
  onTaskClick,
  onTaskDelete,
  onAddTask,
  onTaskMove,
}: DayViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date().toISOString().split("T")[0])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverTime, setDragOverTime] = useState<string | null>(null)

  // Generate time slots (24 hours in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const displayTime = formatTime(timeString)

        slots.push({
          time: timeString,
          displayTime,
          hour,
          minute,
          isHourMark: minute === 0,
          isBusinessHour: hour >= 8 && hour < 18,
        })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const SLOT_HEIGHT = 60 // Height of each 30-minute slot in pixels

  // Get tasks for the current date
  const dayTasks = tasks
    .filter((task) => task.date === currentDate)
    .sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0
      return a.startTime.localeCompare(b.startTime)
    })

  // Convert time to minutes since midnight
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Convert minutes to time slot index
  const minutesToSlotIndex = (minutes: number) => {
    return Math.floor(minutes / 30)
  }

  // Calculate task position and height based on actual time
  const getTaskPosition = (task: Task) => {
    if (!task.startTime) return null

    const startMinutes = timeToMinutes(task.startTime)
    const endMinutes = task.endTime ? timeToMinutes(task.endTime) : startMinutes + 60

    const startSlotIndex = minutesToSlotIndex(startMinutes)
    const endSlotIndex = minutesToSlotIndex(endMinutes)

    // Calculate precise positioning within slots
    const startSlotMinutes = startSlotIndex * 30
    const endSlotMinutes = endSlotIndex * 30

    const startOffset = ((startMinutes - startSlotMinutes) / 30) * SLOT_HEIGHT
    const endOffset = ((endMinutes - endSlotMinutes) / 30) * SLOT_HEIGHT

    const topPosition = startSlotIndex * SLOT_HEIGHT + startOffset
    const height = Math.max(30, (endSlotIndex - startSlotIndex) * SLOT_HEIGHT + endOffset - startOffset)

    return {
      top: topPosition,
      height: height,
      startSlotIndex,
      endSlotIndex,
    }
  }

  // Get tasks that overlap with a specific time slot
  const getTasksForTimeSlot = (timeSlot: string) => {
    const slotMinutes = timeToMinutes(timeSlot)
    const slotEndMinutes = slotMinutes + 30

    return dayTasks.filter((task) => {
      if (!task.startTime) return false

      const taskStartMinutes = timeToMinutes(task.startTime)
      const taskEndMinutes = task.endTime ? timeToMinutes(task.endTime) : taskStartMinutes + 60

      // Check if task overlaps with this time slot
      return taskStartMinutes < slotEndMinutes && taskEndMinutes > slotMinutes
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      full: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      short: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(currentDate)
    if (direction === "prev") {
      date.setDate(date.getDate() - 1)
    } else {
      date.setDate(date.getDate() + 1)
    }
    const newDate = date.toISOString().split("T")[0]
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const goToToday = () => {
    const today = new Date().toISOString().split("T")[0]
    setCurrentDate(today)
    onDateChange?.(today)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = "1"
    setDraggedTask(null)
    setDragOverTime(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (timeSlot: string) => {
    setDragOverTime(timeSlot)
  }

  const handleDrop = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault()
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask.id, currentDate, timeSlot)
    }
    setDraggedTask(null)
    setDragOverTime(null)
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

  const dateInfo = formatDate(currentDate)

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{dateInfo.weekday}</h2>
              <p className="text-sm text-gray-600">{dateInfo.full}</p>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={currentDate}
              onValueChange={(date) => {
                setCurrentDate(date)
                onDateChange?.(date)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }, (_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() + i - 15)
                  const dateString = date.toISOString().split("T")[0]
                  const formatted = formatDate(dateString)
                  return (
                    <SelectItem key={dateString} value={dateString}>
                      {formatted.weekday}, {formatted.short}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Day Summary */}
        <div className="mt-4 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {new Set(dayTasks.map((task) => task.assignee)).size} team member
              {new Set(dayTasks.map((task) => task.assignee)).size !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {dayTasks.filter((task) => task.startTime && task.endTime).length} scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="relative">
          {/* Time slots */}
          {timeSlots.map((slot, index) => {
            const slotTasks = getTasksForTimeSlot(slot.time)
            const isDragOver = dragOverTime === slot.time

            return (
              <div
                key={slot.time}
                className={cn(
                  "flex border-b transition-colors relative",
                  slot.isBusinessHour ? "bg-white" : "bg-gray-50",
                  isDragOver && "bg-blue-50 border-blue-200",
                  slot.isHourMark && "border-b-2 border-gray-200",
                )}
                style={{ height: `${SLOT_HEIGHT}px` }}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(slot.time)}
                onDrop={(e) => handleDrop(e, slot.time)}
              >
                {/* Time Column */}
                <div className="w-20 flex-shrink-0 p-3 border-r bg-gray-50 flex items-start">
                  <div className={cn("text-sm font-medium", slot.isHourMark ? "text-gray-700" : "text-gray-500")}>
                    {slot.isHourMark ? slot.displayTime : ""}
                  </div>
                </div>

                {/* Tasks Column */}
                <div className="flex-1 relative">
                  {/* Empty slot click area */}
                  <div
                    className="absolute inset-0 hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => onAddTask?.(currentDate, slot.time)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-2 text-gray-400 hover:text-gray-600">
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add task</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Absolutely positioned tasks */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative" style={{ marginLeft: "80px" }}>
              {dayTasks.map((task) => {
                const position = getTaskPosition(task)
                if (!position) return null

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "absolute left-2 right-2 p-3 rounded-lg cursor-move hover:shadow-md transition-all group pointer-events-auto z-10",
                      task.color,
                      "text-white",
                    )}
                    style={{
                      top: `${position.top}px`,
                      height: `${position.height}px`,
                    }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            {task.assignee}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm opacity-90 mb-2">
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

                        {task.description && position.height > 80 && (
                          <p className="text-sm opacity-80 line-clamp-2">{task.description}</p>
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
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
