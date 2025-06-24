"use client"

import type { ReactNode } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: ReactNode
  teamMembers?: Array<{ id: string; name: string }>
  selectedMember?: string
  onMemberSelect?: (memberId: string) => void
  onAddMember?: () => void
  onAddTask?: () => void
  showSidebar?: boolean
  viewControls?: ReactNode
}

export function MainLayout({
  children,
  teamMembers = [],
  selectedMember,
  onMemberSelect,
  onAddMember,
  onAddTask,
  showSidebar = true,
  viewControls,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAddTask={onAddTask} viewControls={viewControls} />
      <div className="flex">
        {showSidebar && (
          <Sidebar
            teamMembers={teamMembers}
            selectedMember={selectedMember}
            onMemberSelect={onMemberSelect}
            onAddMember={onAddMember}
          />
        )}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
