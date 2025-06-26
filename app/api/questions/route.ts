import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get("testId")

    const whereClause: any = {
      deletedAt: null
    }

    if (testId) {
      whereClause.testId = testId
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        test: {
          include: {
            course: true
          }
        }
      },
      orderBy: [
        { testId: "asc" },
        { order: "asc" }
      ]
    })

    // Filter out questions where test or test.course is soft deleted
    const filteredQuestions = questions.filter(question => 
      question.test && 
      !question.test.deletedAt &&
      question.test.course && 
      !question.test.course.deletedAt
    )

    return NextResponse.json(filteredQuestions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testId, type, question, options, correctAnswer, points, order } = body

    // Validate question type
    if (!["multiple_choice", "written"].includes(type)) {
      return NextResponse.json(
        { error: "ประเภทคำถามไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Check if test exists
    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        deletedAt: null
      }
    })

    if (!test) {
      return NextResponse.json(
        { error: "ไม่พบแบบทดสอบที่เลือก" },
        { status: 400 }
      )
    }

    // Validate multiple choice questions
    if (type === "multiple_choice") {
      if (!options || !correctAnswer) {
        return NextResponse.json(
          { error: "คำถามแบบเลือกตอบต้องมีตัวเลือกและคำตอบที่ถูกต้อง" },
          { status: 400 }
        )
      }

      // Parse and validate options
      let parsedOptions: string[]
      try {
        parsedOptions = typeof options === "string" ? JSON.parse(options) : options
      } catch {
        return NextResponse.json(
          { error: "รูปแบบตัวเลือกไม่ถูกต้อง" },
          { status: 400 }
        )
      }

      if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
        return NextResponse.json(
          { error: "ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก" },
          { status: 400 }
        )
      }

      // Check if correct answer is in options
      if (!parsedOptions.includes(correctAnswer)) {
        return NextResponse.json(
          { error: "คำตอบที่ถูกต้องต้องเป็นหนึ่งในตัวเลือก" },
          { status: 400 }
        )
      }
    }

    // Get the next order number if not provided
    let questionOrder = order
    if (!questionOrder) {
      const lastQuestion = await prisma.question.findFirst({
        where: {
          testId,
          deletedAt: null
        },
        orderBy: {
          order: "desc"
        }
      })
      questionOrder = (lastQuestion?.order || 0) + 1
    }

    const newQuestion = await prisma.question.create({
      data: {
        testId,
        type,
        question,
        options: type === "multiple_choice" ? (typeof options === "string" ? options : JSON.stringify(options)) : null,
        correctAnswer: type === "multiple_choice" ? correctAnswer : null,
        points: points || 1,
        order: questionOrder
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            type: true,
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(newQuestion, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    )
  }
}