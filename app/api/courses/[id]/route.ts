import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const { title, description, contentType, contentUrl, videoSource, videoFile, isActive } = body

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
    if (contentType && !["video", "powerpoint"].includes(contentType)) {
      return NextResponse.json(
        { error: "ประเภทเนื้อหาไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Validate content based on type
    if (contentType === "video") {
      // For video, require videoFile (uploaded file)
      if (videoFile === "" || (videoFile === undefined && !existingCourse.videoFile)) {
        return NextResponse.json(
          { error: "กรุณาอัปโหลดไฟล์วิดีโอ" },
          { status: 400 }
        )
      }
    } else if (contentType === "powerpoint") {
      // For PowerPoint, require URL
      if (contentUrl && !contentUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "URL PowerPoint ไม่ถูกต้อง" },
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
    if (videoSource !== undefined) updateData.videoSource = videoSource
    if (videoFile !== undefined) updateData.videoFile = videoFile
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