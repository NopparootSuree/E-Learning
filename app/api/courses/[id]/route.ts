import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { requireCourseAccess } from "@/lib/course-access"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // ตรวจสอบว่าเป็น user และต้องมีสิทธิ์เข้าถึง
    if (session?.user?.employeeId && session.user.role !== 'admin') {
      try {
        await requireCourseAccess(session.user.employeeId, params.id, session.user.role)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้" },
          { status: 403 }
        )
      }
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        tests: {
          where: {
            deletedAt: null
          },
          orderBy: {
            type: "asc"
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error("Error fetching course:", error)
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, contentType, contentUrl, contentSource, contentFile, isActive } = body

    // Check if course exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    // Validate content type if provided
    if (contentType && !["video", "pdf"].includes(contentType)) {
      return NextResponse.json(
        { error: "ประเภทเนื้อหาไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Validate content based on source
    if (contentSource === "upload") {
      // For upload, require contentFile
      if (contentFile === "" || (contentFile === undefined && !existingCourse.contentFile)) {
        return NextResponse.json(
          { error: "กรุณาอัปโหลดไฟล์" },
          { status: 400 }
        )
      }
    } else if (contentSource === "url") {
      // For URL, require contentUrl
      if (contentUrl && !contentUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "URL ไม่ถูกต้อง" },
          { status: 400 }
        )
      }
    }

    // Build update data object
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description || null
    if (contentType !== undefined) updateData.contentType = contentType
    if (contentUrl !== undefined) updateData.contentUrl = contentUrl
    if (contentSource !== undefined) updateData.contentSource = contentSource
    if (contentFile !== undefined) updateData.contentFile = contentFile
    if (isActive !== undefined) updateData.isActive = isActive

    const course = await prisma.course.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by setting deletedAt timestamp
    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    )
  }
}