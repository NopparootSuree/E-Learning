"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, GraduationCap } from "lucide-react"

interface Employee {
  id: string
  idEmp: string
  name: string
  section: string
  department: string
  company: string
  createdAt: string
  updatedAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    idEmp: "",
    name: "",
    section: "",
    department: "",
    company: ""
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees"
      const method = editingEmployee ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchEmployees()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving employee:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      idEmp: employee.idEmp,
      name: employee.name,
      section: employee.section,
      department: employee.department,
      company: employee.company
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("คุณต้องการลบพนักงานคนนี้หรือไม่?")) {
      setDeleting(id)
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchEmployees()
        }
      } catch (error) {
        console.error("Error deleting employee:", error)
      } finally {
        setDeleting(null)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      idEmp: "",
      name: "",
      section: "",
      department: "",
      company: ""
    })
    setEditingEmployee(null)
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
          <h1 className="text-3xl font-bold text-primary">จัดการข้อมูลพนักงาน</h1>
          <p className="text-muted-foreground">จัดการข้อมูลพนักงานในระบบ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มพนักงาน
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลพนักงานให้ครบถ้วน
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idEmp">รหัสพนักงาน</Label>
                <Input
                  id="idEmp"
                  value={formData.idEmp}
                  onChange={(e) => setFormData({...formData, idEmp: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">แผนก</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">ฝ่าย</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">บริษัท</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "กำลังบันทึก..." : (editingEmployee ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพนักงาน</CardTitle>
          <CardDescription>
            รายชื่อพนักงานทั้งหมดในระบบ ({employees.length} คน)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {/* Loading Table Skeleton */}
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b">
                  <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                {/* Table Rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 p-4 animate-pulse">
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    <div className="w-24 h-4 bg-gray-300 rounded"></div>
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                    <div className="w-12 h-4 bg-gray-300 rounded"></div>
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                    <div className="flex justify-end space-x-2">
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
                <p className="text-sm text-gray-500">กำลังโหลดข้อมูลพนักงาน...</p>
              </div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ยังไม่มีข้อมูลพนักงาน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead>ฝ่าย</TableHead>
                  <TableHead>บริษัท</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.idEmp}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.section}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.company}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(employee.id)}
                          disabled={deleting === employee.id}
                        >
                          {deleting === employee.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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