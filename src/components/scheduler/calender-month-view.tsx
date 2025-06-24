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
  endDate?: string
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
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1))
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

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

  const getTasksForDate = (dateString: string) => {
    let dateTasks = tasks.filter((task) => {
      const start = new Date(task.date)
      const end = new Date(task.endDate ?? task.date)
      const current = new Date(dateString)
      return current >= start && current <= end
    })

    if (selectedMember) {
      const member = teamMembers.find((m) => m.id === selectedMember)
      if (member) {
        dateTasks = dateTasks.filter((task) => task.assignee === member.name)
      }
    }

    return dateTasks.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0
      return a.startTime.localeCompare(b.startTime)
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(direction === "prev" ? newDate.getMonth() - 1 : newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

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

  const handleDragEnter = (dateString: string) => setDragOverDate(dateString)
  const handleDragLeave = () => setDragOverDate(null)

  const handleDrop = (e: React.DragEvent, dateString: string) => {
    e.preventDefault()
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask.id, dateString)
    }
    setDraggedTask(null)
    setDragOverDate(null)
  }

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
                {new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
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
                <Eye className="h-3 w-3 mr-1" /> Day View
              </Button>
            </div>
            <Separator />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn("p-2 rounded-lg cursor-pointer hover:opacity-90 transition-all", task.color, "text-white")}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTaskClick?.(task)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{task.title}</div>
                      <div className="flex items-center space-x-2 mt-1 text-xs opacity-90">
                        <span>{task.assignee}</span>
                        {task.startTime && <span>{formatTime(task.startTime)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick?.(task)
                          setIsOpen(false)
                        }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskDelete?.(task.id)
                          setIsOpen(false)
                        }}>
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
      {/* Header & Navigation omitted for brevity */}
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
              className={cn("min-h-[140px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors group relative",
                !day.isCurrentMonth && "bg-gray-100 text-gray-400",
                day.isToday && "bg-blue-50 border-blue-200",
                isDragOver && "bg-green-50 border-green-300")}
              onClick={() => onDateClick?.(day.dateString)}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(day.dateString)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dateString)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-sm font-medium",
                  day.isToday && "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs")}
                >
                  {day.dayNumber}
                </span>
              </div>

              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={cn("text-xs p-1.5 rounded cursor-move hover:opacity-90 relative group/task transition-all",
                    task.color, "text-white border-l-2 border-white/30")}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTaskClick?.(task)
                  }}
                >
                  <div className="truncate font-medium text-xs">{task.title}</div>
                  <div className="text-xs opacity-90">
                    {task.assignee}
                    {task.startTime && ` \u2022 ${formatTime(task.startTime)}`}
                    {task.endDate && task.date !== task.endDate && " →"}
                  </div>
                </div>
              ))}

              {overflowTasks.length > 0 && (
                <TaskOverflowPopover tasks={overflowTasks} date={day.dateString} />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
