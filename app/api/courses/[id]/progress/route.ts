import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/app/generated/prisma"
import { requireCourseAccess } from "@/lib/course-access"

const prisma = new PrismaClient()

// Progress update queue to prevent race conditions
const progressQueue = new Map<string, Promise<any>>()

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

    // ตรวจสอบสิทธิ์การเข้าถึงหลักสูตร (ยกเว้น admin)
    if (session.user.role !== 'admin') {
      try {
        await requireCourseAccess(employee.id, params.id, session.user.role)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้" },
          { status: 403 }
        )
      }
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

    // Enhanced validation
    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const validActions = ["start_content", "update_progress", "pause_video", "complete_content", "complete_course"]
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (action === "update_progress" || action === "pause_video" || action === "complete_content") {
      if (typeof currentTime !== 'number' || currentTime < 0) {
        return NextResponse.json({ error: "Valid currentTime is required" }, { status: 400 })
      }
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return NextResponse.json({ error: "Progress must be between 0 and 100" }, { status: 400 })
      }
    }
    

    // Create unique key for progress queue
    const queueKey = `${employee.id}-${params.id}`
    
    // Wait for any pending progress updates for this user/course combination
    if (progressQueue.has(queueKey)) {
      await progressQueue.get(queueKey)
    }

    // Create new promise for this update
    const updatePromise = (async () => {
      try {
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

        // Validate progress values
        const validatedProgress = Math.min(Math.max(progress || 0, 0), 100)
        const validatedCurrentTime = (typeof currentTime === 'number' && currentTime >= 0) 
          ? Math.floor(currentTime * 1000) : null

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
            // Only update progress if it's increasing or first time
            if (validatedProgress >= (courseAttempt.contentProgress || 0)) {
              updateData.contentProgress = validatedProgress
            }
            
            // Store current video position
            if (validatedCurrentTime !== null) {
              updateData.contentDuration = validatedCurrentTime
            }
            
            // Check if video is actually completed (watched 95% or more)
            if (validatedProgress >= 95 || isCompleted) {
              updateData.contentCompletedAt = new Date()
              updateData.contentProgress = 100
              updateData.status = "content_viewed"
            }
            break
            
          case "pause_video":
            // Save current position when paused
            if (validatedCurrentTime !== null) {
              updateData.contentDuration = validatedCurrentTime
            }
            break
            
          case "complete_content":
            updateData.contentCompletedAt = new Date()
            updateData.contentProgress = 100
            updateData.status = "content_viewed"
            if (validatedCurrentTime !== null) {
              updateData.contentDuration = validatedCurrentTime
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
        
        return updatedAttempt
      } catch (error) {
        console.error("Database error updating course progress:", error)
        throw new Error("Failed to update course progress")
      } finally {
        // Remove from queue when done
        progressQueue.delete(queueKey)
      }
    })()

    // Add to queue
    progressQueue.set(queueKey, updatePromise)
    
    // Wait for completion
    const updatedAttempt = await updatePromise

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

    // ตรวจสอบสิทธิ์การเข้าถึงหลักสูตร (ยกเว้น admin)
    if (session.user.role !== 'admin') {
      try {
        await requireCourseAccess(employee.id, params.id, session.user.role)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้" },
          { status: 403 }
        )
      }
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