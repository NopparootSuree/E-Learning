"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings,
  Download,
  HelpCircle,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  const isAdmin = session?.user?.role === "admin"

  const navItems = [
    { href: "/", label: "หน้าแรก", icon: GraduationCap },
    { href: "/courses", label: "หลักสูตร", icon: BookOpen },
    { href: "/scores", label: "คะแนน", icon: BarChart3 },
  ]

  const adminItems = [
    { href: "/employees", label: "จัดการพนักงาน", icon: Users },
    { href: "/admin/tests", label: "จัดการแบบทดสอบ", icon: HelpCircle },
    { href: "/admin/questions", label: "จัดการคำถาม", icon: Settings },
    { href: "/admin/reports", label: "รายงานสถิติ", icon: BarChart3 },
    { href: "/admin/export", label: "Export ข้อมูล", icon: Download },
  ]

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-primary">E-Learning</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) && item.href !== "/" ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          {/* User Info & Admin Section */}
          <div className="hidden lg:flex items-center space-x-1">
            {session && (
              <>
                <div className="flex items-center space-x-2 mr-4">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{session.user?.name}</span>
                  {isAdmin && <Badge variant="outline">Admin</Badge>}
                </div>
                
                {isAdmin && (
                  <>
                    {adminItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive(item.href) ? "default" : "ghost"}
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="hidden xl:inline">{item.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">ออกจากระบบ</span>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white py-4">
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground px-3 py-1">
                เมนูหลัก
              </div>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive(item.href) && item.href !== "/" ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {session && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{session.user?.name}</span>
                      {isAdmin && <Badge variant="outline">Admin</Badge>}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <>
                      <div className="font-medium text-sm text-muted-foreground px-3 py-1 mt-2">
                        เมนูจัดการ
                      </div>
                      {adminItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant={isActive(item.href) ? "default" : "ghost"}
                            className="w-full justify-start"
                          >
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    ออกจากระบบ
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}