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
import { Plus, Edit, Trash2, Eye, Video, FileText, Upload, GraduationCap } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string | null
  contentType: string
  contentUrl: string | null
  videoSource: string
  videoFile: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentType: "video",
    contentUrl: "",
    videoSource: "upload", // เปลี่ยนเป็น upload เป็น default
    videoFile: "",
    isActive: true
  })
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : "/api/courses"
      const method = editingCourse ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setDialogOpen(false)
        resetForm()
        fetchCourses()
      }
    } catch (error) {
      console.error("Error saving course:", error)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || "",
      contentType: course.contentType,
      contentUrl: course.contentUrl || "",
      videoSource: course.videoSource,
      videoFile: course.videoFile || "",
      isActive: course.isActive
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("คุณต้องการลบหลักสูตรนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/courses/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchCourses()
        }
      } catch (error) {
        console.error("Error deleting course:", error)
      }
    }
  }

  const toggleStatus = async (course: Course) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...course, isActive: !course.isActive }),
      })
      if (response.ok) {
        fetchCourses()
      }
    } catch (error) {
      console.error("Error updating course status:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ 
          ...prev, 
          videoFile: result.url,
          contentUrl: result.url 
        }))
      } else {
        const error = await response.json()
        alert(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.error}`)
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์')
    } finally {
      setUploadingVideo(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      contentType: "video",
      contentUrl: "",
      videoSource: "upload", // เปลี่ยนเป็น upload เป็น default
      videoFile: "",
      isActive: true
    })
    setEditingCourse(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-red-900">จัดการหลักสูตร</h1>
          <p className="text-muted-foreground mt-2">สร้างและจัดการหลักสูตรการเรียน</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มหลักสูตรใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลหลักสูตรการเรียน
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">ชื่อหลักสูตร</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="กรอกชื่อหลักสูตร"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="กรอกรายละเอียดหลักสูตร"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">ประเภทเนื้อหา</Label>
                  <Select 
                    value={formData.contentType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทเนื้อหา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">วิดีโอ</SelectItem>
                      <SelectItem value="powerpoint">PowerPoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.contentType === "video" && (
                  <div className="space-y-2">
                    <Label htmlFor="videoFile">อัปโหลดไฟล์วิดีโอ</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={handleFileUpload}
                        disabled={uploadingVideo}
                        required={!formData.videoFile}
                      />
                      {uploadingVideo && (
                        <div className="text-sm text-muted-foreground">กำลังอัปโหลด...</div>
                      )}
                    </div>
                    {formData.videoFile && (
                      <div className="text-sm text-green-600">
                        ✅ ไฟล์ที่อัปโหลด: {formData.videoFile.split('/').pop()}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      รองรับไฟล์ MP4, WebM, OGG ขนาดสูงสุด 100MB
                    </div>
                  </div>
                )}

                {formData.contentType === "powerpoint" && (
                  <div className="space-y-2">
                    <Label htmlFor="contentUrl">URL PowerPoint</Label>
                    <Input
                      id="contentUrl"
                      value={formData.contentUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, contentUrl: e.target.value }))}
                      placeholder="https://..."
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">เปิดใช้งาน</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">
                  {editingCourse ? "บันทึกการแก้ไข" : "สร้างหลักสูตร"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Loading Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <div className="space-y-1">
                        <div className="w-32 h-5 bg-gray-300 rounded"></div>
                        <div className="w-48 h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
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
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูลหลักสูตร...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>รายการหลักสูตรทั้งหมด</CardTitle>
            <CardDescription>
              จำนวนหลักสูตรทั้งหมด: {courses.length} หลักสูตร
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อหลักสูตร</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {course.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {course.contentType === "video" ? (
                          <Video className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-500" />
                        )}
                        <span className="capitalize">{course.contentType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={course.isActive ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleStatus(course)}
                      >
                        {course.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(course.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/courses/${course.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(course.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}