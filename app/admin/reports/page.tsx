"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, BookOpen, Trophy, Download, Calendar, Building } from "lucide-react"

interface ReportData {
  totalEmployees: number
  totalCourses: number
  totalCompletions: number
  averageScore: number
  completionByDepartment: Array<{
    department: string
    completed: number
    total: number
    percentage: number
  }>
  scoresByCourse: Array<{
    courseTitle: string
    averagePreTest: number
    averagePostTest: number
    completions: number
  }>
  completionTrend: Array<{
    month: string
    completions: number
  }>
  topPerformers: Array<{
    employeeName: string
    employeeId: string
    department: string
    averageScore: number
    completedCourses: number
  }>
}

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a']

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<string>("all")

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange !== "all") {
        params.append("range", dateRange)
      }
      
      const response = await fetch(`/api/reports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !reportData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">รายงานและสถิติ</h1>
          <p className="text-muted-foreground">สรุปผลการเรียนและประสิทธิภาพของระบบ</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/">
            <Button variant="outline">กลับหน้าแรก</Button>
          </Link>
          <Button onClick={() => window.location.href = '/api/reports/export'}>
            <Download className="mr-2 h-4 w-4" />
            Export รายงาน
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>ช่วงเวลา</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงานทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">คน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หลักสูตรทั้งหมด</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalCourses}</div>
            <p className="text-xs text-muted-foreground">หลักสูตร</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเรียนจบ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">ครั้ง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนนเฉลี่ย</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData.averageScore}%</div>
            <p className="text-xs text-muted-foreground">คะแนนรวม</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Completion by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>การเรียนจบตามฝ่าย</span>
            </CardTitle>
            <CardDescription>อัตราการเรียนจบของแต่ละฝ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.completionByDepartment.map((dept, index) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{dept.department}</span>
                    <span className="text-sm text-muted-foreground">
                      {dept.completed}/{dept.total} ({dept.percentage}%)
                    </span>
                  </div>
                  <Progress value={dept.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>การกระจายตามฝ่าย</CardTitle>
            <CardDescription>สัดส่วนพนักงานแต่ละฝ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.completionByDepartment}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ department, percentage }) => `${department} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {reportData.completionByDepartment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scores by Course */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>คะแนนตามหลักสูตร</CardTitle>
          <CardDescription>เปรียบเทียบคะแนน Pre-test และ Post-test</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.scoresByCourse}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="courseTitle" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averagePreTest" fill="#ef4444" name="Pre-test" />
              <Bar dataKey="averagePostTest" fill="#16a34a" name="Post-test" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>ผู้เรียนดีเด่น</CardTitle>
          <CardDescription>พนักงานที่มีผลการเรียนดีที่สุด</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.topPerformers.map((performer, index) => (
              <div key={performer.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{performer.employeeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {performer.employeeId} • {performer.department}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{performer.averageScore}%</div>
                  <div className="text-sm text-muted-foreground">
                    {performer.completedCourses} หลักสูตร
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}