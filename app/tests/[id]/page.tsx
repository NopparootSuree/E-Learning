"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, AlertCircle, GraduationCap } from "lucide-react"
import { useAlertDialog } from "@/components/ui/alert-dialog-provider"

interface Question {
  id: string
  type: string
  question: string
  options: string | null
  correctAnswer: string | null
  points: number
  order: number
}

interface Test {
  id: string
  courseId: string
  type: string
  title: string
  description: string | null
  isActive: boolean
  course: {
    id: string
    title: string
  }
  questions: Question[]
}

interface Answer {
  questionId: string
  answer: string
}

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const { showAlert, showConfirm } = useAlertDialog()
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const fetchTest = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tests/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTest(data)
        // Initialize answers array
        setAnswers(data.questions.map((q: Question) => ({ questionId: q.id, answer: "" })))
      } else if (response.status === 404) {
        router.push("/courses")
      }
    } catch (error) {
      console.error("Error fetching test:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id) {
      fetchTest()
    }
  }, [params.id, fetchTest])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => 
      prev.map(a => 
        a.questionId === questionId ? { ...a, answer } : a
      )
    )
  }

  const handleSubmit = async () => {
    if (!test) return

    // Check if all questions are answered
    const unansweredQuestions = answers.filter(a => !a.answer.trim())
    if (unansweredQuestions.length > 0) {
      await showAlert({
        title: "กรุณาตอบคำถามให้ครบ",
        description: `กรุณาตอบคำถามให้ครบทุกข้อ (เหลืออีก ${unansweredQuestions.length} ข้อ)`
      })
      return
    }

    const confirmed = await showConfirm({
      title: "ยืนยันการส่งคำตอบ",
      description: "คุณต้องการส่งคำตอบหรือไม่? คุณจะไม่สามารถแก้ไขได้อีก",
      confirmText: "ส่งคำตอบ",
      cancelText: "ยกเลิก"
    })
    
    if (!confirmed) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/tests/${test.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: answers.filter(a => a.answer.trim())
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const error = await response.json()
        await showAlert({
          title: "เกิดข้อผิดพลาด",
          description: error.error || "เกิดข้อผิดพลาดในการส่งคำตอบ"
        })
      }
    } catch (error) {
      console.error("Error submitting test:", error)
      await showAlert({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการส่งคำตอบ"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.answer || ""
  }

  const getAnsweredCount = () => {
    return answers.filter(a => a.answer.trim()).length
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Loading Header Skeleton */}
          <div className="flex items-center mb-8">
            <div className="w-16 h-8 bg-gray-300 rounded animate-pulse mr-4"></div>
            <div className="space-y-2">
              <div className="w-64 h-8 bg-gray-300 rounded animate-pulse"></div>
              <div className="flex items-center space-x-4 mt-2">
                <div className="w-24 h-6 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Progress Card Skeleton */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="w-full h-2 bg-gray-300 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          
          {/* Loading Question Card Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <div className="w-3/4 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                    <div className="w-48 h-4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Loading Navigation Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="w-24 h-10 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-300 rounded animate-pulse"></div>
          </div>
          
          {/* Loading Question Navigation Skeleton */}
          <Card>
            <CardHeader>
              <div className="w-20 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-40 h-4 bg-gray-300 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="w-10 h-8 bg-gray-300 rounded animate-pulse"></div>
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
            <p className="text-sm text-gray-500">กำลังโหลดแบบทดสอบ...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">ไม่พบแบบทดสอบที่ต้องการ</p>
          <Link href="/courses">
            <Button className="mt-4">กลับไปรายการหลักสูตร</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!test.isActive) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">แบบทดสอบนี้ปิดใช้งานแล้ว</p>
          <Link href={`/courses/${test.courseId}`}>
            <Button>กลับไปหลักสูตร</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-4">ส่งคำตอบเรียบร้อย</h1>
          <p className="text-muted-foreground mb-6">
            คุณได้ทำแบบทดสอบ &quot;{test.title}&quot; เสร็จสิ้นแล้ว
          </p>
          <div className="space-x-4">
            <Link href={`/courses/${test.courseId}`}>
              <Button>กลับไปหลักสูตร</Button>
            </Link>
            <Link href="/scores">
              <Button variant="outline">ดูคะแนน</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (test.questions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">แบบทดสอบนี้ยังไม่มีคำถาม</p>
          <Link href={`/courses/${test.courseId}`}>
            <Button>กลับไปหลักสูตร</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentQuestion = test.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center mb-8">
        <Link href={`/courses/${test.courseId}`}>
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">{test.title}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant={test.type === "pretest" ? "default" : "secondary"}>
              {test.type === "pretest" ? "แบบทดสอบก่อนเรียน" : "แบบทดสอบหลังเรียน"}
            </Badge>
            <span className="text-muted-foreground">หลักสูตร: {test.course.title}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                ข้อ {currentQuestionIndex + 1} จาก {test.questions.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                ตอบแล้ว {getAnsweredCount()}/{test.questions.length} ข้อ
              </span>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            ข้อ {currentQuestion.order}. {currentQuestion.question}
          </CardTitle>
          <CardDescription>
            คะแนน: {currentQuestion.points} คะแนน
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === "multiple_choice" ? (
            <RadioGroup
              value={getCurrentAnswer(currentQuestion.id)}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options && JSON.parse(currentQuestion.options).map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={getCurrentAnswer(currentQuestion.id)}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="พิมพ์คำตอบของคุณ..."
              rows={5}
              className="resize-none"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={isFirstQuestion}
        >
          ข้อก่อนหน้า
        </Button>

        <div className="flex space-x-2">
          {!isLastQuestion ? (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
            >
              ข้อถัดไป
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">ข้อคำถาม</CardTitle>
          <CardDescription>คลิกเพื่อไปยังข้อที่ต้องการ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((question, index) => (
              <Button
                key={question.id}
                variant={currentQuestionIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`relative ${
                  getCurrentAnswer(question.id) ? "ring-2 ring-green-500" : ""
                }`}
              >
                {index + 1}
                {getCurrentAnswer(question.id) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}