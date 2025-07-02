import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      where: {
        deletedAt: null,
        isActive: true
      },
      include: {
        courses: {
          where: {
            deletedAt: null,
            isActive: true
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
      },
      orderBy: {
        order: "asc"
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, order = 0, isActive = true } = body

    if (!title) {
      return NextResponse.json(
        { error: "กรุณาใส่ชื่อกลุ่ม" },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        title,
        description: description || null,
        order,
        isActive
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    )
  }
}