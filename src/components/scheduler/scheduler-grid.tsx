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
  endDate?: string
  isMultiDay?: boolean
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
  const [draggedResourceGroup, setDraggedResourceGroup] = useState<{ groupId: string; index: number } | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)
  const [dragOverResource, setDragOverResource] = useState<number | null>(null)
  const [timeZoomLevel, setTimeZoomLevel] = useState<TimeZoomLevel>("1hour")
  const [dateZoomLevel, setDateZoomLevel] = useState(6)
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date("2025-06-20"))
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([])

  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize resource groups from team members
  useEffect(() => {
    const groups = teamMembers.map((member, index) => ({
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

  // Responsive settings
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

  // Get tasks for a specific assignee (no duplication for multi-day)
  const getTasksForAssignee = (assignee: string) => {
    return tasks.filter((task) => task.assignee === assignee)
  }

  // Calculate multi-day task positioning
  const getMultiDayTaskPosition = (task: Task) => {
    if (!task.isMultiDay || !task.endDate) return null

    const startIndex = weekDates.findIndex((d) => d.date === task.date)
    const endIndex = weekDates.findIndex((d) => d.date === task.endDate)

    if (startIndex === -1) return null

    const actualEndIndex = endIndex === -1 ? weekDates.length - 1 : endIndex
    const spanDays = actualEndIndex - startIndex + 1

    return {
      startIndex,
      spanDays,
      left: `${startIndex * (100 / weekDates.length)}%`,
      width: `${spanDays * (100 / weekDates.length)}%`,
    }
  }

  // Resource group drag handlers
  const handleResourceGroupDragStart = (e: React.DragEvent, groupId: string, index: number) => {
    setDraggedResourceGroup({ groupId, index })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", groupId)
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleResourceGroupDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = "1"
    setDraggedResourceGroup(null)
    setDragOverResource(null)
  }

  const handleResourceGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleResourceGroupDragEnter = (index: number) => {
    setDragOverResource(index)
  }

  const handleResourceGroupDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedResourceGroup && onTeamMemberReorder && draggedResourceGroup.index !== targetIndex) {
      onTeamMemberReorder(draggedResourceGroup.index, targetIndex)

      // Reorder resource groups locally
      const newGroups = [...resourceGroups]
      const [movedGroup] = newGroups.splice(draggedResourceGroup.index, 1)
      newGroups.splice(targetIndex, 0, movedGroup)
      setResourceGroups(newGroups)
    }
    setDraggedResourceGroup(null)
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

    const updatedTask = {
      ...draggedTask,
      assignee,
      date,
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

  const getTaskPosition = (task: Task, cellWidth: number) => {
    if (!task.startTime) return null

    const startMinutes = timeToMinutes(task.startTime)
    const endMinutes = task.endTime ? timeToMinutes(task.endTime) : startMinutes + 60

    const viewDuration = 24 * 60 // Total minutes in a day
    const leftPercent = (startMinutes / viewDuration) * 100
    const widthPercent = Math.max(5, ((endMinutes - startMinutes) / viewDuration) * 100)

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    }
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

          {/* Team Member Rows - Draggable as whole groups */}
          {resourceGroups.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {/* Draggable Group Header */}
              <div
                className={cn(
                  "flex border-b bg-gray-100 cursor-move hover:bg-gray-200 transition-colors",
                  dragOverResource === groupIndex && "bg-blue-100 border-blue-300",
                )}
                style={{ minHeight: "60px" }}
                draggable
                onDragStart={(e) => handleResourceGroupDragStart(e, group.id, groupIndex)}
                onDragEnd={handleResourceGroupDragEnd}
                onDragOver={handleResourceGroupDragOver}
                onDragEnter={() => handleResourceGroupDragEnter(groupIndex)}
                onDrop={(e) => handleResourceGroupDrop(e, groupIndex)}
              >
                <div
                  className="bg-gray-200 p-3 font-medium flex items-center border-r flex-shrink-0 cursor-pointer hover:bg-gray-300 transition-colors"
                  style={{ width: "200px" }}
                  onClick={() => toggleGroupExpansion(group.id)}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <GripVertical className="h-4 w-4 text-gray-400" />
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
                      {
                        getTasksForAssignee(group.name).filter((task) => {
                          if (task.isMultiDay && task.endDate) {
                            const taskStart = new Date(task.date)
                            const taskEnd = new Date(task.endDate)
                            const currentDate = new Date(dateObj.date)
                            return currentDate >= taskStart && currentDate <= taskEnd
                          }
                          return task.date === dateObj.date
                        }).length
                      }
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Resource Instances */}
              {group.isExpanded &&
                group.instances.map((instance, instanceIndex) => (
                  <div key={instance.id} className="flex border-b relative" style={{ minHeight: "140px" }}>
                    {/* Resource Instance */}
                    <div
                      className="bg-white p-3 font-medium flex items-center border-r flex-shrink-0 border-l-4 border-blue-500"
                      style={{ width: "200px" }}
                    >
                      <div className="flex items-center space-x-2 w-full">
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
                            className="h-5 w-5 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Row Container */}
                    <div className="flex-1 relative">
                      {/* Date columns grid background */}
                      <div className="absolute inset-0 flex">
                        {weekDates.map((dateObj) => (
                          <div
                            key={`bg-${dateObj.date}`}
                            className="flex-1 border-r bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => onCellClick?.(instance.instanceName || instance.name, dateObj.date)}
                            onDragOver={handleTaskDragOver}
                            onDragEnter={() =>
                              handleTaskDragEnter(instance.instanceName || instance.name, dateObj.date)
                            }
                            onDragLeave={handleTaskDragLeave}
                            onDrop={(e) => handleTaskDrop(e, instance.instanceName || instance.name, dateObj.date)}
                          >
                            {/* Hour grid lines */}
                            <div className="absolute inset-0 flex">
                              {timeColumns.map((timeCol) => (
                                <div
                                  key={`grid-${timeCol.minutes}`}
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

                            {/* Add task button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-5 transition-opacity">
                              <Plus className="h-6 w-6 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tasks Layer - Multi-day tasks span across columns */}
                      <div className="absolute inset-0 pointer-events-none">
                        {getTasksForAssignee(instance.name).map((task, taskIndex) => {
                          if (task.isMultiDay && task.endDate) {
                            // Multi-day task spanning across columns - SINGLE CONTINUOUS BAR
                            const multiDayPosition = getMultiDayTaskPosition(task)
                            if (!multiDayPosition) return null

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleTaskDragStart(e, task)}
                                onDragEnd={handleTaskDragEnd}
                                className={cn(
                                  "absolute text-white text-sm rounded-lg cursor-move hover:opacity-90 transition-all shadow-lg border border-white/30 flex items-center px-3 group/task overflow-hidden pointer-events-auto",
                                  task.color,
                                )}
                                style={{
                                  left: multiDayPosition.left,
                                  width: multiDayPosition.width,
                                  top: `${20 + taskIndex * 40}px`,
                                  height: "35px",
                                  zIndex: 10 + taskIndex,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onTaskClick?.(task)
                                }}
                                title={`${task.title} - Multi-day task (${task.date} to ${task.endDate})`}
                              >
                                <div className="flex flex-col justify-center w-full min-w-0 py-1">
                                  <div className="font-semibold truncate text-xs leading-tight">{task.title}</div>
                                  {task.startTime && task.endTime && (
                                    <div className="text-xs opacity-75 leading-tight">
                                      {formatTime(task.startTime)} - {formatTime(task.endTime)} daily
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1 opacity-0 group-hover/task:opacity-100 transition-opacity ml-2">
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
                              </div>
                            )
                          } else {
                            // Single-day task - only show on its specific date
                            const dateIndex = weekDates.findIndex((d) => d.date === task.date)
                            if (dateIndex === -1) return null

                            const position = getTaskPosition(task, cellWidth)
                            if (!position) {
                              // Task without time - show as simple block
                              return (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={(e) => handleTaskDragStart(e, task)}
                                  onDragEnd={handleTaskDragEnd}
                                  className={cn(
                                    "absolute text-white text-sm rounded-lg cursor-move hover:opacity-90 transition-all shadow-lg border border-white/30 flex items-center px-2 group/task overflow-hidden pointer-events-auto",
                                    task.color,
                                  )}
                                  style={{
                                    left: `${dateIndex * (100 / weekDates.length)}%`,
                                    width: `${100 / weekDates.length}%`,
                                    top: `${20 + taskIndex * 35}px`,
                                    height: "30px",
                                    zIndex: 10 + taskIndex,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskClick?.(task)
                                  }}
                                  title={task.title}
                                >
                                  <div className="font-semibold truncate text-xs">{task.title}</div>
                                </div>
                              )
                            }

                            // Task with time - position within the day
                            const dayWidth = 100 / weekDates.length
                            const taskLeft =
                              dateIndex * dayWidth +
                              (Number.parseFloat(position.left.replace("%", "")) * dayWidth) / 100
                            const taskWidth = (Number.parseFloat(position.width.replace("%", "")) * dayWidth) / 100

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleTaskDragStart(e, task)}
                                onDragEnd={handleTaskDragEnd}
                                className={cn(
                                  "absolute text-white text-sm rounded-lg cursor-move hover:opacity-90 transition-all shadow-lg border border-white/30 flex items-center px-2 group/task overflow-hidden pointer-events-auto",
                                  task.color,
                                )}
                                style={{
                                  left: `${taskLeft}%`,
                                  width: `${Math.max(taskWidth, 5)}%`,
                                  top: `${20 + taskIndex * 35}px`,
                                  height: "30px",
                                  zIndex: 10 + taskIndex,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onTaskClick?.(task)
                                }}
                                title={`${task.title} - ${formatTime(task.startTime!)}${task.endTime ? ` - ${formatTime(task.endTime)}` : ""}`}
                              >
                                <div className="flex flex-col justify-center w-full min-w-0">
                                  <div className="font-semibold truncate text-xs leading-tight">{task.title}</div>
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
                              </div>
                            )
                          }
                        })}
                      </div>
                    </div>
                  </div>
                ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  )
}
