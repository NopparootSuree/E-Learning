"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Plus, Edit, Trash2, ArrowLeft, Move, HelpCircle, PenTool } from "lucide-react"

interface Test {
  id: string
  title: string
  type: string
  course: {
    id: string
    title: string
  }
}

interface Question {
  id: string
  type: string
  question: string
  options: string | null
  correctAnswer: string | null
  points: number
  order: number
}

export default function TestQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    type: "multiple_choice",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1
  })

  useEffect(() => {
    if (params.id) {
      fetchTest()
    }
  }, [params.id])

  const fetchTest = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tests/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTest(data)
        setQuestions(data.questions || [])
      } else if (response.status === 404) {
        router.push("/admin/tests")
      }
    } catch (error) {
      console.error("Error fetching test:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const questionData = {
        testId: params.id,
        type: formData.type,
        question: formData.question,
        options: formData.type === "multiple_choice" 
          ? JSON.stringify(formData.options.filter(opt => opt.trim())) 
          : null,
        correctAnswer: formData.type === "multiple_choice" ? formData.correctAnswer : null,
        points: formData.points,
        order: editingQuestion ? editingQuestion.order : questions.length + 1
      }

      const url = editingQuestion 
        ? `/api/questions/${editingQuestion.id}` 
        : "/api/questions"
      const method = editingQuestion ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      })

      if (response.ok) {
        fetchTest()
        setDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error saving question:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      type: question.type,
      question: question.question,
      options: question.options ? JSON.parse(question.options) : ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      points: question.points
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("คุณต้องการลบคำถามนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/questions/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchTest()
        }
      } catch (error) {
        console.error("Error deleting question:", error)
      }
    }
  }

  const moveQuestion = async (questionId: string, direction: "up" | "down") => {
    try {
      const response = await fetch(`/api/questions/${questionId}/move`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direction }),
      })
      if (response.ok) {
        fetchTest()
      }
    } catch (error) {
      console.error("Error moving question:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      type: "multiple_choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1
    })
    setEditingQuestion(null)
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({...formData, options: newOptions})
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">ไม่พบแบบทดสอบที่ต้องการ</p>
          <Link href="/admin/tests">
            <Button className="mt-4">กลับไปรายการแบบทดสอบ</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Link href="/admin/tests">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">จัดการคำถาม</h1>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-muted-foreground">{test.title}</p>
            <Badge variant={test.type === "pretest" ? "default" : "secondary"}>
              {test.type === "pretest" ? "ก่อนเรียน" : "หลังเรียน"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">หลักสูตร: {test.course.title}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มคำถาม
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลคำถามให้ครบถ้วน
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">ประเภทคำถาม</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทคำถาม" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">เลือกตอบ (Multiple Choice)</SelectItem>
                    <SelectItem value="written">เขียนตอบ (Written)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="question">คำถาม</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  rows={3}
                  required
                />
              </div>

              {formData.type === "multiple_choice" && (
                <>
                  <div className="space-y-2">
                    <Label>ตัวเลือก</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex space-x-2">
                        <span className="flex items-center justify-center w-8 h-10 bg-muted rounded text-sm">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`ตัวเลือก ${String.fromCharCode(65 + index)}`}
                          required={index < 2} // Require at least 2 options
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">คำตอบที่ถูกต้อง</Label>
                    <Select 
                      value={formData.correctAnswer} 
                      onValueChange={(value) => setFormData({...formData, correctAnswer: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคำตอบที่ถูกต้อง" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.options.map((option, index) => 
                          option.trim() && (
                            <SelectItem key={index} value={option}>
                              {String.fromCharCode(65 + index)}. {option}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="points">คะแนน</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 1})}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">
                  {editingQuestion ? "บันทึกการแก้ไข" : "เพิ่มคำถาม"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการคำถาม</CardTitle>
          <CardDescription>
            คำถามทั้งหมดในแบบทดสอบ ({questions.length} คำถาม)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ยังไม่มีคำถาม</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ลำดับ</TableHead>
                  <TableHead>คำถาม</TableHead>
                  <TableHead className="w-32">ประเภท</TableHead>
                  <TableHead className="w-20">คะแนน</TableHead>
                  <TableHead className="w-40 text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question, index) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">{question.order}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {question.question.length > 100 
                            ? `${question.question.substring(0, 100)}...`
                            : question.question
                          }
                        </div>
                        {question.type === "multiple_choice" && question.options && (
                          <div className="text-sm text-muted-foreground">
                            ตัวเลือก: {JSON.parse(question.options).length} ข้อ
                            {question.correctAnswer && (
                              <span className="ml-2 text-green-600">
                                (ถูกต้อง: {question.correctAnswer})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {question.type === "multiple_choice" ? (
                          <HelpCircle className="h-4 w-4" />
                        ) : (
                          <PenTool className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {question.type === "multiple_choice" ? "เลือกตอบ" : "เขียนตอบ"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{question.points}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(question.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(question.id, "down")}
                          disabled={index === questions.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
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