"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarDays, Users, BookOpen, Plus, Search, Trash2, Edit, UserCheck } from "lucide-react"

interface Employee {
  id: string
  idEmp: string
  name: string
  section: string
  department: string
}

interface Group {
  id: string
  title: string
  description?: string
  order: number
  isActive: boolean
  courses: Course[]
}

interface Course {
  id: string
  title: string
  description?: string
  isActive: boolean
  groupId?: string
  group?: {
    id: string
    title: string
  }
}

interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  expiresAt?: string
  completedAt?: string
  employee: {
    id: string
    idEmp: string
    name: string
    section: string
    department: string
  }
  course: {
    id: string
    title: string
    description?: string
    isActive: boolean
    group?: {
      title: string
    }
  }
}

export default function EnrollmentsPage() {
  const { data: session } = useSession()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Dialog states
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState("")
  const [selectionMode, setSelectionMode] = useState<"groups" | "courses">("groups")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load enrollments, employees, groups, and courses in parallel
      const [enrollmentsRes, employeesRes, groupsRes, coursesRes] = await Promise.all([
        fetch("/api/courses/enrollments"),
        fetch("/api/employees"),
        fetch("/api/groups"),
        fetch("/api/courses")
      ])

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData)
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json()
        // Handle both old format (array) and new format (with data property)
        const employees = Array.isArray(employeesData) ? employeesData : (employeesData.data || [])
        setEmployees(employees)
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups(groupsData.filter((group: Group) => group.isActive))
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        // Handle both old format (array) and new format (with data property)
        const courses = Array.isArray(coursesData) ? coursesData : (coursesData.data || [])
        setCourses(courses.filter((course: Course) => course.isActive))
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (selectedEmployees.length === 0 || (selectedCourses.length === 0 && selectedGroups.length === 0)) {
      setMessage({ type: "error", text: "กรุณาเลือกพนักงานและหลักสูตรหรือกลุ่มหลักสูตร" })
      return
    }

    // รวบรวม courseIds จากทั้งการเลือกแยกและจากกลุ่ม
    let allCourseIds = [...selectedCourses]
    
    // เพิ่มหลักสูตรจากกลุ่มที่เลือก
    selectedGroups.forEach(groupId => {
      const group = groups.find(g => g.id === groupId)
      if (group && group.courses) {
        const groupCourseIds = group.courses.map(course => course.id)
        allCourseIds = [...allCourseIds, ...groupCourseIds]
      }
    })

    // ลบ courseIds ที่ซ้ำ
    allCourseIds = Array.from(new Set(allCourseIds))

    if (allCourseIds.length === 0) {
      setMessage({ type: "error", text: "ไม่พบหลักสูตรที่จะลงทะเบียน" })
      return
    }

    try {
      const response = await fetch("/api/courses/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          courseIds: allCourseIds,
          expiresAt: expiresAt || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setShowEnrollDialog(false)
        setSelectedEmployees([])
        setSelectedGroups([])
        setSelectedCourses([])
        setExpiresAt("")
        loadData()
      } else {
        setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" })
      }
    } catch (error) {
      console.error("Error enrolling:", error)
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการลงทะเบียน" })
    }
  }

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะยกเลิกการลงทะเบียนนี้?")) {
      return
    }

    try {
      const response = await fetch(`/api/courses/enrollments/${enrollmentId}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        loadData()
      } else {
        setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" })
      }
    } catch (error) {
      console.error("Error deleting enrollment:", error)
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการยกเลิกการลงทะเบียน" })
    }
  }

  const handleUpdateStatus = async (enrollmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/courses/enrollments/${enrollmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        loadData()
      } else {
        setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการอัพเดทสถานะ" })
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      enrollment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.employee.idEmp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || enrollment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary", 
      completed: "default"
    } as const

    const labels = {
      active: "กำลังเรียน",
      inactive: "ไม่ใช้งาน",
      completed: "เรียนจบ"
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">กำลังโหลด...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">จัดการการลงทะเบียนเรียน</h1>
          <p className="text-gray-600 mt-2">กำหนดสิทธิ์การเข้าถึงหลักสูตรสำหรับพนักงาน</p>
        </div>
        
        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มการลงทะเบียน
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>เพิ่มการลงทะเบียนเรียน</DialogTitle>
              <DialogDescription>
                เลือกพนักงานและหลักสูตรที่ต้องการให้เข้าถึงได้
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* เลือกพนักงาน */}
              <div>
                <Label className="text-base font-semibold mb-3 block">เลือกพนักงาน</Label>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmployees([...selectedEmployees, employee.id])
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {employee.name} ({employee.idEmp}) - {employee.department}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  เลือกแล้ว: {selectedEmployees.length} คน
                </p>
              </div>

              {/* เลือกหลักสูตร */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">เลือกหลักสูตร</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={selectionMode === "groups" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectionMode("groups")}
                    >
                      ตามกลุ่ม
                    </Button>
                    <Button
                      type="button"
                      variant={selectionMode === "courses" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectionMode("courses")}
                    >
                      เลือกแยก
                    </Button>
                  </div>
                </div>

                {selectionMode === "groups" ? (
                  // เลือกตามกลุ่มหลักสูตร
                  <div>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGroups([...selectedGroups, group.id])
                              } else {
                                setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{group.title}</div>
                            <div className="text-xs text-gray-500">
                              {group.courses?.length || 0} หลักสูตร
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      เลือกแล้ว: {selectedGroups.length} กลุ่ม
                    </p>
                  </div>
                ) : (
                  // เลือกหลักสูตรแยก
                  <div>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={selectedCourses.includes(course.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCourses([...selectedCourses, course.id])
                              } else {
                                setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`course-${course.id}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {course.title}
                            {course.group && (
                              <span className="text-gray-500 ml-1">({course.group.title})</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      เลือกแล้ว: {selectedCourses.length} หลักสูตร
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* วันหมดอายุ (ไม่บังคับ) */}
            <div>
              <Label htmlFor="expiresAt">วันหมดอายุ (ไม่บังคับ)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEnrollDialog(false)
                setSelectedEmployees([])
                setSelectedGroups([])
                setSelectedCourses([])
                setExpiresAt("")
              }}>
                ยกเลิก
              </Button>
              <Button onClick={handleEnroll} className="bg-red-600 hover:bg-red-700">
                ลงทะเบียน
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Messages */}
      {message && (
        <Alert className={message.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาพนักงาน หรือหลักสูตร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="กรองสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">กำลังเรียน</SelectItem>
                <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                <SelectItem value="completed">เรียนจบ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            รายการลงทะเบียนเรียน ({filteredEnrollments.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>หลักสูตร</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ลงทะเบียน</TableHead>
                  <TableHead>วันหมดอายุ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลการลงทะเบียน
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{enrollment.employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {enrollment.employee.idEmp} • {enrollment.employee.department}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{enrollment.course.title}</div>
                          {enrollment.course.group && (
                            <div className="text-sm text-gray-500">
                              {enrollment.course.group.title}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(enrollment.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(enrollment.enrolledAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {enrollment.expiresAt 
                          ? new Date(enrollment.expiresAt).toLocaleDateString('th-TH')
                          : "ไม่กำหนด"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={enrollment.status}
                            onValueChange={(value) => handleUpdateStatus(enrollment.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">กำลังเรียน</SelectItem>
                              <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                              <SelectItem value="completed">เรียนจบ</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEnrollment(enrollment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}