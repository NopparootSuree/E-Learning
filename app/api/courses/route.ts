import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userView = searchParams.get('userView')
    const session = await auth()
    
    if (userView === 'true' && session?.user?.employeeId) {
      // User view - include progress data
      const courses = await prisma.course.findMany({
        where: {
          deletedAt: null,
          isActive: true // Only show active courses to users
        },
        include: {
          tests: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      // Get user's progress for each course
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const preTest = course.tests.find(t => t.type === 'pretest')
          const postTest = course.tests.find(t => t.type === 'posttest')
          
          // Get test attempts
          const preTestAttempt = preTest ? await prisma.testAttempt.findFirst({
            where: {
              employeeId: session.user.employeeId,
              testId: preTest.id,
              status: 'completed',
              deletedAt: null
            }
          }) : null
          
          const postTestAttempt = postTest ? await prisma.testAttempt.findFirst({
            where: {
              employeeId: session.user.employeeId,
              testId: postTest.id,
              status: 'completed',
              deletedAt: null
            }
          }) : null

          // Get course attempt
          const courseAttempt = await prisma.courseAttempt.findFirst({
            where: {
              employeeId: session.user.employeeId,
              courseId: course.id,
              deletedAt: null
            }
          })

          return {
            ...course,
            preTest,
            postTest,
            userProgress: {
              preTestCompleted: !!preTestAttempt,
              postTestCompleted: !!postTestAttempt,
              courseCompleted: courseAttempt?.status === 'completed',
              contentCompleted: !!courseAttempt?.contentCompletedAt,
              contentProgress: courseAttempt?.contentProgress || 0,
              preTestScore: preTestAttempt?.score,
              postTestScore: postTestAttempt?.score
            }
          }
        })
      )

      return NextResponse.json(coursesWithProgress)
    } else {
      // Admin view - all courses
      const courses = await prisma.course.findMany({
        where: {
          deletedAt: null
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return NextResponse.json(courses)
    }
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, contentType, contentUrl, videoSource = "url", videoFile = null, isActive = true } = body

    // Validate content type
    if (!["video", "powerpoint"].includes(contentType)) {
      return NextResponse.json(
        { error: "ประเภทเนื้อหาไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Validate content based on type
    if (contentType === "video") {
      // For video, require videoFile (uploaded file)
      if (!videoFile) {
        return NextResponse.json(
          { error: "กรุณาอัปโหลดไฟล์วิดีโอ" },
          { status: 400 }
        )
      }
    } else if (contentType === "powerpoint") {
      // For PowerPoint, require URL
      if (!contentUrl || !contentUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "URL PowerPoint ไม่ถูกต้อง" },
          { status: 400 }
        )
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        contentType,
        contentUrl,
        videoSource,
        videoFile,
        isActive
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    )
  }
}