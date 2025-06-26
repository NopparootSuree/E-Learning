import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: session.user.employeeId,
        deletedAt: null
      }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const body = await request.json()
    const { action, progress, duration } = body

    // Find or create course attempt
    let courseAttempt = await prisma.courseAttempt.findFirst({
      where: {
        employeeId: employee.id,
        courseId: params.id,
        deletedAt: null
      }
    })

    if (!courseAttempt) {
      courseAttempt = await prisma.courseAttempt.create({
        data: {
          employeeId: employee.id,
          courseId: params.id,
          status: "in_progress"
        }
      })
    }

    // Update progress based on action
    const updateData: any = {
      updatedAt: new Date()
    }

    switch (action) {
      case "start_content":
        updateData.contentStartedAt = new Date()
        updateData.status = "content_viewing"
        break
        
      case "update_progress":
        updateData.contentProgress = Math.min(Math.max(progress || 0, 0), 100)
        if (duration) {
          updateData.contentDuration = duration
        }
        break
        
      case "complete_content":
        updateData.contentCompletedAt = new Date()
        updateData.contentProgress = 100
        updateData.status = "content_viewed"
        if (duration) {
          updateData.contentDuration = duration
        }
        break
        
      case "complete_course":
        updateData.completedAt = new Date()
        updateData.status = "completed"
        break
    }

    const updatedAttempt = await prisma.courseAttempt.update({
      where: { id: courseAttempt.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt
    })

  } catch (error) {
    console.error("Error updating course progress:", error)
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: session.user.employeeId,
        deletedAt: null
      }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const courseAttempt = await prisma.courseAttempt.findFirst({
      where: {
        employeeId: employee.id,
        courseId: params.id,
        deletedAt: null
      }
    })

    return NextResponse.json({
      attempt: courseAttempt,
      hasStartedContent: !!courseAttempt?.contentStartedAt,
      hasCompletedContent: !!courseAttempt?.contentCompletedAt,
      contentProgress: courseAttempt?.contentProgress || 0,
      status: courseAttempt?.status || "not_started"
    })

  } catch (error) {
    console.error("Error fetching course progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    )
  }
}