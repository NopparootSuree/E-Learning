import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const test = await prisma.test.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        course: true,
        questions: {
          where: {
            deletedAt: null
          },
          orderBy: {
            order: "asc"
          }
        }
      }
    })

    if (!test || !test.course || test.course.deletedAt) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(test)
  } catch (error) {
    console.error("Error fetching test:", error)
    return NextResponse.json(
      { error: "Failed to fetch test" },
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
    const { courseId, type, title, description, isActive } = body

    // Check if test exists
    const existingTest = await prisma.test.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingTest) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      )
    }

    // Validate test type if provided
    if (type && !["pretest", "posttest"].includes(type)) {
      return NextResponse.json(
        { error: "ประเภทแบบทดสอบไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Check if course exists if courseId is provided
    if (courseId) {
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
    }

    // Check for duplicate test type if courseId or type is being changed
    if ((courseId && courseId !== existingTest.courseId) || (type && type !== existingTest.type)) {
      const duplicateTest = await prisma.test.findFirst({
        where: {
          courseId: courseId || existingTest.courseId,
          type: type || existingTest.type,
          deletedAt: null,
          id: { not: params.id }
        }
      })

      if (duplicateTest) {
        return NextResponse.json(
          { error: `หลักสูตรนี้มี${(type || existingTest.type) === "pretest" ? "แบบทดสอบก่อนเรียน" : "แบบทดสอบหลังเรียน"}อยู่แล้ว` },
          { status: 400 }
        )
      }
    }

    // Build update data object
    const updateData: any = {}
    if (courseId !== undefined) updateData.courseId = courseId
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description || null
    if (isActive !== undefined) updateData.isActive = isActive

    const test = await prisma.test.update({
      where: { id: params.id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(test)
  } catch (error) {
    console.error("Error updating test:", error)
    return NextResponse.json(
      { error: "Failed to update test" },
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
    const test = await prisma.test.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: "Test deleted successfully" })
  } catch (error) {
    console.error("Error deleting test:", error)
    return NextResponse.json(
      { error: "Failed to delete test" },
      { status: 500 }
    )
  }
}