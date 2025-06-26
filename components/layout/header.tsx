"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, User, LogOut, Menu } from "lucide-react"

interface HeaderProps {
  toggleSidebar: () => void
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo + Sidebar Toggle */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-red-900 hidden sm:block">E-Learning</span>
          </div>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center space-x-4">
          {session && (
            <>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium hidden sm:block">{session.user?.name}</span>
                {session.user?.role === "admin" && (
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">ออกจากระบบ</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}