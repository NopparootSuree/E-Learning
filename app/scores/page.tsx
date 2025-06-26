"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Trophy, BookOpen, CheckCircle, XCircle, Clock, Download, GraduationCap, Search, Filter } from "lucide-react"

interface Employee {
  id: string
  idEmp: string
  name: string
  section: string
  department: string
  company: string
}

interface Course {
  id: string
  title: string
}

interface Score {
  id: string
  employeeId: string
  courseId: string
  preTestScore: number | null
  postTestScore: number | null
  finalScore: number | null
  completedAt: string | null
  createdAt: string
  employee: Employee
  course: Course
}

export default function ScoresPage() {
  const { data: session } = useSession()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEmployee, setFilterEmployee] = useState<string>("all")
  const [filterCourse, setFilterCourse] = useState<string>("all")
  const [filterSearch, setFilterSearch] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  
  const isAdmin = session?.user?.role === "admin"

  useEffect(() => {
    if (session) {
      fetchScores()
      if (isAdmin) {
        fetchEmployees()
      }
      fetchCourses()
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchScores()
    }
  }, [filterEmployee, filterCourse, filterSearch, filterStatus, session])

  const fetchScores = async () => {
    try {
      setLoading(true)
      let url = "/api/scores"
      const params = new URLSearchParams()
      
      // For regular users, add userView=true to get only their scores
      if (!isAdmin) {
        params.append("userView", "true")
      } else {
        // For admin, allow filtering
        if (filterEmployee !== "all") {
          params.append("employeeId", filterEmployee)
        }
      }
      
      if (filterCourse !== "all") {
        params.append("courseId", filterCourse)
      }
      
      if (filterSearch) {
        params.append("search", filterSearch)
      }
      
      if (filterStatus !== "all") {
        params.append("status", filterStatus)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setScores(data)
      }
    } catch (error) {
      console.error("Error fetching scores:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return { variant: "secondary" as const, text: "ไม่ได้ทำ" }
    if (score >= 80) return { variant: "default" as const, text: "ผ่าน" }
    if (score >= 60) return { variant: "secondary" as const, text: "พอใช้" }
    return { variant: "destructive" as const, text: "ต้องปรับปรุง" }
  }

  const getCompletionStats = () => {
    const completed = scores.filter(s => s.completedAt).length
    const total = scores.length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getAverageScores = () => {
    const validPreScores = scores.filter(s => s.preTestScore !== null).map(s => s.preTestScore!)
    const validPostScores = scores.filter(s => s.postTestScore !== null).map(s => s.postTestScore!)
    const validFinalScores = scores.filter(s => s.finalScore !== null).map(s => s.finalScore!)

    return {
      preTest: validPreScores.length > 0 ? Math.round(validPreScores.reduce((a, b) => a + b, 0) / validPreScores.length) : 0,
      postTest: validPostScores.length > 0 ? Math.round(validPostScores.reduce((a, b) => a + b, 0) / validPostScores.length) : 0,
      final: validFinalScores.length > 0 ? Math.round(validFinalScores.reduce((a, b) => a + b, 0) / validFinalScores.length) : 0
    }
  }

  const stats = getCompletionStats()
  const averages = getAverageScores()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {isAdmin ? "คะแนนและผลการเรียน" : "คะแนนของฉัน"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "ติดตามผลคะแนนและความก้าวหน้าการเรียนของทุกคน" 
              : "ติดตามผลคะแนนและความก้าวหน้าการเรียนของคุณ"
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/">
            <Button variant="outline">กลับหน้าแรก</Button>
          </Link>
          {isAdmin && (
            <Button onClick={() => window.location.href = '/api/scores/export'}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเรียนจบ</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}/{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.percentage}% เสร็จสมบูรณ์
            </p>
            <Progress value={stats.percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนนเฉลี่ย Pre-test</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averages.preTest)}`}>
              {averages.preTest}%
            </div>
            <p className="text-xs text-muted-foreground">
              แบบทดสอบก่อนเรียน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนนเฉลี่ย Post-test</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averages.postTest)}`}>
              {averages.postTest}%
            </div>
            <p className="text-xs text-muted-foreground">
              แบบทดสอบหลังเรียน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนนเฉลี่ยรวม</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averages.final)}`}>
              {averages.final}%
            </div>
            <p className="text-xs text-muted-foreground">
              คะแนนสุดท้าย
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>กรองข้อมูล</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาชื่อพนักงาน..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filter พนักงาน - แสดงเฉพาะ Admin */}
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">พนักงาน</label>
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
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
            )}
            
            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">หลักสูตร</label>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
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
            
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="completed">เรียนจบแล้ว</SelectItem>
                  <SelectItem value="in_progress">กำลังเรียน</SelectItem>
                  <SelectItem value="passed">ผ่าน (≥80%)</SelectItem>
                  <SelectItem value="failed">ไม่ผ่าน ({`<60%`})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดคะแนน</CardTitle>
          <CardDescription>
            คะแนนรายละเอียดของพนักงานแต่ละคน ({scores.length} รายการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {/* Loading Statistics Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="w-32 h-4 bg-gray-300 rounded"></div>
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="w-16 h-8 bg-gray-300 rounded mb-1"></div>
                      <div className="w-24 h-3 bg-gray-300 rounded mb-2"></div>
                      <div className="w-full h-2 bg-gray-300 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Loading Filters Card Skeleton */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="w-24 h-6 bg-gray-300 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Loading Table Skeleton */}
              <Card>
                <CardHeader>
                  <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-300 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-7 gap-4 p-4 border-b">
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    {/* Table Rows */}
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="grid grid-cols-7 gap-4 p-4 animate-pulse">
                        <div className="space-y-1">
                          <div className="w-24 h-4 bg-gray-300 rounded"></div>
                          <div className="w-32 h-3 bg-gray-300 rounded"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-300 rounded"></div>
                          <div className="w-20 h-4 bg-gray-300 rounded"></div>
                        </div>
                        <div className="w-8 h-4 bg-gray-300 rounded"></div>
                        <div className="w-8 h-4 bg-gray-300 rounded"></div>
                        <div className="w-8 h-4 bg-gray-300 rounded"></div>
                        <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                        <div className="w-20 h-4 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Loading Spinner */}
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-6 w-6 text-primary animate-bounce" />
                  </div>
                  <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-500">กำลังโหลดข้อมูลคะแนน...</p>
              </div>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ไม่มีข้อมูลคะแนน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>หลักสูตร</TableHead>
                  <TableHead className="text-center">Pre-test</TableHead>
                  <TableHead className="text-center">Post-test</TableHead>
                  <TableHead className="text-center">คะแนนรวม</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-center">วันที่เสร็จ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{score.employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {score.employee.idEmp} • {score.employee.department}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{score.course.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <span className={`font-medium ${getScoreColor(score.preTestScore)}`}>
                          {score.preTestScore !== null ? `${score.preTestScore}` : "-"}
                        </span>
                        {score.preTestScore !== null && (
                          <div className="text-xs text-muted-foreground">
                            ({score.preTestScore}%)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <span className={`font-medium ${getScoreColor(score.postTestScore)}`}>
                          {score.postTestScore !== null ? `${score.postTestScore}` : "-"}
                        </span>
                        {score.postTestScore !== null && (
                          <div className="text-xs text-muted-foreground">
                            ({score.postTestScore}%)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <span className={`font-bold ${getScoreColor(score.finalScore)}`}>
                          {score.finalScore !== null ? `${score.finalScore}` : "-"}
                        </span>
                        {score.finalScore !== null && (
                          <div className="text-xs text-muted-foreground">
                            ({score.finalScore}%)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {score.completedAt ? (
                        <Badge {...getScoreBadge(score.finalScore)}>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {getScoreBadge(score.finalScore).text}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          กำลังเรียน
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {score.completedAt ? (
                        new Date(score.completedAt).toLocaleDateString("th-TH")
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}