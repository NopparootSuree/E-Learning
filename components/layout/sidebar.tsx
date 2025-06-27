"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Home,
  BookOpen, 
  BarChart3, 
  Users, 
  HelpCircle, 
  Settings,
  Download,
  TrendingUp,
  X,
  FolderOpen
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  const userMenus = [
    { href: "/", label: "หน้าแรก", icon: Home },
    { href: "/courses", label: "หลักสูตรเรียน", icon: BookOpen },
    { href: "/scores", label: "คะแนนของฉัน", icon: BarChart3 },
  ]

  const adminMenus = [
    { href: "/", label: "หน้าแรก", icon: Home },
    { href: "/admin/groups", label: "จัดการกลุ่มหลักสูตร", icon: FolderOpen },
    { href: "/courses", label: "จัดการหลักสูตร", icon: BookOpen },
    { href: "/employees", label: "จัดการพนักงาน", icon: Users },
    { href: "/admin/tests", label: "จัดการแบบทดสอบ", icon: HelpCircle },
    { href: "/admin/questions", label: "จัดการคำถาม", icon: Settings },
    { href: "/admin/reports", label: "รายงานและสถิติ", icon: TrendingUp },
    { href: "/admin/export", label: "Export ข้อมูล", icon: Download },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex justify-end p-4 lg:hidden">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {isAdmin ? (
              /* Admin Menus */
              <div className="space-y-1">
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  เมนูจัดการ
                </h3>
                {adminMenus.map((item) => (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            ) : (
              /* User Menus */
              <div className="space-y-1">
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  เมนูหลัก
                </h3>
                {userMenus.map((item) => (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  )
}