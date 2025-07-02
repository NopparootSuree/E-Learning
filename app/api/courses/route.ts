import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { buildWhereClause, buildOrderBy, getPaginationParams, parseQueryString } from "@/lib/filters"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userView = searchParams.get('userView')
    const session = await auth()
    
    // Parse filter parameters
    const filters = parseQueryString(searchParams.toString())
    
    if (userView === 'true' && session?.user?.employeeId) {
      // User view - only show enrolled courses
      const enrolledCourses = await prisma.courseEnrollment.findMany({
        where: {
          employeeId: session.user.employeeId,
          status: 'active',
          deletedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          course: {
            include: {
              group: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  order: true
                }
              },
              tests: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  title: true,
                  type: true
                }
              }
            }
          }
        }
      })

      // Extract courses from enrollments - only active and not deleted
      const courses = enrolledCourses
        .map(enrollment => enrollment.course)
        .filter(course => 
          course !== null && 
          course.isActive && 
          !course.deletedAt
        )
        .sort((a, b) => {
          // Sort by group order, then course order, then creation date
          if (a.group?.order !== b.group?.order) {
            return (a.group?.order || 0) - (b.group?.order || 0)
          }
          if (a.order !== b.order) {
            return a.order - b.order
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      // Admin view - all courses with filtering
      const where = buildWhereClause(filters)
      const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder)
      const { page, limit, skip } = getPaginationParams(filters)

      // Get total count for pagination
      const total = await prisma.course.count({ where })

      // Get courses with filters
      const courses = await prisma.course.findMany({
        where,
        include: {
          group: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true
            }
          },
          _count: {
            select: {
              enrollments: {
                where: { deletedAt: null }
              }
            }
          }
        },
        orderBy: filters.sortBy ? orderBy : [
          {
            group: {
              order: "asc"
            }
          },
          {
            order: "asc"
          },
          {
            createdAt: "desc"
          }
        ],
        skip,
        take: limit
      })

      return NextResponse.json({
        data: courses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: filters
      })
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
    const { title, description, contentType, contentUrl, contentSource = "url", contentFile = null, isActive = true, groupId = null, order = 0 } = body

    // Validate content type
    if (!["video", "pdf", "powerpoint"].includes(contentType)) {
      return NextResponse.json(
        { error: "ประเภทเนื้อหาไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Validate content based on source
    if (contentSource === "upload") {
      // For upload, require contentFile
      if (!contentFile) {
        return NextResponse.json(
          { error: "กรุณาอัปโหลดไฟล์" },
          { status: 400 }
        )
      }
    } else if (contentSource === "url") {
      // For URL, require contentUrl
      if (!contentUrl || !contentUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "URL ไม่ถูกต้อง" },
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
        contentSource,
        contentFile,
        isActive,
        groupId,
        order
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