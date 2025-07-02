"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BarChart3, Users, HelpCircle, Settings, Download, GraduationCap, Clock, TrendingUp, UserCheck } from "lucide-react"

export default function Home() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const userMenus = [
    {
      title: "หลักสูตรเรียน",
      description: "เข้าเรียนหลักสูตรต่างๆ และทำแบบทดสอบ",
      href: "/courses",
      icon: BookOpen,
      color: "bg-blue-500",
      variant: "default" as const
    },
    {
      title: "คะแนนของฉัน", 
      description: "ติดตามผลคะแนนการเรียนและความก้าวหน้า",
      href: "/scores",
      icon: BarChart3,
      color: "bg-green-500",
      variant: "outline" as const
    }
  ]

  const adminMenus = [
    {
      title: "จัดการพนักงาน",
      description: "เพิ่ม แก้ไข ลบข้อมูลพนักงาน",
      href: "/employees", 
      icon: Users,
      color: "bg-purple-500"
    },
    {
      title: "จัดการการลงทะเบียน",
      description: "กำหนดสิทธิ์การเข้าถึงหลักสูตรสำหรับพนักงาน",
      href: "/admin/enrollments",
      icon: UserCheck,
      color: "bg-blue-500"
    },
    {
      title: "จัดการแบบทดสอบ",
      description: "สร้างและจัดการแบบทดสอบก่อน-หลังเรียน",
      href: "/admin/tests",
      icon: HelpCircle, 
      color: "bg-orange-500"
    },
    {
      title: "จัดการคำถาม",
      description: "สร้างและจัดการคำถามแบบปรนัยและอัตนัย",
      href: "/admin/questions",
      icon: Settings,
      color: "bg-indigo-500"
    },
    {
      title: "รายงานและสถิติ", 
      description: "ดูรายงานผลการเรียนและวิเคราะห์ข้อมูล",
      href: "/admin/reports",
      icon: TrendingUp,
      color: "bg-pink-500"
    },
    {
      title: "Export ข้อมูล",
      description: "ส่งออกข้อมูลเป็น Excel และ CSV",
      href: "/admin/export", 
      icon: Download,
      color: "bg-teal-500"
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-red-900 mb-2">ระบบ E-Learning</h1>
        <p className="text-muted-foreground text-lg">ระบบการเรียนรู้ออนไลน์ภายในองค์กร</p>
        {session && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              ยินดีต้อนรับ <span className="font-medium text-red-700">{session.user?.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* User Menus */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-red-600" />
          เมนูหลัก
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userMenus.map((menu) => (
            <Card key={menu.href} className="hover:shadow-lg transition-all hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${menu.color} rounded-lg flex items-center justify-center`}>
                    <menu.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-red-900">{menu.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm">{menu.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={menu.href}>
                  <Button variant={menu.variant} className="w-full">
                    เข้าใช้งาน
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin Menus */}
      {isAdmin && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-red-600" />
            เมนูจัดการ (Admin)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenus.map((menu) => (
              <Card key={menu.href} className="hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${menu.color} rounded-lg flex items-center justify-center`}>
                      <menu.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-red-900">{menu.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">{menu.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={menu.href}>
                    <Button variant="outline" className="w-full">
                      เข้าใช้งาน
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}