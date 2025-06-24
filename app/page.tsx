"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { SchedulerGrid } from "@/components/scheduler/scheduler-grid"
import { CalendarMonthView } from "@/components/scheduler/calendar-month-view"
import { DayView } from "@/components/scheduler/day-view"
import { TaskDialog } from "@/components/scheduler/task-dialog"
import { ViewToggle, type ViewType } from "@/components/scheduler/view-toggle"
import { TaskSummary } from "@/components/scheduler/task-summary"
import { TimelineView } from "@/components/scheduler/timeline-view"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Clock } from "lucide-react"

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

export default function MERNScheduler() {
  const { toast } = useToast()

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "The SSL protocol",
      description: "Implement SSL protocol for secure connections",
      assignee: "Jeremie",
      date: "2025-06-21",
      color: "bg-blue-500",
      startTime: "09:00",
      endTime: "11:00",
    },
    {
      id: "2",
      title: "Use me",
      description: "Database optimization task",
      assignee: "Jeremie",
      date: "2025-06-21",
      color: "bg-cyan-500",
      startTime: "14:00",
      endTime: "16:00",
    },
    {
      id: "3",
      title: "You can't bypass",
      description: "Security audit and fixes",
      assignee: "Jeremie",
      date: "2025-06-21",
      color: "bg-blue-500",
      startTime: "16:30",
      endTime: "18:00",
    },
    {
      id: "4",
      title: "Transmitting the",
      description: "Data transmission protocols",
      assignee: "Jeremie",
      date: "2025-06-22",
      color: "bg-blue-500",
      startTime: "10:00",
      endTime: "12:00",
    },
    {
      id: "5",
      title: "Try to navigate the",
      description: "UI/UX improvements",
      assignee: "Lizzie",
      date: "2025-06-21",
      color: "bg-purple-500",
      startTime: "09:30",
      endTime: "11:30",
    },
    {
      id: "6",
      title: "Up",
      description: "System updates",
      assignee: "Lamar",
      date: "2025-06-20",
      color: "bg-green-500",
      startTime: "12:00",
      endTime: "15:15",
    },
    {
      id: "7",
      title: "The SCSI",
      description: "Hardware configuration",
      assignee: "Lamar",
      date: "2025-06-21",
      color: "bg-orange-500",
      startTime: "13:00",
      endTime: "15:00",
    },
    {
      id: "8",
      title: "If local",
      description: "Local environment setup",
      assignee: "Lamar",
      date: "2025-06-21",
      color: "bg-blue-500",
      startTime: "15:30",
      endTime: "17:00",
    },
    {
      id: "9",
      title: "You",
      description: "Code review session",
      assignee: "Jeff",
      date: "2025-06-21",
      color: "bg-pink-500",
      startTime: "11:00",
      endTime: "12:00",
    },
    {
      id: "10",
      title: "It we quantify",
      description: "Performance metrics analysis",
      assignee: "Jeremie",
      date: "2025-06-22",
      color: "bg-blue-500",
      startTime: "14:00",
      endTime: "16:00",
    },
    {
      id: "11",
      title: "It will",
      description: "Future planning session",
      assignee: "Jeremie",
      date: "2025-06-22",
      color: "bg-cyan-500",
      startTime: "16:30",
      endTime: "17:30",
    },
    {
      id: "12",
      title: "Hi bypass the",
      description: "System bypass implementation",
      assignee: "Jeremie",
      date: "2025-06-23",
      color: "bg-blue-500",
      startTime: "09:00",
      endTime: "11:00",
    },
    {
      id: "13",
      title: "We need",
      description: "Requirements gathering",
      assignee: "Lizzie",
      date: "2025-06-22",
      color: "bg-purple-500",
      startTime: "10:00",
      endTime: "12:00",
    },
    {
      id: "14",
      title: "We need to",
      description: "Action items discussion",
      assignee: "Lizzie",
      date: "2025-06-22",
      color: "bg-green-500",
      startTime: "13:00",
      endTime: "14:00",
    },
    {
      id: "15",
      title: "Try to",
      description: "Problem solving session",
      assignee: "Lizzie",
      date: "2025-06-22",
      color: "bg-orange-500",
      startTime: "15:00",
      endTime: "16:00",
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
    setDefaultAssignee(assignee) // This will now be the instance name like "Jeremie #1"
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
      setTasks(tasks.map((task) => (task.id === taskData.id ? taskData : task)))
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated.",
      })
    } else {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
      }
      setTasks([...tasks, newTask])
      toast({
        title: "Task Added",
        description: "New task has been successfully added.",
      })
    }
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    toast({
      title: "Task Updated",
      description: "Task has been successfully updated.",
    })
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
    toast({
      title: "Task Deleted",
      description: "Task has been successfully deleted.",
      variant: "destructive",
    })
  }

  const handleTaskMove = (taskId: string, newAssigneeOrDate: string, newDate?: string, newTime?: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          if (newDate) {
            // Grid view: moving to new assignee and date
            return { ...task, assignee: newAssigneeOrDate, date: newDate }
          } else if (newTime) {
            // Day view: moving to new time
            return { ...task, date: newAssigneeOrDate, startTime: newTime }
          } else {
            // Month view: moving to new date only
            return { ...task, date: newAssigneeOrDate }
          }
        }
        return task
      }),
    )

    toast({
      title: "Task Moved",
      description: "Task has been successfully moved.",
    })
  }

  const handleTeamMemberReorder = (fromIndex: number, toIndex: number) => {
    // This will now handle both group reordering and instance reordering
    // The scheduler grid will manage the complex logic internally

    toast({
      title: "Resource Reordered",
      description: "Resource has been moved to new position.",
    })
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
