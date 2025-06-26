"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Video, FileText, Play, BookOpen, CheckCircle, File } from "lucide-react"

interface Test {
  id: string
  type: string
  title: string
  description: string | null
  isActive: boolean
}

interface Course {
  id: string
  title: string
  description: string | null
  contentType: string
  contentUrl: string
  contentSource: string
  contentFile: string | null
  isActive: boolean
  createdAt: string
  tests: Test[]
}

interface TestAttempt {
  id: string
  testId: string
  status: string
  score: number | null
  completedAt: string | null
}

interface CourseProgress {
  attempt: any
  hasStartedContent: boolean
  hasCompletedContent: boolean
  contentProgress: number
  status: string
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [preTestAttempt, setPreTestAttempt] = useState<TestAttempt | null>(null)
  const [postTestAttempt, setPostTestAttempt] = useState<TestAttempt | null>(null)
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogContent, setDialogContent] = useState({ title: "", description: "" })

  useEffect(() => {
    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
        
        // Check if user has completed pre-test and course progress
        if (session?.user) {
          // Check pre-test completion
          if (data.tests?.length > 0) {
            const preTest = data.tests.find((test: Test) => test.type === "pretest")
            const postTest = data.tests.find((test: Test) => test.type === "posttest")
            
            if (preTest) {
              const attemptResponse = await fetch(`/api/tests/${preTest.id}/attempts`)
              if (attemptResponse.ok) {
                const attempts = await attemptResponse.json()
                const completedAttempt = attempts.find((attempt: TestAttempt) => attempt.status === "completed")
                setPreTestAttempt(completedAttempt || null)
              }
            }
            
            if (postTest) {
              const attemptResponse = await fetch(`/api/tests/${postTest.id}/attempts`)
              if (attemptResponse.ok) {
                const attempts = await attemptResponse.json()
                const completedAttempt = attempts.find((attempt: TestAttempt) => attempt.status === "completed")
                setPostTestAttempt(completedAttempt || null)
              }
            }
          }
          
          // Check course content progress
          const progressResponse = await fetch(`/api/courses/${params.id}/progress`)
          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            setCourseProgress(progressData)
            setVideoProgress(progressData.contentProgress || 0)
          }
        }
      } else if (response.status === 404) {
        router.push("/courses")
      }
    } catch (error) {
      console.error("Error fetching course:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPreTest = () => course?.tests.find(test => test.type === "pretest")
  const getPostTest = () => course?.tests.find(test => test.type === "posttest")
  const isPreTestCompleted = () => preTestAttempt?.status === "completed"
  const isPostTestCompleted = () => postTestAttempt?.status === "completed"
  const isContentCompleted = () => courseProgress?.hasCompletedContent || false
  
  const updateProgress = async (action: string, progress?: number, duration?: number) => {
    try {
      await fetch(`/api/courses/${params.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, progress, duration })
      })
      
      // Refresh progress data
      const progressResponse = await fetch(`/api/courses/${params.id}/progress`)
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setCourseProgress(progressData)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }
  
  const handleVideoStart = () => {
    if (!courseProgress?.hasStartedContent) {
      updateProgress('start_content')
    }
  }
  
  const handleVideoProgress = (currentTime: number, duration: number) => {
    if (duration > 0) {
      const progress = Math.round((currentTime / duration) * 100)
      setVideoProgress(progress)
      
      // Update progress every 10%
      if (progress > 0 && progress % 10 === 0) {
        updateProgress('update_progress', progress, Math.round(currentTime))
      }
    }
  }
  
  const handleVideoComplete = (duration: number) => {
    updateProgress('complete_content', 100, Math.round(duration))
  }
  
  const handlePDFStart = () => {
    if (!courseProgress?.hasStartedContent) {
      updateProgress('start_content')
    }
  }
  
  const handlePDFComplete = async () => {
    await updateProgress('complete_content', 100, 0)
    setDialogContent({
      title: "เรียนจบแล้ว!",
      description: "คุณได้อ่านเนื้อหาเรียบร้อยแล้ว ตอนนี้สามารถเข้าทำข้อสอบหลังเรียนได้"
    })
    setShowDialog(true)
  }
  
  const renderContent = () => {
    if (!course) return null
    
    // Use content file (for uploaded files) or content URL (for external links)
    const contentUrl = course.contentSource === "upload" ? course.contentFile : course.contentUrl
    if (!contentUrl) return null

    if (course.contentType === "video") {
      // Check if it's a YouTube URL
      if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
        // Extract YouTube video ID and create embed URL
        let videoId = ''
        if (contentUrl.includes('youtube.com/watch?v=')) {
          videoId = contentUrl.split('v=')[1]?.split('&')[0]
        } else if (contentUrl.includes('youtu.be/')) {
          videoId = contentUrl.split('youtu.be/')[1]?.split('?')[0]
        }
        
        if (videoId) {
          return (
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        }
      }
      
      return (
        <video 
          controls 
          className="w-full h-full rounded-lg"
          preload="metadata"
          onPlay={handleVideoStart}
          onTimeUpdate={(e) => {
            const video = e.target as HTMLVideoElement
            handleVideoProgress(video.currentTime, video.duration)
          }}
          onEnded={(e) => {
            const video = e.target as HTMLVideoElement
            handleVideoComplete(video.duration)
          }}
        >
          <source src={contentUrl} type="video/mp4" />
          <source src={contentUrl} type="video/webm" />
          <source src={contentUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      )
    } else if (course.contentType === "pdf") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-5 h-5" />
              <span>PDF เอกสาร</span>
              {isContentCompleted() && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  อ่านจบแล้ว
                </Badge>
              )}
            </div>
            {!isContentCompleted() && (
              <Button 
                onClick={handlePDFComplete}
                variant="outline"
                size="sm"
              >
                ทำเครื่องหมายว่าอ่านจบแล้ว
              </Button>
            )}
          </div>
          <iframe
            src={contentUrl}
            className="w-full rounded-lg border-0"
            style={{ height: "80vh" }}
            title="PDF Viewer"
            onLoad={handlePDFStart}
          />
        </div>
      )
    }

    return null
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

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">ไม่พบหลักสูตรที่ต้องการ</p>
          <Link href="/courses">
            <Button className="mt-4">กลับไปรายการหลักสูตร</Button>
          </Link>
        </div>
      </div>
    )
  }

  const preTest = getPreTest()
  const postTest = getPostTest()

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Link href="/courses">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">{course.title}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant={course.isActive ? "default" : "secondary"}>
              {course.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Badge>
            <div className="flex items-center space-x-1 text-muted-foreground">
              {course.contentType === "video" ? (
                <Video className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="text-sm">
                {course.contentType === "video" ? "วิดีโอ" : "PDF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>เนื้อหาหลักสูตร</span>
              </CardTitle>
              {course.description && (
                <CardDescription>{course.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  {/* Show video directly if pre-test is completed or no pre-test exists */}
                  {isPreTestCompleted() || !getPreTest() ? (
                    <div className={course.contentType === "video" ? "aspect-video bg-black rounded-lg overflow-hidden" : "rounded-lg overflow-hidden"}>
                      {renderContent()}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        {course.contentType === "video" ? (
                          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        ) : (
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        )}
                        <p className="text-muted-foreground mb-4">ต้องทำแบบทดสوบก่อนเรียนก่อน</p>
                        <p className="text-sm text-muted-foreground">
                          กรุณาทำแบบทดสอบก่อนเรียนเพื่อดูเนื้อหา
                          {course.contentType === "video" ? "วิดีโอ" : "PDF"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show completion status and progress */}
                  <div className="space-y-2">
                    {isPreTestCompleted() && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">ทำแบบทดสอบก่อนเรียนเรียบร้อยแล้ว</span>
                      </div>
                    )}
                    
                    {/* Video Progress Bar */}
                    {courseProgress?.hasStartedContent && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>ความคืบหน้าการดูเนื้อหา</span>
                          <span>{videoProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${videoProgress}%` }}
                          ></div>
                        </div>
                        {isContentCompleted() && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">ดูเนื้อหาการเรียนครบถ้วนแล้ว</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests Sidebar */}
        <div className="space-y-6">
          {/* Pre-test */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">แบบทดสอบก่อนเรียน</CardTitle>
              <CardDescription>
                ต้องทำแบบทดสอบก่อนเข้าเรียน
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preTest ? (
                <div className="space-y-3">
                  <h4 className="font-medium">{preTest.title}</h4>
                  {preTest.description && (
                    <p className="text-sm text-muted-foreground">
                      {preTest.description}
                    </p>
                  )}
                  <Badge variant={preTest.isActive ? "default" : "secondary"}>
                    {preTest.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                  {/* แสดงปุ่มเฉพาะเมื่อยังไม่ทำ pre-test หรือทำไม่เสร็จ */}
                  {preTest.isActive && !isPreTestCompleted() && (
                    <div className="pt-2">
                      <Link href={`/tests/${preTest.id}`}>
                        <Button size="sm" className="w-full">
                          เริ่มทำแบบทดสอบ
                        </Button>
                      </Link>
                    </div>
                  )}
                  {/* แสดงสถานะเมื่อทำเสร็จแล้ว */}
                  {isPreTestCompleted() && (
                    <div className="pt-2">
                      <div className="flex items-center space-x-2 text-green-600 justify-center">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">ทำแบบทดสอบเสร็จแล้ว</span>
                      </div>
                      {preTestAttempt?.score && (
                        <div className="text-center text-sm text-muted-foreground mt-1">
                          คะแนน: {preTestAttempt.score}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  ยังไม่มีแบบทดสอบก่อนเรียน
                </p>
              )}
            </CardContent>
          </Card>

          {/* Post-test */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">แบบทดสอบหลังเรียน</CardTitle>
              <CardDescription>
                ทำแบบทดสอบหลังเรียนเสร็จ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postTest ? (
                <div className="space-y-3">
                  <h4 className="font-medium">{postTest.title}</h4>
                  {postTest.description && (
                    <p className="text-sm text-muted-foreground">
                      {postTest.description}
                    </p>
                  )}
                  <Badge variant={postTest.isActive ? "default" : "secondary"}>
                    {postTest.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                  
                  {/* แสดงปุ่มเฉพาะเมื่อดูเนื้อหาเสร็จแล้ว และยังไม่ทำ post-test */}
                  {postTest.isActive && isContentCompleted() && !isPostTestCompleted() && (
                    <div className="pt-2">
                      <Link href={`/tests/${postTest.id}`}>
                        <Button size="sm" className="w-full">
                          เริ่มทำแบบทดสอบ
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {/* แสดงข้อความเมื่อยังดูเนื้อหาไม่เสร็จ */}
                  {postTest.isActive && !isContentCompleted() && (
                    <div className="pt-2">
                      <div className="text-center text-sm text-muted-foreground">
                        ต้องดูเนื้อหาการเรียนให้เสร็จก่อน
                      </div>
                    </div>
                  )}
                  
                  {/* แสดงสถานะเมื่อทำเสร็จแล้ว */}
                  {isPostTestCompleted() && (
                    <div className="pt-2">
                      <div className="flex items-center space-x-2 text-green-600 justify-center">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">ทำแบบทดสอบเสร็จแล้ว</span>
                      </div>
                      {postTestAttempt?.score && (
                        <div className="text-center text-sm text-muted-foreground mt-1">
                          คะแนน: {postTestAttempt.score}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  ยังไม่มีแบบทดสอบหลังเรียน
                </p>
              )}
            </CardContent>
          </Card>

          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลหลักสูตร</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">วันที่สร้าง:</span>
                <br />
                {new Date(course.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {course.contentSource === "upload" ? "ไฟล์เนื้อหา:" : "URL เนื้อหา:"}
                </span>
                <br />
                {course.contentSource === "upload" ? (
                  <span className="text-muted-foreground">
                    {course.contentFile?.split('/').pop() || "ไม่มีไฟล์"}
                  </span>
                ) : (
                  <a 
                    href={course.contentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {course.contentUrl.length > 30 
                      ? `${course.contentUrl.substring(0, 30)}...`
                      : course.contentUrl
                    }
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>
              รับทราบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}