"use client"

import { useState } from "react"
import { Calendar, Users, BarChart3, Settings, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SidebarProps {
  teamMembers: Array<{ id: string; name: string }>
  selectedMember?: string
  onMemberSelect?: (memberId: string) => void
  onAddMember?: () => void
  className?: string
}

export function Sidebar({ teamMembers, selectedMember, onMemberSelect, onAddMember, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { icon: Calendar, label: "Schedule", active: true },
    { icon: Users, label: "Team", active: false },
    { icon: BarChart3, label: "Reports", active: false },
    { icon: Settings, label: "Settings", active: false },
  ]

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Toggle */}
        <div className="flex justify-end p-2 border-b">
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              className={cn("w-full justify-start", isCollapsed && "px-2")}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Team Members Section */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Team Members</h3>
              {onAddMember && (
                <Button variant="ghost" size="sm" onClick={onAddMember}>
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {teamMembers.map((member) => (
                <Button
                  key={member.id}
                  variant={selectedMember === member.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm"
                  onClick={() => onMemberSelect?.(member.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <span className="truncate">{member.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!isCollapsed && (
          <Card className="m-4 p-3">
            <div className="text-xs text-gray-600 mb-2">Quick Stats</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Active Tasks</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>This Week</span>
                <Badge variant="outline">8</Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
