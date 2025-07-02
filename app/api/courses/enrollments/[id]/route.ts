import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

// DELETE - ลบการลงทะเบียน (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ตรวจสอบสิทธิ์ admin
    const adminEmployee = await prisma.employee.findFirst({
      where: {
        id: session.user.employeeId,
        deletedAt: null
      },
      include: {
        user: {
          select: { role: true }
        }
      }
    })

    if (!adminEmployee || adminEmployee.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // ตรวจสอบว่า enrollment มีอยู่จริง
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "ไม่พบการลงทะเบียนนี้" },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.courseEnrollment.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        status: "inactive"
      }
    })

    return NextResponse.json({
      success: true,
      message: "ยกเลิกการลงทะเบียนเรียนเรียบร้อยแล้ว"
    })

  } catch (error) {
    console.error("Error deleting enrollment:", error)
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    )
  }
}

// PUT - อัพเดทสถานะการลงทะเบียน
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ตรวจสอบสิทธิ์ admin
    const adminEmployee = await prisma.employee.findFirst({
      where: {
        id: session.user.employeeId,
        deletedAt: null
      },
      include: {
        user: {
          select: { role: true }
        }
      }
    })

    if (!adminEmployee || adminEmployee.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { status, expiresAt } = body

    if (!status || !["active", "inactive", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "status ต้องเป็น active, inactive, หรือ completed" },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า enrollment มีอยู่จริง
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "ไม่พบการลงทะเบียนนี้" },
        { status: 404 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    if (status === "completed") {
      updateData.completedAt = new Date()
    }

    const updatedEnrollment = await prisma.courseEnrollment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          select: {
            idEmp: true,
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      enrollment: updatedEnrollment,
      message: "อัพเดทสถานะการลงทะเบียนเรียบร้อยแล้ว"
    })

  } catch (error) {
    console.error("Error updating enrollment:", error)
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    )
  }
}