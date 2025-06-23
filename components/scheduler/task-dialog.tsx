"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, Palette } from "lucide-react"

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

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  teamMembers: TeamMember[]
  defaultAssignee?: string
  defaultDate?: string
  onSave: (task: Omit<Task, "id"> | Task) => void
  onDelete?: (taskId: string) => void
}

const COLORS = [
  { value: "bg-blue-500", label: "Blue", hex: "#3B82F6" },
  { value: "bg-green-500", label: "Green", hex: "#10B981" },
  { value: "bg-purple-500", label: "Purple", hex: "#8B5CF6" },
  { value: "bg-orange-500", label: "Orange", hex: "#F97316" },
  { value: "bg-pink-500", label: "Pink", hex: "#EC4899" },
  { value: "bg-cyan-500", label: "Cyan", hex: "#06B6D4" },
  { value: "bg-red-500", label: "Red", hex: "#EF4444" },
  { value: "bg-yellow-500", label: "Yellow", hex: "#EAB308" },
  { value: "bg-indigo-500", label: "Indigo", hex: "#6366F1" },
  { value: "bg-teal-500", label: "Teal", hex: "#14B8A6" },
]

export function TaskDialog({
  open,
  onOpenChange,
  task,
  teamMembers,
  defaultAssignee,
  defaultDate,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    date: "",
    color: "bg-blue-500",
    startTime: "",
    endTime: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate dates for the current week and month
  const generateDates = () => {
    const dates = []
    const startDate = new Date("2025-06-01")
    const endDate = new Date("2025-06-30")

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push({
        date: currentDate.toISOString().split("T")[0],
        dayName: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
        dayMonth: currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const availableDates = generateDates()

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        assignee: task.assignee,
        date: task.date,
        color: task.color,
        startTime: task.startTime || "",
        endTime: task.endTime || "",
      })
    } else {
      setFormData({
        title: "",
        description: "",
        assignee: defaultAssignee || "",
        date: defaultDate || "",
        color: "bg-blue-500",
        startTime: "",
        endTime: "",
      })
    }
    setErrors({})
  }, [task, defaultAssignee, defaultDate, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    }

    if (!formData.assignee) {
      newErrors.assignee = "Please select an assignee"
    }

    if (!formData.date) {
      newErrors.date = "Please select a date"
    }

    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    if (task) {
      onSave({ ...task, ...formData })
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id)
      onOpenChange(false)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return ""

    const [startHour, startMin] = formData.startTime.split(":").map(Number)
    const [endHour, endMin] = formData.endTime.split(":").map(Number)

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

  const selectedColor = COLORS.find((c) => c.value === formData.color)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${formData.color}`}></div>
            <span>{task ? "Edit Task" : "Create New Task"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <span>Task Title *</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          {/* Assignee and Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Assignee *</span>
              </Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData({ ...formData, assignee: value })}
              >
                <SelectTrigger className={errors.assignee ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignee && <p className="text-sm text-red-500">{errors.assignee}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date *</span>
              </Label>
              <Select value={formData.date} onValueChange={(value) => setFormData({ ...formData, date: value })}>
                <SelectTrigger className={errors.date ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((dateObj) => (
                    <SelectItem key={dateObj.date} value={dateObj.date}>
                      {dateObj.dayName}, {dateObj.dayMonth}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>
          </div>

          {/* Time Section */}
          <div className="space-y-4">
            <Label className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Time Schedule</span>
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className={errors.endTime ? "border-red-500" : ""}
                />
                {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>

            {/* Time Summary */}
            {formData.startTime && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(formData.startTime)}
                    {formData.endTime && ` - ${formatTime(formData.endTime)}`}
                  </span>
                </div>
                {calculateDuration() && <Badge variant="outline">Duration: {calculateDuration()}</Badge>}
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Color</span>
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-lg border-2 transition-all hover:scale-105",
                    formData.color === color.value
                      ? "border-gray-800 shadow-md"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                  title={color.label}
                >
                  <div className={`w-6 h-6 rounded ${color.value} shadow-sm`}></div>
                </button>
              ))}
            </div>
            {selectedColor && <p className="text-sm text-gray-600">Selected: {selectedColor.label}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} className="flex-1">
              {task ? "Update Task" : "Create Task"}
            </Button>
            {task && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | undefined | boolean)[]): string {
  return classes.filter(Boolean).join(" ")
}
