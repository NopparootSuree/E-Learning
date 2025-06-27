"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, HelpCircle, PenTool, BookOpen } from "lucide-react"

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
  test: Test
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState<string>("all")

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true)
      const url = selectedTest === "all" 
        ? "/api/questions" 
        : `/api/questions?testId=${selectedTest}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedTest])

  const fetchTests = useCallback(async () => {
    try {
      const response = await fetch("/api/tests")
      if (response.ok) {
        const data = await response.json()
        setTests(data)
      }
    } catch (error) {
      console.error("Error fetching tests:", error)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
    fetchTests()
  }, [fetchQuestions, fetchTests])

  useEffect(() => {
    fetchQuestions()
  }, [selectedTest, fetchQuestions])

  const getQuestionsByTest = () => {
    if (selectedTest === "all") {
      return questions
    }
    return questions.filter(q => q.test.id === selectedTest)
  }

  const groupedQuestions = getQuestionsByTest().reduce((groups, question) => {
    const testId = question.test.id
    if (!groups[testId]) {
      groups[testId] = {
        test: question.test,
        questions: []
      }
    }
    groups[testId].questions.push(question)
    return groups
  }, {} as Record<string, { test: Test, questions: Question[] }>)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">จัดการคำถามทั้งหมด</h1>
          <p className="text-muted-foreground">ดูและจัดการคำถามจากทุกแบบทดสอบ</p>
        </div>
        <Link href="/">
          <Button variant="outline">กลับหน้าแรก</Button>
        </Link>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">กรองแบบทดสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแบบทดสอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">แบบทดสอบทั้งหมด</SelectItem>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.title} ({test.course.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : Object.keys(groupedQuestions).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">ไม่มีคำถาม</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedQuestions).map(({ test, questions }) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>{test.title}</span>
                      <Badge variant={test.type === "pretest" ? "default" : "secondary"}>
                        {test.type === "pretest" ? "ก่อนเรียน" : "หลังเรียน"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      หลักสูตร: {test.course.title} • {questions.length} คำถาม
                    </CardDescription>
                  </div>
                  <Link href={`/admin/tests/${test.id}/questions`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      จัดการ
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">ยังไม่มีคำถาม</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ข้อ</TableHead>
                        <TableHead>คำถาม</TableHead>
                        <TableHead className="w-32">ประเภท</TableHead>
                        <TableHead className="w-20">คะแนน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{question.order}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {question.question.length > 80 
                                  ? `${question.question.substring(0, 80)}...`
                                  : question.question
                                }
                              </div>
                              {question.type === "multiple_choice" && question.options && (
                                <div className="text-sm text-muted-foreground">
                                  ตัวเลือก: {JSON.parse(question.options).length} ข้อ
                                  {question.correctAnswer && (
                                    <span className="ml-2 text-green-600">
                                      (ถูกต้อง: {question.correctAnswer.length > 20 
                                        ? `${question.correctAnswer.substring(0, 20)}...`
                                        : question.correctAnswer
                                      })
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}