import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        courses: {
          where: {
            deletedAt: null
          },
          orderBy: {
            order: "asc"
          },
          include: {
            tests: {
              where: { deletedAt: null },
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่ม" },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json(
      { error: "Failed to fetch group" },
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
    const { title, description, order, isActive } = body

    if (!title) {
      return NextResponse.json(
        { error: "กรุณาใส่ชื่อกลุ่ม" },
        { status: 400 }
      )
    }

    const group = await prisma.group.update({
      where: {
        id: params.id,
        deletedAt: null
      },
      data: {
        title,
        description: description || null,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error("Error updating group:", error)
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete
    const group = await prisma.group.update({
      where: {
        id: params.id,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: "ลบกลุ่มสำเร็จ" })
  } catch (error) {
    console.error("Error deleting group:", error)
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    )
  }
}