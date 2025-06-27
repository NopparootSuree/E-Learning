"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash, GripVertical } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Course {
  id: string
  title: string
  contentType: string
  tests: Array<{ id: string; title: string; type: string }>
}

interface Group {
  id: string
  title: string
  description?: string
  order: number
  isActive: boolean
  courses: Course[]
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0,
    isActive: true
  })

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups")
      const data = await response.json()
      setGroups(data)
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateOpen(false)
        setFormData({ title: "", description: "", order: 0, isActive: true })
        fetchGroups()
      }
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const handleEdit = async () => {
    if (!editingGroup) return

    try {
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditOpen(false)
        setEditingGroup(null)
        setFormData({ title: "", description: "", order: 0, isActive: true })
        fetchGroups()
      }
    } catch (error) {
      console.error("Error updating group:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error("Error deleting group:", error)
    }
  }

  const openEditDialog = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      title: group.title,
      description: group.description || "",
      order: group.order,
      isActive: group.isActive
    })
    setIsEditOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-red-900">จัดการกลุ่มหลักสูตร</h1>
          <p className="text-gray-600">สร้างและจัดการกลุ่มหลักสูตรการเรียนรู้</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-800 hover:bg-red-900">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มกลุ่มใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มกลุ่มหลักสูตรใหม่</DialogTitle>
              <DialogDescription>
                สร้างกลุ่มหลักสูตรใหม่เพื่อจัดระเบียบการเรียนรู้
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">ชื่อกลุ่ม</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ชื่อกลุ่มหลักสูตร"
                />
              </div>
              <div>
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="คำอธิบายเกี่ยวกับกลุ่มนี้"
                />
              </div>
              <div>
                <Label htmlFor="order">ลำดับ</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="bg-red-800 hover:bg-red-900">
                สร้างกลุ่ม
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="border-l-4 border-l-red-600">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div>
                    <CardTitle className="text-red-900">{group.title}</CardTitle>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ลบกลุ่มหลักสูตร</AlertDialogTitle>
                        <AlertDialogDescription>
                          คุณแน่ใจหรือไม่ที่จะลบกลุ่ม &quot;{group.title}&quot; นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(group.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          ลบ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>หลักสูตรในกลุ่ม</span>
                  <Badge variant="outline">{group.courses.length} หลักสูตร</Badge>
                </div>
                {group.courses.length > 0 ? (
                  <div className="grid gap-2">
                    {group.courses.map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{course.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {course.contentType}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {course.tests.map((test) => (
                            <Badge key={test.id} variant="secondary" className="text-xs">
                              {test.type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">ยังไม่มีหลักสูตรในกลุ่มนี้</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขกลุ่มหลักสูตร</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลกลุ่มหลักสูตร
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">ชื่อกลุ่ม</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ชื่อกลุ่มหลักสูตร"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">คำอธิบาย</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="คำอธิบายเกี่ยวกับกลุ่มนี้"
              />
            </div>
            <div>
              <Label htmlFor="edit-order">ลำดับ</Label>
              <Input
                id="edit-order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="edit-isActive">เปิดใช้งาน</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} className="bg-red-800 hover:bg-red-900">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}