"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { SchedulerGrid } from "@/components/scheduler/scheduler-grid"
import { CalendarMonthView } from "@/components/scheduler/calender-month-view"
import { DayView } from "@/components/scheduler/day-view"
import { TaskDialog } from "@/components/scheduler/task-dialog"
import { ViewToggle, type ViewType } from "@/components/scheduler/view-toggle"
import { TaskSummary } from "@/components/scheduler/task-summary"
import { TimelineView } from "@/components/scheduler/timeline-view"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { toast } from "sonner"

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

export default function MERNScheduler() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "The SSL protocol",
      description: "Implement SSL protocol for secure connections",
      assignee: "Jeremie",
      date: "2025-06-20",
      color: "bg-blue-500",
      startTime: "09:00",
      endTime: "11:00",
    },
    {
      id: "2",
      title: "Up",
      description: "System updates",
      assignee: "Lamar",
      date: "2025-06-21",
      color: "bg-green-500",
      startTime: "12:00",
      endTime: "15:15",
    },
    {
      id: "3",
      title: "The SSL",
      description: "SSL continuation",
      assignee: "Lamar",
      date: "2025-06-21",
      color: "bg-orange-500",
      startTime: "16:00",
      endTime: "18:00",
    },
    {
      id: "4",
      title: "Fiscal",
      description: "Fiscal planning",
      assignee: "Lamar",
      date: "2025-06-21",
      color: "bg-blue-500",
      startTime: "19:00",
      endTime: "21:00",
    },
  ])

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Jeremie" },
    { id: "2", name: "Lizzie" },
    { id: "3", name: "Lamar" },
    { id: "4", name: "Jeff" },
  ])

  const [currentView, setCurrentView] = useState<ViewType>("grid")
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [showTimeline, setShowTimeline] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultAssignee, setDefaultAssignee] = useState("")
  const [defaultDate, setDefaultDate] = useState("")

  const handleAddTask = (date?: string, time?: string) => {
    setEditingTask(null)
    setDefaultAssignee("")
    setDefaultDate(date || "")
    setIsTaskDialogOpen(true)
  }

  const handleCellClick = (assignee: string, date: string) => {
    setEditingTask(null)
    setDefaultAssignee(assignee)
    setDefaultDate(date)
    setIsTaskDialogOpen(true)
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setEditingTask(null)
    setDefaultAssignee("")
    setDefaultDate(date)
    setIsTaskDialogOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setEditingTask(task)
    setSelectedDate(task.date)
    setIsTaskDialogOpen(true)
  }

  const handleDayViewClick = (date: string) => {
    setSelectedDate(date)
    setCurrentView("day")
  }

  const handleTaskSave = (taskData: Omit<Task, "id"> | Task) => {
    if ("id" in taskData) {
      // Update existing task
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskData.id ? taskData : task)))
      toast.success("Task updated successfully")
    } else {
      // Create new task
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
      }
      setTasks((prevTasks) => [...prevTasks, newTask])
      toast.success("Task created successfully")
    }
    setIsTaskDialogOpen(false)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    toast.success("Task updated successfully")
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
    toast.success("Task deleted successfully")
    setIsTaskDialogOpen(false)
  }

  const handleTaskMove = (taskId: string, newAssigneeOrDate: string, newDate?: string, newTime?: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          if (newDate) {
            return { ...task, assignee: newAssigneeOrDate, date: newDate }
          } else if (newTime) {
            return { ...task, date: newAssigneeOrDate, startTime: newTime }
          } else {
            return { ...task, date: newAssigneeOrDate }
          }
        }
        return task
      }),
    )
    toast.success("Task moved successfully")
  }

  const handleTeamMemberReorder = (fromIndex: number, toIndex: number) => {
    const newTeamMembers = [...teamMembers]
    const [movedMember] = newTeamMembers.splice(fromIndex, 1)
    newTeamMembers.splice(toIndex, 0, movedMember)
    setTeamMembers(newTeamMembers)
    toast.success("Resource reordered successfully")
  }

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(selectedMember === memberId ? "" : memberId)
  }

  const filteredTasks = selectedMember
    ? tasks.filter((task) => {
        const member = teamMembers.find((m) => m.id === selectedMember)
        return member && task.assignee === member.name
      })
    : tasks

  const viewToggle = <ViewToggle currentView={currentView} onViewChange={setCurrentView} />

  const renderCurrentView = () => {
    switch (currentView) {
      case "grid":
        return (
          <SchedulerGrid
            tasks={filteredTasks}
            teamMembers={teamMembers}
            onTaskClick={handleTaskClick}
            onCellClick={handleCellClick}
            onTaskDelete={handleTaskDelete}
            onTaskMove={handleTaskMove}
            onTaskUpdate={handleTaskUpdate}
            onTeamMemberReorder={handleTeamMemberReorder}
          />
        )
      case "month":
        return (
          <CalendarMonthView
            tasks={filteredTasks}
            teamMembers={teamMembers}
            selectedMember={selectedMember}
            onTaskClick={handleTaskClick}
            onDateClick={handleDateClick}
            onTaskDelete={handleTaskDelete}
            onTaskMove={(taskId, newDate) => handleTaskMove(taskId, newDate)}
            onDayViewClick={handleDayViewClick}
          />
        )
      case "day":
        return (
          <DayView
            tasks={filteredTasks}
            teamMembers={teamMembers}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onTaskClick={handleTaskClick}
            onTaskDelete={handleTaskDelete}
            onAddTask={handleAddTask}
            onTaskMove={(taskId, newDate, newTime) => handleTaskMove(taskId, newDate, undefined, newTime)}
          />
        )
      default:
        return null
    }
  }

  return (
    <MainLayout
      teamMembers={teamMembers}
      selectedMember={selectedMember}
      onMemberSelect={handleMemberSelect}
      onAddTask={() => handleAddTask()}
      viewControls={viewToggle}
    >
      <div className="p-6 space-y-6">
        {/* Main Content Area */}
        <div className={currentView === "month" ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : ""}>
          <div className={currentView === "month" ? "lg:col-span-2" : ""}>{renderCurrentView()}</div>

          {/* Task Summary Sidebar for Month View */}
          {currentView === "month" && (
            <div className="lg:col-span-1 space-y-4">
              <TaskSummary tasks={filteredTasks} selectedDate={selectedDate} onTaskClick={handleTaskClick} />

              {/* Timeline Toggle */}
              {selectedDate && (
                <Card className="p-4">
                  <Button
                    variant={showTimeline ? "default" : "outline"}
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="w-full flex items-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>{showTimeline ? "Hide" : "Show"} Timeline</span>
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Timeline View */}
        {showTimeline && selectedDate && currentView === "month" && (
          <TimelineView
            tasks={filteredTasks}
            selectedDate={selectedDate}
            onTaskClick={handleTaskClick}
            onTaskDelete={handleTaskDelete}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {tasks.filter((task) => task.date === new Date().toISOString().split("T")[0]).length}
            </div>
            <div className="text-sm text-gray-600">Today's Tasks</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {currentView === "grid" ? "Timeline" : currentView === "month" ? "Monthly" : "Daily"}
            </div>
            <div className="text-sm text-gray-600">Current View</div>
          </Card>
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask}
        teamMembers={teamMembers}
        defaultAssignee={defaultAssignee}
        defaultDate={defaultDate}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />
    </MainLayout>
  )
}
