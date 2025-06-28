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

    let body
    try {
      const text = await request.text()
      body = JSON.parse(text)
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    
    const { 
      action, 
      progress, 
      duration, 
      currentTime,
      watchedDuration = 0,
      lastActiveTime = new Date(),
      isCompleted = false,
      watchedSegments = []
    } = body
    

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
        // Store current video position and watched duration
        updateData.contentProgress = Math.min(Math.max(progress || 0, 0), 100)
        
        // Store currentTime as milliseconds to preserve precision
        if (typeof currentTime === 'number' && currentTime >= 0) {
          updateData.contentDuration = Math.floor(currentTime * 1000) // Store as milliseconds
        }
        
        
        // Check if video is actually completed (watched 95% or more)
        if (progress >= 95 || isCompleted) {
          updateData.contentCompletedAt = new Date()
          updateData.contentProgress = 100
          updateData.status = "content_viewed"
        }
        break
        
      case "pause_video":
        // Save current position when paused
        if (typeof currentTime === 'number' && currentTime >= 0) {
          updateData.contentDuration = Math.floor(currentTime * 1000)
        }
        break
        
      case "complete_content":
        updateData.contentCompletedAt = new Date()
        updateData.contentProgress = 100
        updateData.status = "content_viewed"
        if (typeof currentTime === 'number' && currentTime >= 0) {
          updateData.contentDuration = Math.floor(currentTime * 1000)
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

    const resumeTime = courseAttempt?.contentDuration ? (courseAttempt.contentDuration / 1000) : 0 // Convert back to seconds

    return NextResponse.json({
      attempt: courseAttempt,
      hasStartedContent: !!courseAttempt?.contentStartedAt,
      hasCompletedContent: !!courseAttempt?.contentCompletedAt,
      contentProgress: courseAttempt?.contentProgress || 0,
      currentTime: resumeTime, // Resume position in seconds
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