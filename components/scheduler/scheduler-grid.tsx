"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ChevronRightIcon,
  X,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface ResourceGroup {
  id: string
  name: string
  instances: TeamMemberInstance[]
  isExpanded: boolean
}

interface TeamMemberInstance {
  id: string
  name: string
  instanceId: string
  instanceName?: string
  groupId: string
}

interface TeamMember {
  id: string
  name: string
}

interface SchedulerGridProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  onTaskClick?: (task: Task) => void
  onCellClick?: (assignee: string, date: string) => void
  onTaskDelete?: (taskId: string) => void
  onTaskMove?: (taskId: string, newAssignee: string, newDate: string) => void
  onTaskUpdate?: (task: Task) => void
  onTeamMemberReorder?: (fromIndex: number, toIndex: number) => void
}

type TimeZoomLevel = "30min" | "1hour" | "2hour" | "4hour" | "6hour"

export function SchedulerGrid({
  tasks,
  teamMembers,
  onTaskClick,
  onCellClick,
  onTaskDelete,
  onTaskMove,
  onTaskUpdate,
  onTeamMemberReorder,
}: SchedulerGridProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedResource, setDraggedResource] = useState<{ member: TeamMember; index: number } | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)
  const [dragOverResource, setDragOverResource] = useState<number | null>(null)
  const [timeZoomLevel, setTimeZoomLevel] = useState<TimeZoomLevel>("1hour")
  const [dateZoomLevel, setDateZoomLevel] = useState(6)
  const [resizingTask, setResizingTask] = useState<{
    taskId: string
    edge: "start" | "end"
    originalTask: Task
  } | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date("2025-06-20"))
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<{
    startX: number
    originalStart: number
    originalEnd: number
    cellWidth: number
    pixelsPerMinute: number
  } | null>(null)

  // Initialize resource groups from team members
  useEffect(() => {
    const groups = teamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      instances: [
        {
          id: `${member.id}-1`,
          name: member.name,
          instanceId: "1",
          instanceName: `${member.name} #1`,
          groupId: member.id,
        },
      ],
      isExpanded: true,
    }))
    setResourceGroups(groups)
  }, [teamMembers])

  const addResourceInstance = (groupId: string) => {
    setResourceGroups((groups) =>
      groups.map((group) => {
        if (group.id === groupId) {
          const newInstanceId = (group.instances.length + 1).toString()
          const newInstance = {
            id: `${groupId}-${newInstanceId}`,
            name: group.name,
            instanceId: newInstanceId,
            instanceName: `${group.name} #${newInstanceId}`,
            groupId: groupId,
          }
          return {
            ...group,
            instances: [...group.instances, newInstance],
          }
        }
        return group
      }),
    )
  }

  const removeResourceInstance = (groupId: string, instanceId: string) => {
    setResourceGroups((groups) =>
      groups.map((group) => {
        if (group.id === groupId && group.instances.length > 1) {
          return {
            ...group,
            instances: group.instances.filter((instance) => instance.instanceId !== instanceId),
          }
        }
        return group
      }),
    )
  }

  const toggleGroupExpansion = (groupId: string) => {
    setResourceGroups((groups) =>
      groups.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group)),
    )
  }

  // Responsive spacing based on zoom level and screen size
  const getResponsiveSettings = (timeZoom: TimeZoomLevel, dateZoom: number) => {
    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200
    const availableWidth = screenWidth - 250

    const timeSettings = {
      "30min": {
        interval: 30,
        baseWidth: Math.max(1200, availableWidth / Math.max(1, dateZoom - 3)),
        fontSize: "10px",
        showAllLabels: true,
        headerHeight: "60px",
      },
      "1hour": {
        interval: 60,
        baseWidth: Math.max(800, availableWidth / Math.max(1, dateZoom - 1)),
        fontSize: "11px",
        showAllLabels: true,
        headerHeight: "50px",
      },
      "2hour": {
        interval: 120,
        baseWidth: Math.max(600, availableWidth / dateZoom),
        fontSize: "12px",
        showAllLabels: false,
        headerHeight: "40px",
      },
      "4hour": {
        interval: 240,
        baseWidth: Math.max(400, availableWidth / dateZoom),
        fontSize: "12px",
        showAllLabels: false,
        headerHeight: "40px",
      },
      "6hour": {
        interval: 360,
        baseWidth: Math.max(300, availableWidth / dateZoom),
        fontSize: "12px",
        showAllLabels: false,
        headerHeight: "40px",
      },
    }

    return timeSettings[timeZoom]
  }

  const responsiveSettings = getResponsiveSettings(timeZoomLevel, dateZoomLevel)

  // Generate dates
  const generateWeekDates = () => {
    const dates = []
    const startDate = new Date(currentWeekStart)

    for (let i = 0; i < dateZoomLevel; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayMonth: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      })
    }
    return dates
  }

  // Generate 24-hour timeline
  const generateTimeColumns = () => {
    const columns = []
    const interval = responsiveSettings.interval

    for (let minutes = 0; minutes < 24 * 60; minutes += interval) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60

      columns.push({
        minutes,
        hour,
        minute,
        display: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        shortDisplay: hour.toString().padStart(2, "0"),
        isHourMark: minute === 0,
        isMajorMark: minute === 0 && hour % 6 === 0,
        isNightTime: hour < 6 || hour >= 22,
      })
    }
    return columns
  }

  const weekDates = generateWeekDates()
  const timeColumns = generateTimeColumns()
  const cellWidth = responsiveSettings.baseWidth

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setTimeZoomLevel((prev) => prev)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Mouse wheel zoom handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -1 : 1

        if (e.shiftKey) {
          setDateZoomLevel((prev) => Math.max(1, Math.min(14, prev + delta)))
        } else {
          const zoomOrder: TimeZoomLevel[] = ["6hour", "4hour", "2hour", "1hour", "30min"]
          const currentIndex = zoomOrder.indexOf(timeZoomLevel)

          if (delta > 0 && currentIndex < zoomOrder.length - 1) {
            setTimeZoomLevel(zoomOrder[currentIndex + 1])
          } else if (delta < 0 && currentIndex > 0) {
            setTimeZoomLevel(zoomOrder[currentIndex - 1])
          }
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      return () => container.removeEventListener("wheel", handleWheel)
    }
  }, [timeZoomLevel])

  const getTasksForCell = (assignee: string, date: string) => {
    return tasks
      .filter((task) => task.assignee === assignee && task.date === date)
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0
        return a.startTime.localeCompare(b.startTime)
      })
  }

  // Resource drag handlers
  const handleResourceDragStart = (e: React.DragEvent, member: TeamMemberInstance, index: number) => {
    setDraggedResource({ member, index })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", member.id)
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleResourceDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = "1"
    setDraggedResource(null)
    setDragOverResource(null)
  }

  const handleResourceDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleResourceDragEnter = (index: number) => {
    setDragOverResource(index)
  }

  const handleResourceDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedResource && onTeamMemberReorder && draggedResource.index !== targetIndex) {
      onTeamMemberReorder(draggedResource.index, targetIndex)
    }
    setDraggedResource(null)
    setDragOverResource(null)
  }

  // Task drag handlers
  const handleTaskDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", (e.currentTarget as HTMLElement).outerHTML)
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleTaskDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLElement).style.opacity = "1"
    setDraggedTask(null)
    setDragOverCell(null)
  }

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleTaskDragEnter = (assignee: string, date: string) => {
    setDragOverCell(`${assignee}-${date}`)
  }

  const handleTaskDragLeave = () => {
    setDragOverCell(null)
  }

  const handleTaskDrop = (e: React.DragEvent, assignee: string, date: string) => {
    e.preventDefault()
    if (!draggedTask || !onTaskUpdate) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const timePercentage = x / cellWidth
    const newTimeMinutes = Math.round((timePercentage * 24 * 60) / 15) * 15

    const newHour = Math.floor(newTimeMinutes / 60)
    const newMinute = newTimeMinutes % 60
    const newTime = `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`

    const updatedTask = {
      ...draggedTask,
      assignee,
      date,
      startTime: newTime,
      endTime: draggedTask.endTime
        ? (() => {
            const originalStart = timeToMinutes(draggedTask.startTime!)
            const originalEnd = timeToMinutes(draggedTask.endTime!)
            const duration = originalEnd - originalStart
            const newEndMinutes = Math.min(24 * 60 - 1, newTimeMinutes + duration)
            const endHour = Math.floor(newEndMinutes / 60)
            const endMinute = newEndMinutes % 60
            return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`
          })()
        : undefined,
    }

    onTaskUpdate(updatedTask)
    setDraggedTask(null)
    setDragOverCell(null)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const getTaskPosition = (task: Task, cellWidth: number) => {
    if (!task.startTime) return null

    const startMinutes = timeToMinutes(task.startTime)
    const endMinutes = task.endTime ? timeToMinutes(task.endTime) : startMinutes + 60

    const viewDuration = 24 * 60
    const leftPx = (startMinutes / viewDuration) * cellWidth
    const widthPx = Math.max(60, ((endMinutes - startMinutes) / viewDuration) * cellWidth)

    return {
      left: `${leftPx}px`,
      width: `${widthPx}px`,
    }
  }

  // Enhanced resize handlers with precise time calculation
  const handleResizeStart = (e: React.MouseEvent, taskId: string, edge: "start" | "end") => {
    e.preventDefault()
    e.stopPropagation()

    const task = tasks.find((t) => t.id === taskId)
    if (!task || !task.startTime || !onTaskUpdate) return

    setResizingTask({ taskId, edge, originalTask: task })

    const startMinutes = timeToMinutes(task.startTime)
    const endMinutes = task.endTime ? timeToMinutes(task.endTime) : startMinutes + 60
    const viewDuration = 24 * 60
    const pixelsPerMinute = cellWidth / viewDuration

    resizeRef.current = {
      startX: e.clientX,
      originalStart: startMinutes,
      originalEnd: endMinutes,
      cellWidth: cellWidth,
      pixelsPerMinute: pixelsPerMinute,
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current || !resizingTask || !onTaskUpdate) return

      const deltaX = e.clientX - resizeRef.current.startX
      const deltaMinutes = Math.round(deltaX / resizeRef.current.pixelsPerMinute / 5) * 5 // 5-minute precision

      let newStartMinutes = resizeRef.current.originalStart
      let newEndMinutes = resizeRef.current.originalEnd

      if (edge === "start") {
        newStartMinutes = Math.max(
          0,
          Math.min(resizeRef.current.originalEnd - 5, resizeRef.current.originalStart + deltaMinutes),
        )
      } else {
        newEndMinutes = Math.max(
          resizeRef.current.originalStart + 5,
          Math.min(24 * 60 - 1, resizeRef.current.originalEnd + deltaMinutes),
        )
      }

      const updatedTask = {
        ...task,
        startTime: minutesToTime(newStartMinutes),
        endTime: minutesToTime(newEndMinutes),
      }

      onTaskUpdate(updatedTask)
    }

    const handleMouseUp = () => {
      setResizingTask(null)
      resizeRef.current = null
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleTimeZoomIn = () => {
    const zoomOrder: TimeZoomLevel[] = ["6hour", "4hour", "2hour", "1hour", "30min"]
    const currentIndex = zoomOrder.indexOf(timeZoomLevel)
    if (currentIndex < zoomOrder.length - 1) {
      setTimeZoomLevel(zoomOrder[currentIndex + 1])
    }
  }

  const handleTimeZoomOut = () => {
    const zoomOrder: TimeZoomLevel[] = ["30min", "1hour", "2hour", "4hour", "6hour"]
    const currentIndex = zoomOrder.indexOf(timeZoomLevel)
    if (currentIndex < zoomOrder.length - 1) {
      setTimeZoomLevel(zoomOrder[currentIndex + 1])
    }
  }

  const resetView = () => {
    setTimeZoomLevel("1hour")
    setDateZoomLevel(6)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart)
    const daysToMove = Math.max(1, Math.floor(dateZoomLevel / 2))
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - daysToMove)
    } else {
      newDate.setDate(newDate.getDate() + daysToMove)
    }
    setCurrentWeekStart(newDate)
  }

  return (
    <Card className="overflow-hidden">
      {/* Controls */}
      <div className="bg-gray-50 border-b p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-4 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">Timeline View</h3>

          {/* Date Navigation */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 whitespace-nowrap">
              {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
              {new Date(currentWeekStart.getTime() + (weekDates.length - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                },
              )}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Time Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleTimeZoomOut} disabled={timeZoomLevel === "6hour"}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Select value={timeZoomLevel} onValueChange={(value: TimeZoomLevel) => setTimeZoomLevel(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">30min</SelectItem>
                <SelectItem value="1hour">1hour</SelectItem>
                <SelectItem value="2hour">2hour</SelectItem>
                <SelectItem value="4hour">4hour</SelectItem>
                <SelectItem value="6hour">6hour</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleTimeZoomIn} disabled={timeZoomLevel === "30min"}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Zoom */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Days:</span>
            <Select value={dateZoomLevel.toString()} onValueChange={(value) => setDateZoomLevel(Number(value))}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 14 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">
            Ctrl+Wheel: Time | Ctrl+Shift+Wheel: Date | Drag Resources & Tasks
          </div>
          <Badge variant="outline" className="text-xs">
            00:00 - 24:00 ({timeZoomLevel})
          </Badge>
        </div>
      </div>

      {/* Scrollable Timeline Container */}
      <div ref={containerRef} className="overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: `${200 + weekDates.length * cellWidth}px` }}>
          {/* Date Headers */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div className="bg-gray-100 p-3 border-r flex-shrink-0" style={{ width: "200px" }}>
              <div className="text-xs font-medium text-gray-600">Team / Date</div>
            </div>
            {weekDates.map((dateObj) => (
              <div
                key={dateObj.date}
                className="bg-red-600 text-white p-3 text-center border-r flex-shrink-0"
                style={{ width: `${cellWidth}px` }}
              >
                <div className="font-semibold text-sm">{dateObj.dayName}</div>
                <div className="text-xs mt-1">{dateObj.dayMonth}</div>
              </div>
            ))}
          </div>

          {/* Time Headers */}
          <div className="flex border-b bg-gray-50">
            <div className="p-2 border-r flex-shrink-0" style={{ width: "200px" }}>
              <div className="text-xs text-gray-600">24hr Timeline</div>
            </div>
            {weekDates.map((dateObj) => (
              <div key={`hours-${dateObj.date}`} className="border-r flex-shrink-0" style={{ width: `${cellWidth}px` }}>
                <div className="flex text-xs overflow-hidden" style={{ height: responsiveSettings.headerHeight }}>
                  {timeColumns.map((timeCol) => (
                    <div
                      key={`${dateObj.date}-${timeCol.minutes}`}
                      className={cn(
                        "flex-shrink-0 text-center border-r border-gray-200 text-gray-600 flex items-center justify-center",
                        timeCol.isMajorMark && "font-semibold border-r-2 border-gray-400 bg-gray-200",
                        timeCol.isNightTime && "bg-gray-300 text-gray-700",
                      )}
                      style={{
                        width: `${cellWidth / timeColumns.length}px`,
                        fontSize: responsiveSettings.fontSize,
                      }}
                    >
                      {(responsiveSettings.showAllLabels || timeCol.isHourMark) && (
                        <span className="whitespace-nowrap px-1">{timeCol.shortDisplay}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Team Member Rows - Now Draggable */}
          {resourceGroups.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {/* Group Header */}
              <div className="flex border-b bg-gray-100" style={{ minHeight: "60px" }}>
                <div
                  className="bg-gray-200 p-3 font-medium flex items-center border-r flex-shrink-0 cursor-pointer hover:bg-gray-300 transition-colors"
                  style={{ width: "200px" }}
                  onClick={() => toggleGroupExpansion(group.id)}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <ChevronRightIcon className={cn("h-4 w-4 transition-transform", group.isExpanded && "rotate-90")} />
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {group.name.charAt(0)}
                    </div>
                    <span className="text-sm flex-1">{group.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {group.instances.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        addResourceInstance(group.id)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Group summary cells */}
                {weekDates.map((dateObj) => (
                  <div
                    key={`group-${group.id}-${dateObj.date}`}
                    className="border-r bg-gray-100 flex items-center justify-center flex-shrink-0"
                    style={{ width: `${cellWidth}px` }}
                  >
                    <Badge variant="secondary" className="text-xs">
                      {group.instances.reduce(
                        (total, instance) =>
                          total + getTasksForCell(instance.instanceName || instance.name, dateObj.date).length,
                        0,
                      )}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Resource Instances */}
              {group.isExpanded &&
                group.instances.map((instance, instanceIndex) => (
                  <div key={instance.id} className="flex border-b" style={{ minHeight: "140px" }}>
                    {/* Draggable Resource Instance */}
                    <div
                      draggable
                      onDragStart={(e) => handleResourceDragStart(e, instance, groupIndex * 100 + instanceIndex)}
                      onDragEnd={handleResourceDragEnd}
                      onDragOver={handleResourceDragOver}
                      onDragEnter={() => handleResourceDragEnter(groupIndex * 100 + instanceIndex)}
                      onDrop={(e) => handleResourceDrop(e, groupIndex * 100 + instanceIndex)}
                      className={cn(
                        "bg-white p-3 font-medium flex items-center border-r flex-shrink-0 cursor-move hover:bg-gray-50 transition-colors group border-l-4 border-blue-500",
                        dragOverResource === groupIndex * 100 + instanceIndex && "bg-blue-50 border-blue-300",
                      )}
                      style={{ width: "200px" }}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs">
                          {instance.instanceId}
                        </div>
                        <span className="text-sm flex-1">{instance.instanceName}</span>
                        {group.instances.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeResourceInstance(group.id, instance.instanceId)
                            }}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Date columns with timeline for each instance */}
                    {weekDates.map((dateObj) => {
                      const cellTasks = getTasksForCell(instance.instanceName || instance.name, dateObj.date)
                      const cellId = `${instance.id}-${dateObj.date}`
                      const isDragOver = dragOverCell === cellId

                      return (
                        <div
                          key={cellId}
                          className={cn(
                            "relative border-r bg-white hover:bg-gray-50 cursor-pointer transition-colors group flex-shrink-0",
                            isDragOver && "bg-blue-50 border-blue-300",
                          )}
                          style={{ width: `${cellWidth}px` }}
                          onClick={() => onCellClick?.(instance.instanceName || instance.name, dateObj.date)}
                          onDragOver={handleTaskDragOver}
                          onDragEnter={() => handleTaskDragEnter(instance.instanceName || instance.name, dateObj.date)}
                          onDragLeave={handleTaskDragLeave}
                          onDrop={(e) => handleTaskDrop(e, instance.instanceName || instance.name, dateObj.date)}
                        >
                          {/* Rest of the cell content remains the same */}
                          {/* 24-hour grid background */}
                          <div className="absolute inset-0 flex">
                            {timeColumns.map((timeCol) => (
                              <div
                                key={`bg-${timeCol.minutes}`}
                                className={cn(
                                  "flex-shrink-0",
                                  timeCol.isMajorMark ? "border-r-2 border-gray-300" : "border-r border-gray-100",
                                  timeCol.isNightTime && "bg-gray-50",
                                )}
                                style={{
                                  width: `${cellWidth / timeColumns.length}px`,
                                }}
                              />
                            ))}
                          </div>

                          {/* Tasks positioned on timeline */}
                          <div className="relative h-full p-2">
                            {cellTasks.map((task, index) => {
                              const position = getTaskPosition(task, cellWidth)
                              if (!position) return null

                              return (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={(e) => handleTaskDragStart(e, task)}
                                  onDragEnd={handleTaskDragEnd}
                                  className={cn(
                                    "absolute text-white text-sm rounded-lg cursor-move hover:opacity-90 transition-all shadow-lg border border-white/30 flex items-center px-2 group/task overflow-hidden",
                                    task.color,
                                    resizingTask?.taskId === task.id && "ring-2 ring-blue-400",
                                  )}
                                  style={{
                                    ...position,
                                    top: `${8 + index * 50}px`,
                                    height: "45px",
                                    zIndex: 10 + index,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskClick?.(task)
                                  }}
                                  title={`${task.title} - ${formatTime(task.startTime!)}${task.endTime ? ` - ${formatTime(task.endTime)}` : ""}`}
                                >
                                  {/* Task content remains the same */}
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/40 opacity-0 group-hover/task:opacity-100 bg-white/20 rounded-l-lg flex items-center justify-center"
                                    onMouseDown={(e) => handleResizeStart(e, task.id, "start")}
                                  >
                                    <div className="w-1 h-4 bg-white/80 rounded"></div>
                                  </div>

                                  <div className="flex flex-col justify-center w-full min-w-0 py-1 px-1">
                                    <div className="font-semibold truncate text-xs leading-tight">{task.title}</div>
                                    {task.startTime && (
                                      <div className="text-xs opacity-90 leading-tight">
                                        {formatTime(task.startTime)}
                                        {task.endTime && ` - ${formatTime(task.endTime)}`}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1 opacity-0 group-hover/task:opacity-100 transition-opacity ml-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 hover:bg-white/20"
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
                                      className="h-5 w-5 p-0 hover:bg-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onTaskDelete?.(task.id)
                                      }}
                                      title="Delete task"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>

                                  <div
                                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/40 opacity-0 group-hover/task:opacity-100 bg-white/20 rounded-r-lg flex items-center justify-center"
                                    onMouseDown={(e) => handleResizeStart(e, task.id, "end")}
                                  >
                                    <div className="w-1 h-4 bg-white/80 rounded"></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-5 transition-opacity">
                            <Plus className="h-6 w-6 text-gray-400" />
                          </div>

                          {cellTasks.length > 0 && (
                            <Badge variant="secondary" className="absolute top-2 right-2 text-xs z-20">
                              {cellTasks.length}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  )
}
