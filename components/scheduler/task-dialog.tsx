"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock, User, CalendarIcon, Palette, ChevronDown } from "lucide-react"
import { format } from "date-fns"
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
  endDate?: string // For multi-day tasks
  isMultiDay?: boolean
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

// Fix date conversion to avoid timezone issues
const dateToString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const stringToDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

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
    endDate: "",
    color: "bg-blue-500",
    startTime: "",
    endTime: "",
    isMultiDay: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        assignee: task.assignee,
        date: task.date,
        endDate: task.endDate || task.date,
        color: task.color,
        startTime: task.startTime || "",
        endTime: task.endTime || "",
        isMultiDay: task.isMultiDay || false,
      })
    } else {
      setFormData({
        title: "",
        description: "",
        assignee: defaultAssignee || "",
        date: defaultDate || "",
        endDate: defaultDate || "",
        color: "bg-blue-500",
        startTime: "",
        endTime: "",
        isMultiDay: false,
      })
    }
    setErrors({})
  }, [task, defaultAssignee, defaultDate, open])

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        title: "",
        description: "",
        assignee: "",
        date: "",
        endDate: "",
        color: "bg-blue-500",
        startTime: "",
        endTime: "",
        isMultiDay: false,
      })
      setErrors({})
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    }

    if (!formData.assignee) {
      newErrors.assignee = "Please select an assignee"
    }

    if (!formData.date) {
      newErrors.date = "Please select a start date"
    }

    if (formData.isMultiDay && !formData.endDate) {
      newErrors.endDate = "Please select an end date"
    }

    if (formData.isMultiDay && formData.date && formData.endDate && formData.date > formData.endDate) {
      newErrors.endDate = "End date must be after start date"
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

    const taskData = {
      ...formData,
      endDate: formData.isMultiDay ? formData.endDate : undefined,
    }

    if (task) {
      onSave({ ...task, ...taskData })
    } else {
      onSave(taskData)
    }

    // Explicitly close dialog
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id)
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
    let dayDuration = ""
    let timeDuration = ""

    if (formData.isMultiDay && formData.date && formData.endDate) {
      const startDate = new Date(formData.date)
      const endDate = new Date(formData.endDate)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      dayDuration = `${diffDays} day${diffDays !== 1 ? "s" : ""}`
    }

    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(":").map(Number)
      const [endHour, endMin] = formData.endTime.split(":").map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const duration = endMinutes - startMinutes

      if (duration > 0) {
        const hours = Math.floor(duration / 60)
        const minutes = duration % 60

        if (formData.isMultiDay) {
          // For multi-day: start time on start date, end time on end date
          timeDuration = `${formatTime(formData.startTime)} start - ${formatTime(formData.endTime)} end`
        } else {
          // For single day: show duration
          if (hours === 0) timeDuration = `${minutes}m`
          else if (minutes === 0) timeDuration = `${hours}h`
          else timeDuration = `${hours}h ${minutes}m`
        }
      }
    }

    if (dayDuration && timeDuration) {
      return `${dayDuration} (${timeDuration})`
    }
    return dayDuration || timeDuration || ""
  }

  const selectedColor = COLORS.find((c) => c.value === formData.color)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${formData.color}`}></div>
            <span>{task ? "Edit Task" : "Create New Task"}</span>
            {formData.isMultiDay && <Badge variant="secondary">Multi-day</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
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

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Assignee *</span>
            </Label>
            <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
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

          {/* Multi-day Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="multiDay"
              checked={formData.isMultiDay}
              onCheckedChange={(checked) => {
                setFormData({
                  ...formData,
                  isMultiDay: checked,
                  endDate: checked ? formData.endDate || formData.date : "",
                })
              }}
            />
            <Label htmlFor="multiDay" className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Multi-day event</span>
            </Label>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            <div className={cn("grid gap-4", formData.isMultiDay ? "grid-cols-2" : "grid-cols-1")}>
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formData.isMultiDay ? "Start Date *" : "Date *"}</span>
                </Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                        errors.date && "border-red-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(stringToDate(formData.date), "PPP") : "Pick a date"}
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? stringToDate(formData.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dateString = dateToString(date)
                          setFormData({ ...formData, date: dateString })
                          setStartDateOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>

              {/* End Date (Multi-day only) */}
              {formData.isMultiDay && (
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>End Date *</span>
                  </Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground",
                          errors.endDate && "border-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(stringToDate(formData.endDate), "PPP") : "Pick end date"}
                        <ChevronDown className="ml-auto h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate ? stringToDate(formData.endDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const dateString = dateToString(date)
                            setFormData({ ...formData, endDate: dateString })
                            setEndDateOpen(false)
                          }
                        }}
                        disabled={(date) => {
                          if (!formData.date) return false
                          return date < stringToDate(formData.date)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                </div>
              )}
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
          </div>

          {/* Duration Summary */}
          {calculateDuration() && (
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Duration: {calculateDuration()}</span>
              </div>
              {formData.startTime && (
                <span>
                  {formatTime(formData.startTime)}
                  {formData.endTime && ` - ${formatTime(formData.endTime)}`}
                  {formData.isMultiDay ? "" : ""}
                </span>
              )}
            </div>
          )}

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
            <Button onClick={handleSave} className="flex-1 bg-black text-white hover:bg-gray-800">
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
