import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        test: {
          include: {
            course: true
          }
        }
      }
    })

    if (!question || !question.test || question.test.deletedAt || !question.test.course || question.test.course.deletedAt) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json(
      { error: "Failed to fetch question" },
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
    const { type, question, options, correctAnswer, points } = body

    // Check if question exists
    const existingQuestion = await prisma.question.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Validate question type if provided
    if (type && !["multiple_choice", "written"].includes(type)) {
      return NextResponse.json(
        { error: "ประเภทคำถามไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Validate multiple choice questions
    if ((type || existingQuestion.type) === "multiple_choice") {
      if (options !== undefined || correctAnswer !== undefined) {
        const finalOptions = options !== undefined ? options : existingQuestion.options
        const finalCorrectAnswer = correctAnswer !== undefined ? correctAnswer : existingQuestion.correctAnswer

        if (!finalOptions || !finalCorrectAnswer) {
          return NextResponse.json(
            { error: "คำถามแบบเลือกตอบต้องมีตัวเลือกและคำตอบที่ถูกต้อง" },
            { status: 400 }
          )
        }

        // Parse and validate options
        let parsedOptions: string[]
        try {
          parsedOptions = typeof finalOptions === "string" ? JSON.parse(finalOptions) : finalOptions
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
        if (!parsedOptions.includes(finalCorrectAnswer)) {
          return NextResponse.json(
            { error: "คำตอบที่ถูกต้องต้องเป็นหนึ่งในตัวเลือก" },
            { status: 400 }
          )
        }
      }
    }

    // Build update data object
    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (question !== undefined) updateData.question = question
    if (options !== undefined) {
      updateData.options = (type || existingQuestion.type) === "multiple_choice" 
        ? (typeof options === "string" ? options : JSON.stringify(options))
        : null
    }
    if (correctAnswer !== undefined) {
      updateData.correctAnswer = (type || existingQuestion.type) === "multiple_choice" ? correctAnswer : null
    }
    if (points !== undefined) updateData.points = points

    const updatedQuestion = await prisma.question.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get question info before deletion for order adjustment
    const question = await prisma.question.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Soft delete by setting deletedAt timestamp
    await prisma.question.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    // Reorder remaining questions
    await prisma.question.updateMany({
      where: {
        testId: question.testId,
        order: { gt: question.order },
        deletedAt: null
      },
      data: {
        order: { decrement: 1 }
      }
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    )
  }
}