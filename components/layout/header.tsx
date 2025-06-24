"use client"

import type React from "react"

import { Calendar, Settings, Users, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  onAddTask?: () => void
  viewControls?: React.ReactNode
}

export function Header({ onAddTask, viewControls }: HeaderProps) {
  return (
    <header className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8" />
              <h1 className="text-2xl font-bold">MERN Scheduler</h1>
            </div>
          </div>

          {/* Center - View Controls */}
          <div className="flex-1 flex justify-center">{viewControls && <div className="mx-4">{viewControls}</div>}</div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-red-700">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="ghost" className="text-white hover:bg-red-700">
              <Users className="h-4 w-4 mr-2" />
              Team
            </Button>
            <Button variant="ghost" className="text-white hover:bg-red-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {onAddTask && (
              <Button onClick={onAddTask} variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                Add Task
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">john@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
