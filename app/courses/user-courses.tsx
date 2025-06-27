"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Video, FileText, Play, CheckCircle, Clock, Award, Eye, GraduationCap } from "lucide-react"

interface Group {
  id: string
  title: string
  description?: string
}

interface Course {
  id: string
  title: string
  description: string | null
  contentType: string
  contentUrl: string
  isActive: boolean
  group?: Group | null
  order: number
  preTest?: {
    id: string
    title: string
  } | null
  postTest?: {
    id: string
    title: string
  } | null
  userProgress?: {
    preTestCompleted: boolean
    postTestCompleted: boolean
    courseCompleted: boolean
    contentCompleted: boolean
    contentProgress: number
    preTestScore?: number
    postTestScore?: number
  }
}

export default function UserCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/courses?userView=true")
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

  const getStatusBadge = (course: Course) => {
    const progress = course.userProgress
    
    if (!progress) return <Badge variant="outline">เริ่มเรียน</Badge>
    
    if (progress.postTestCompleted) {
      return <Badge variant="default" className="bg-green-500">เสร็จสิ้น</Badge>
    }
    
    if (progress.contentCompleted) {
      return <Badge variant="secondary">รอทำ Post-test</Badge>
    }
    
    if (progress.preTestCompleted) {
      return <Badge variant="secondary">กำลังเรียน</Badge>
    }
    
    return <Badge variant="outline">เริ่มเรียน</Badge>
  }

  const getProgressPercentage = (course: Course) => {
    const progress = course.userProgress
    if (!progress) return 0
    
    let completed = 0
    let total = 3 // pretest + content + posttest
    
    if (progress.preTestCompleted) completed++
    if (progress.contentCompleted) completed++
    if (progress.postTestCompleted) completed++
    
    return (completed / total) * 100
  }

  const getNextAction = (course: Course) => {
    const progress = course.userProgress
    
    if (!progress || !progress.preTestCompleted) {
      return {
        label: "ทำ Pre-test",
        href: course.preTest ? `/tests/${course.preTest.id}` : null,
        icon: Play,
        variant: "default" as const
      }
    }
    
    if (!progress.contentCompleted) {
      return {
        label: "เข้าเรียน",
        href: `/courses/${course.id}`,
        icon: BookOpen,
        variant: "default" as const
      }
    }
    
    if (!progress.postTestCompleted) {
      return {
        label: "ทำ Post-test",
        href: course.postTest ? `/tests/${course.postTest.id}` : null,
        icon: Award,
        variant: "default" as const
      }
    }
    
    return {
      label: "ดูรายละเอียด",
      href: `/courses/${course.id}`,
      icon: Eye,
      variant: "outline" as const
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">หลักสูตรเรียน</h1>
        
        {/* Loading Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-32 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                </div>
                <div className="w-full h-4 bg-gray-300 rounded mt-2"></div>
                <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                    <div className="w-8 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-full h-2 bg-gray-300 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-20 h-6 bg-gray-300 rounded"></div>
                  <div className="w-16 h-8 bg-gray-300 rounded"></div>
                </div>
              </CardContent>
            </Card>
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
          <p className="text-sm text-gray-500">กำลังโหลดหลักสูตรของคุณ...</p>
        </div>
      </div>
    )
  }

  const activeCourses = courses.filter(course => course.isActive)
  
  // Group courses by group
  const groupedCourses = activeCourses.reduce((acc, course) => {
    const groupTitle = course.group?.title || 'ไม่ระบุกลุ่ม'
    if (!acc[groupTitle]) {
      acc[groupTitle] = []
    }
    acc[groupTitle].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-red-900">หลักสูตรเรียน</h1>
          <p className="text-muted-foreground mt-2">เลือกหลักสูตรที่ต้องการเรียน</p>
        </div>
        <div className="text-sm text-muted-foreground">
          ยินดีต้อนรับ <span className="font-medium">{session?.user?.name}</span>
        </div>
      </div>

      {activeCourses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">ยังไม่มีหลักสูตรที่เปิดให้เรียน</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCourses).map(([groupTitle, groupCourses]) => (
            <div key={groupTitle} className="space-y-4">
              <div className="border-l-4 border-l-red-600 pl-4">
                <h2 className="text-xl font-semibold text-red-900">{groupTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {groupCourses.length} หลักสูตร
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupCourses
                  .sort((a, b) => a.order - b.order)
                  .map((course) => {
                    const nextAction = getNextAction(course)
                    const progress = getProgressPercentage(course)
                    
                    return (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {course.contentType === "video" ? (
                                <Video className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-green-500" />
                              )}
                              <CardTitle className="text-lg">{course.title}</CardTitle>
                            </div>
                            <div className="flex items-center space-x-2">
                              {course.order > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  #{course.order}
                                </Badge>
                              )}
                              {getStatusBadge(course)}
                            </div>
                          </div>
                          {course.description && (
                            <CardDescription className="line-clamp-2">
                              {course.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>ความก้าวหน้า</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          {/* Progress Details */}
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={`h-4 w-4 ${
                                course.userProgress?.preTestCompleted ? "text-green-500" : "text-gray-300"
                              }`} />
                              <span>Pre-test</span>
                              {course.userProgress?.preTestScore && (
                                <span className="text-muted-foreground">
                                  ({course.userProgress.preTestScore}%)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={`h-4 w-4 ${
                                course.userProgress?.contentCompleted ? "text-green-500" : "text-gray-300"
                              }`} />
                              <span>เนื้อหาการเรียน</span>
                              {course.userProgress?.contentProgress && course.userProgress.contentProgress > 0 && !course.userProgress.contentCompleted && (
                                <span className="text-muted-foreground">
                                  ({course.userProgress.contentProgress}%)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={`h-4 w-4 ${
                                course.userProgress?.postTestCompleted ? "text-green-500" : "text-gray-300"
                              }`} />
                              <span>Post-test</span>
                              {course.userProgress?.postTestScore && (
                                <span className="text-muted-foreground">
                                  ({course.userProgress.postTestScore}%)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2">
                            {nextAction.href ? (
                              <Link href={nextAction.href}>
                                <Button variant={nextAction.variant} className="w-full">
                                  <nextAction.icon className="mr-2 h-4 w-4" />
                                  {nextAction.label}
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="outline" disabled className="w-full">
                                <Clock className="mr-2 h-4 w-4" />
                                ยังไม่พร้อมใช้งาน
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}