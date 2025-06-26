import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      where: {
        deletedAt: null
      },
      include: {
        course: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Filter out tests where course is soft deleted
    const filteredTests = tests.filter(test => test.course && !test.course.deletedAt)

    return NextResponse.json(filteredTests)
  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, type, title, description, isActive = true } = body

    // Validate test type
    if (!["pretest", "posttest"].includes(type)) {
      return NextResponse.json(
        { error: "ประเภทแบบทดสอบไม่ถูกต้อง" },
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

    // Check if test type already exists for this course
    const existingTest = await prisma.test.findFirst({
      where: {
        courseId,
        type,
        deletedAt: null
      }
    })

    if (existingTest) {
      return NextResponse.json(
        { error: `หลักสูตรนี้มี${type === "pretest" ? "แบบทดสอบก่อนเรียน" : "แบบทดสอบหลังเรียน"}อยู่แล้ว` },
        { status: 400 }
      )
    }

    const test = await prisma.test.create({
      data: {
        courseId,
        type,
        title,
        description: description || null,
        isActive
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error("Error creating test:", error)
    return NextResponse.json(
      { error: "Failed to create test" },
      { status: 500 }
    )
  }
}