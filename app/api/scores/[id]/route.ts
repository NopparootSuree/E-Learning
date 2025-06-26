import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const score = await prisma.score.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            section: true,
            department: true,
            company: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!score) {
      return NextResponse.json(
        { error: "Score not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(score)
  } catch (error) {
    console.error("Error fetching score:", error)
    return NextResponse.json(
      { error: "Failed to fetch score" },
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
    const { preTestScore, postTestScore, finalScore } = body

    // Check if score exists
    const existingScore = await prisma.score.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingScore) {
      return NextResponse.json(
        { error: "Score not found" },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: any = {}
    if (preTestScore !== undefined) updateData.preTestScore = preTestScore
    if (postTestScore !== undefined) updateData.postTestScore = postTestScore
    if (finalScore !== undefined) {
      updateData.finalScore = finalScore
      if (finalScore !== null) {
        updateData.completedAt = new Date()
      }
    }

    const score = await prisma.score.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            section: true,
            department: true,
            company: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(score)
  } catch (error) {
    console.error("Error updating score:", error)
    return NextResponse.json(
      { error: "Failed to update score" },
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
    const score = await prisma.score.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: "Score deleted successfully" })
  } catch (error) {
    console.error("Error deleting score:", error)
    return NextResponse.json(
      { error: "Failed to delete score" },
      { status: 500 }
    )
  }
}