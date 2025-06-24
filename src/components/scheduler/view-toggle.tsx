"use client"

import { Calendar, Grid3X3, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ViewType = "grid" | "month" | "day"

interface ViewToggleProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views = [
    {
      type: "grid" as ViewType,
      icon: Grid3X3,
      label: "Grid",
      fullLabel: "Grid View",
      description: "Timeline view with team members",
    },
    {
      type: "month" as ViewType,
      icon: Calendar,
      label: "Month",
      fullLabel: "Month View",
      description: "Monthly calendar overview",
    },
    {
      type: "day" as ViewType,
      icon: Clock,
      label: "Day",
      fullLabel: "Day View",
      description: "Detailed daily schedule",
    },
  ]

  return (
    <div className="p-1 flex bg-white/10 border-white/20 backdrop-blur-sm">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = currentView === view.type

        return (
          <Button
            key={view.type}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange(view.type)}
            className={cn(
              "flex items-center space-x-2 transition-all min-w-[80px] justify-center",
              isActive
                ? "bg-white text-red-600 hover:bg-white/90 shadow-sm font-medium"
                : "text-white hover:bg-white/10 hover:text-white",
            )}
            title={view.description}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{view.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
