"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, FileSpreadsheet, Calendar, Users, BookOpen, BarChart3 } from "lucide-react"

interface Employee {
  id: string
  idEmp: string
  name: string
}

interface Course {
  id: string
  title: string
}

export default function AdminExportPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingScores, setExportingScores] = useState(false)
  const [exportingReports, setExportingReports] = useState(false)
  const [exportingEmployees, setExportingEmployees] = useState(false)
  const [exportingCourses, setExportingCourses] = useState(false)

  // Filters for scores export
  const [scoresEmployee, setScoresEmployee] = useState<string>("all")
  const [scoresCourse, setScoresCourse] = useState<string>("all")
  const [scoresFormat, setScoresFormat] = useState<string>("detailed")

  // Filters for reports export
  const [reportsRange, setReportsRange] = useState<string>("all")

  useEffect(() => {
    fetchEmployees()
    fetchCourses()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const exportScores = async () => {
    setExportingScores(true)
    try {
      const params = new URLSearchParams()
      if (scoresEmployee !== "all") params.append("employeeId", scoresEmployee)
      if (scoresCourse !== "all") params.append("courseId", scoresCourse)
      params.append("format", scoresFormat)

      const response = await fetch(`/api/scores/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `คะแนนการเรียน_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting scores:", error)
      alert("เกิดข้อผิดพลาดในการ export ข้อมูล")
    } finally {
      setExportingScores(false)
    }
  }

  const exportReports = async () => {
    setExportingReports(true)
    try {
      const params = new URLSearchParams()
      if (reportsRange !== "all") params.append("range", reportsRange)

      const response = await fetch(`/api/reports/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const rangeText = {
          "all": "ทั้งหมด",
          "7d": "7วัน",
          "30d": "30วัน", 
          "90d": "3เดือน",
          "1y": "1ปี"
        }[reportsRange] || "ทั้งหมด"
        a.download = `รายงานสถิติการเรียน_${rangeText}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting reports:", error)
      alert("เกิดข้อผิดพลาดในการ export ข้อมูล")
    } finally {
      setExportingReports(false)
    }
  }

  const exportEmployees = async () => {
    setExportingEmployees(true)
    try {
      // Simple CSV export for employees
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        
        const headers = ["รหัสพนักงาน", "ชื่อ-นามสกุล", "แผนก", "ฝ่าย", "บริษัท", "วันที่สร้าง"]
        const rows = data.map((emp: any) => [
          emp.idEmp,
          emp.name,
          emp.section,
          emp.department,
          emp.company,
          new Date(emp.createdAt).toLocaleDateString("th-TH")
        ])
        
        const csvContent = [headers, ...rows]
          .map(row => row.map((field: any) => `"${field}"`).join(","))
          .join("\n")
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `รายชื่อพนักงาน_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting employees:", error)
      alert("เกิดข้อผิดพลาดในการ export ข้อมูล")
    } finally {
      setExportingEmployees(false)
    }
  }

  const exportCourses = async () => {
    setExportingCourses(true)
    try {
      // Simple CSV export for courses
      const response = await fetch("/api/courses")
      if (response.ok) {
        const data = await response.json()
        
        const headers = ["ชื่อหลักสูตร", "รายละเอียด", "ประเภทเนื้อหา", "สถานะ", "วันที่สร้าง"]
        const rows = data.map((course: any) => [
          course.title,
          course.description || "-",
          course.contentType === "video" ? "วิดีโอ" : "PowerPoint",
          course.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน",
          new Date(course.createdAt).toLocaleDateString("th-TH")
        ])
        
        const csvContent = [headers, ...rows]
          .map(row => row.map((field: any) => `"${field}"`).join(","))
          .join("\n")
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `รายการหลักสูตร_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting courses:", error)
      alert("เกิดข้อผิดพลาดในการ export ข้อมูล")
    } finally {
      setExportingCourses(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Export ข้อมูล</h1>
          <p className="text-muted-foreground">ดาวน์โหลดข้อมูลในรูปแบบ Excel และ CSV</p>
        </div>
        <Link href="/">
          <Button variant="outline">กลับหน้าแรก</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Export คะแนนการเรียน</span>
            </CardTitle>
            <CardDescription>
              ดาวน์โหลดข้อมูลคะแนนในรูปแบบ Excel พร้อมสถิติและสรุปผล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">พนักงาน</label>
              <Select value={scoresEmployee} onValueChange={setScoresEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">พนักงานทั้งหมด</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.idEmp} - {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">หลักสูตร</label>
              <Select value={scoresCourse} onValueChange={setScoresCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหลักสูตร" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">หลักสูตรทั้งหมด</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">รูปแบบ</label>
              <Select value={scoresFormat} onValueChange={setScoresFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรูปแบบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">รายละเอียดครบถ้วน (หลายแผ่น)</SelectItem>
                  <SelectItem value="summary">สรุปเท่านั้น (แผ่นเดียว)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={exportScores} 
              disabled={exportingScores} 
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingScores ? "กำลัง Export..." : "Export คะแนน (Excel)"}
            </Button>

            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-1">รายละเอียดครบถ้วน</Badge>
              รวม: รายละเอียดคะแนน, สรุปตามพนักงาน, สรุปตามหลักสูตร, สรุปตามฝ่าย
            </div>
          </CardContent>
        </Card>

        {/* Reports Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Export รายงานสถิติ</span>
            </CardTitle>
            <CardDescription>
              ดาวน์โหลดรายงานสถิติและการวิเคราะห์ข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>ช่วงเวลา</span>
              </label>
              <Select value={reportsRange} onValueChange={setReportsRange}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="7d">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="30d">30 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="90d">3 เดือนที่ผ่านมา</SelectItem>
                  <SelectItem value="1y">1 ปีที่ผ่านมา</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={exportReports} 
              disabled={exportingReports} 
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingReports ? "กำลัง Export..." : "Export รายงาน (Excel)"}
            </Button>

            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-1">ข้อมูลในรายงาน</Badge>
              สถิติรวม, สถิติตามฝ่าย, ประสิทธิภาพหลักสูตร, ผู้เรียนดีเด่น, ต้องปรับปรุง
            </div>
          </CardContent>
        </Card>

        {/* Basic Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Export ข้อมูลพื้นฐาน</span>
            </CardTitle>
            <CardDescription>
              ดาวน์โหลดข้อมูลพนักงานและหลักสูตรในรูปแบบ CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={exportEmployees} 
              disabled={exportingEmployees} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingEmployees ? "กำลัง Export..." : "Export รายชื่อพนักงาน (CSV)"}
            </Button>

            <Button 
              onClick={exportCourses} 
              disabled={exportingCourses} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingCourses ? "กำลัง Export..." : "Export รายการหลักสูตร (CSV)"}
            </Button>

            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-1">รูปแบบ CSV</Badge>
              เหมาะสำหรับการนำเข้าข้อมูลในโปรแกรมอื่น
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Export ด่วน</span>
            </CardTitle>
            <CardDescription>
              ดาวน์โหลดข้อมูลที่ใช้บ่อยในรูปแบบมาตรฐาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => {
                setScoresEmployee("all")
                setScoresCourse("all") 
                setScoresFormat("detailed")
                exportScores()
              }} 
              disabled={exportingScores} 
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingScores ? "กำลัง Export..." : "คะแนนทั้งหมด (รายละเอียด)"}
            </Button>

            <Button 
              onClick={() => {
                setReportsRange("30d")
                exportReports()
              }} 
              disabled={exportingReports} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingReports ? "กำลัง Export..." : "รายงาน 30 วันล่าสุด"}
            </Button>

            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-1">การตั้งค่าอัตโนมัติ</Badge>
              ใช้การตั้งค่าที่เหมาะสมสำหรับการรายงานทั่วไป
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>คำแนะนำการใช้งาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">รูปแบบไฟล์</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Excel (.xlsx):</strong> สำหรับข้อมูลที่ซับซ้อนและการวิเคราะห์</li>
                <li><strong>CSV:</strong> สำหรับข้อมูลพื้นฐานและการนำเข้าในโปรแกรมอื่น</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">ข้อมูลในไฟล์</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>ข้อมูลทั้งหมดเป็น encoding UTF-8 รองรับภาษาไทย</li>
                <li>ไม่รวมข้อมูลที่ถูกลบแล้ว (soft delete)</li>
                <li>มีการจัดรูปแบบและสรุปผลในไฟล์ Excel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}