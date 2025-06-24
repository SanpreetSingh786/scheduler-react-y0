"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Clock, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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

interface CalendarMonthViewProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  selectedMember?: string
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: string) => void
  onTaskDelete?: (taskId: string) => void
  onTaskMove?: (taskId: string, newDate: string) => void
  onDayViewClick?: (date: string) => void
}

export function CalendarMonthView({
  tasks,
  teamMembers,
  selectedMember,
  onTaskClick,
  onDateClick,
  onTaskDelete,
  onTaskMove,
  onDayViewClick,
}: CalendarMonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)) // June 2025
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push({
        date: new Date(currentDay),
        dateString: currentDay.toISOString().split("T")[0],
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        dayNumber: currentDay.getDate(),
      })
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  const calendarDays = getCalendarDays()

  // Get tasks for a specific date with enhanced filtering
  const getTasksForDate = (dateString: string) => {
    let dateTasks = tasks.filter((task) => task.date === dateString)

    // Filter by selected member if any
    if (selectedMember) {
      const member = teamMembers.find((m) => m.id === selectedMember)
      if (member) {
        dateTasks = dateTasks.filter((task) => task.assignee === member.name)
      }
    }

    // Sort by start time
    return dateTasks.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0
      return a.startTime.localeCompare(b.startTime)
    })
  }

  // Navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Enhanced drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLElement).style.opacity = "1"
    setDraggedTask(null)
    setDragOverDate(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (dateString: string) => {
    setDragOverDate(dateString)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = (e: React.DragEvent, dateString: string) => {
    e.preventDefault()
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask.id, dateString)
    }
    setDraggedTask(null)
    setDragOverDate(null)
  }

  // Task overflow popover component - Fixed version
  const TaskOverflowPopover = ({ tasks, date }: { tasks: Task[]; date: string }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-xs text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(true)
            }}
          >
            +{tasks.length} more
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" side="bottom">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDayViewClick?.(date)
                  setIsOpen(false)
                }}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Day View
              </Button>
            </div>
            <Separator />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "p-2 rounded-lg cursor-pointer hover:opacity-90 transition-all",
                    task.color,
                    "text-white",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTaskClick?.(task)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{task.title}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs opacity-90">{task.assignee}</span>
                        {task.startTime && <span className="text-xs opacity-90">{formatTime(task.startTime)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick?.(task)
                          setIsOpen(false)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskDelete?.(task.id)
                          setIsOpen(false)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {selectedMember && (
          <div className="mt-2">
            <Badge variant="secondary">Filtered by: {teamMembers.find((m) => m.id === selectedMember)?.name}</Badge>
          </div>
        )}
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDate(day.dateString)
          const maxVisibleTasks = 3
          const visibleTasks = dayTasks.slice(0, maxVisibleTasks)
          const overflowTasks = dayTasks.slice(maxVisibleTasks)
          const isDragOver = dragOverDate === day.dateString

          return (
            <div
              key={index}
              className={cn(
                "min-h-[140px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors group relative",
                !day.isCurrentMonth && "bg-gray-100 text-gray-400",
                day.isToday && "bg-blue-50 border-blue-200",
                isDragOver && "bg-green-50 border-green-300",
              )}
              onClick={() => onDateClick?.(day.dateString)}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(day.dateString)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dateString)}
            >
              {/* Day Number and Actions */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    day.isToday &&
                      "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs",
                  )}
                >
                  {day.dayNumber}
                </span>
                {day.isCurrentMonth && (
                  <div className="flex items-center space-x-1">
                    {dayTasks.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {dayTasks.length}
                      </Badge>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDateClick?.(day.dateString)
                        }}
                        title="Add task"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {dayTasks.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDayViewClick?.(day.dateString)
                          }}
                          title="Day view"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks */}
              {day.isCurrentMonth && (
                <div className="space-y-1">
                  {visibleTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "text-xs p-1.5 rounded cursor-move hover:opacity-90 relative group/task transition-all",
                        task.color,
                        "text-white border-l-2 border-white/30",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick?.(task)
                      }}
                      title={`${task.title} - ${task.assignee}${task.startTime ? ` (${formatTime(task.startTime)})` : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-xs">{task.title}</div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="truncate opacity-90 text-xs">{task.assignee}</div>
                            {task.startTime && (
                              <div className="flex items-center opacity-90 text-xs ml-1">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                {formatTime(task.startTime)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Task Actions */}
                        <div className="flex items-center space-x-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity ml-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              onTaskClick?.(task)
                            }}
                            title="Edit task"
                          >
                            <Edit className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              onTaskDelete?.(task.id)
                            }}
                            title="Delete task"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Overflow tasks - Fixed implementation */}
                  {overflowTasks.length > 0 && <TaskOverflowPopover tasks={overflowTasks} date={day.dateString} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
