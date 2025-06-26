"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, BookOpen, GraduationCap } from "lucide-react"

interface Course {
  id: string
  title: string
}

interface Test {
  id: string
  courseId: string
  type: string
  title: string
  description: string | null
  isActive: boolean
  createdAt: string
  course: Course
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [formData, setFormData] = useState({
    courseId: "",
    type: "pretest",
    title: "",
    description: "",
    isActive: true
  })

  useEffect(() => {
    fetchTests()
    fetchCourses()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tests")
      if (response.ok) {
        const data = await response.json()
        setTests(data)
      }
    } catch (error) {
      console.error("Error fetching tests:", error)
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTest ? `/api/tests/${editingTest.id}` : "/api/tests"
      const method = editingTest ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchTests()
        setDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error saving test:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleEdit = (test: Test) => {
    setEditingTest(test)
    setFormData({
      courseId: test.courseId,
      type: test.type,
      title: test.title,
      description: test.description || "",
      isActive: test.isActive
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("คุณต้องการลบแบบทดสอบนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/tests/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchTests()
        }
      } catch (error) {
        console.error("Error deleting test:", error)
      }
    }
  }

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/tests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (response.ok) {
        fetchTests()
      }
    } catch (error) {
      console.error("Error toggling test status:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      courseId: "",
      type: "pretest",
      title: "",
      description: "",
      isActive: true
    })
    setEditingTest(null)
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">จัดการแบบทดสอบ</h1>
          <p className="text-muted-foreground">จัดการแบบทดสอบก่อนเรียนและหลังเรียน</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/">
            <Button variant="outline">กลับหน้าแรก</Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มแบบทดสอบ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTest ? "แก้ไขแบบทดสอบ" : "เพิ่มแบบทดสอบใหม่"}
                </DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลแบบทดสอบให้ครบถ้วน
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseId">หลักสูตร</Label>
                  <Select 
                    value={formData.courseId} 
                    onValueChange={(value) => setFormData({...formData, courseId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหลักสูตร" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">ประเภทแบบทดสอบ</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pretest">แบบทดสอบก่อนเรียน</SelectItem>
                      <SelectItem value="posttest">แบบทดสอบหลังเรียน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">ชื่อแบบทดสอบ</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">คำอธิบาย</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">เปิดใช้งาน</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">
                    {editingTest ? "บันทึกการแก้ไข" : "เพิ่มแบบทดสอบ"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการแบบทดสอบ</CardTitle>
          <CardDescription>
            แบบทดสอบทั้งหมดในระบบ ({tests.length} แบบทดสอบ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {/* Loading Table Skeleton */}
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b">
                  <div className="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                {/* Table Rows */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 p-4 animate-pulse">
                    <div className="space-y-1">
                      <div className="w-28 h-4 bg-gray-300 rounded"></div>
                      <div className="w-40 h-3 bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                    <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    <div className="flex justify-end space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Loading Spinner */}
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-6 w-6 text-primary animate-bounce" />
                  </div>
                  <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแบบทดสอบ...</p>
              </div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ยังไม่มีแบบทดสอบ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อแบบทดสอบ</TableHead>
                  <TableHead>หลักสูตร</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{test.title}</div>
                        {test.description && (
                          <div className="text-sm text-muted-foreground">
                            {test.description.length > 50 
                              ? `${test.description.substring(0, 50)}...`
                              : test.description
                            }
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{test.course.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={test.type === "pretest" ? "default" : "secondary"}>
                        {test.type === "pretest" ? "ก่อนเรียน" : "หลังเรียน"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={test.isActive ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleStatus(test.id, test.isActive)}
                      >
                        {test.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(test.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/tests/${test.id}/questions`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(test)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(test.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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