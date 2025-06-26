import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const courseId = searchParams.get("courseId")
    const userView = searchParams.get("userView")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const whereClause: any = {
      deletedAt: null,
      employee: {
        deletedAt: null
      },
      course: {
        deletedAt: null
      }
    }

    // If userView=true, filter by current user's employee ID
    if (userView === "true") {
      const employee = await prisma.employee.findFirst({
        where: {
          id: session.user.employeeId,
          deletedAt: null
        }
      })
      
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      }
      
      whereClause.employeeId = employee.id
    } else {
      // Admin view - allow filtering
      if (employeeId && employeeId !== "all") {
        whereClause.employeeId = employeeId
      }
    }

    if (courseId && courseId !== "all") {
      whereClause.courseId = courseId
    }

    // Search filter
    if (search && search.trim()) {
      whereClause.employee = {
        ...whereClause.employee,
        OR: [
          { name: { contains: search.trim() } },
          { idEmp: { contains: search.trim() } },
          { department: { contains: search.trim() } },
          { section: { contains: search.trim() } }
        ]
      }
    }

    // Status filter
    if (status && status !== "all") {
      switch (status) {
        case "completed":
          whereClause.completedAt = { not: null }
          break
        case "in_progress":
          whereClause.completedAt = null
          break
        case "passed":
          whereClause.finalScore = { gte: 80 }
          break
        case "failed":
          whereClause.finalScore = { lt: 60 }
          break
      }
    }

    const scores = await prisma.score.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            section: true,
            department: true,
            company: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { completedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, courseId, preTestScore, postTestScore, finalScore } = body

    // Check if employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        deletedAt: null
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: "ไม่พบพนักงานที่เลือก" },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "ไม่พบหลักสูตรที่เลือก" },
        { status: 400 }
      )
    }

    // Create or update score
    const score = await prisma.score.upsert({
      where: {
        employeeId_courseId: {
          employeeId,
          courseId
        }
      },
      update: {
        preTestScore: preTestScore !== undefined ? preTestScore : undefined,
        postTestScore: postTestScore !== undefined ? postTestScore : undefined,
        finalScore: finalScore !== undefined ? finalScore : undefined,
        completedAt: finalScore !== undefined && finalScore !== null ? new Date() : undefined
      },
      create: {
        employeeId,
        courseId,
        preTestScore: preTestScore || null,
        postTestScore: postTestScore || null,
        finalScore: finalScore || null,
        completedAt: finalScore !== undefined && finalScore !== null ? new Date() : null
      },
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            section: true,
            department: true,
            company: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(score, { status: 201 })
  } catch (error) {
    console.error("Error creating/updating score:", error)
    return NextResponse.json(
      { error: "Failed to create/update score" },
      { status: 500 }
    )
  }
}