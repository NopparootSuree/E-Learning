import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { direction } = body

    if (!["up", "down"].includes(direction)) {
      return NextResponse.json(
        { error: "Direction must be 'up' or 'down'" },
        { status: 400 }
      )
    }

    // Get the current question
    const currentQuestion = await prisma.question.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!currentQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Get the target question to swap with
    const targetOrder = direction === "up" 
      ? currentQuestion.order - 1 
      : currentQuestion.order + 1

    const targetQuestion = await prisma.question.findFirst({
      where: {
        testId: currentQuestion.testId,
        order: targetOrder,
        deletedAt: null
      }
    })

    if (!targetQuestion) {
      return NextResponse.json(
        { error: "Cannot move question in that direction" },
        { status: 400 }
      )
    }

    // Swap the orders
    await prisma.$transaction([
      // Temporarily set current question to a unique order to avoid conflicts
      prisma.question.update({
        where: { id: currentQuestion.id },
        data: { order: -1 }
      }),
      // Update target question to current question's order
      prisma.question.update({
        where: { id: targetQuestion.id },
        data: { order: currentQuestion.order }
      }),
      // Update current question to target question's order
      prisma.question.update({
        where: { id: currentQuestion.id },
        data: { order: targetQuestion.order }
      })
    ])

    return NextResponse.json({ message: "Question moved successfully" })
  } catch (error) {
    console.error("Error moving question:", error)
    return NextResponse.json(
      { error: "Failed to move question" },
      { status: 500 }
    )
  }
}