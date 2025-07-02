import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

// GET - ดูรายการ enrollments ทั้งหมด (สำหรับ admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ตรวจสอบสิทธิ์ admin
    const employee = await prisma.employee.findFirst({
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

    if (!employee || employee.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const employeeId = searchParams.get('employeeId')

    const whereClause: any = {
      deletedAt: null
    }

    if (courseId) whereClause.courseId = courseId
    if (employeeId) whereClause.employeeId = employeeId

    const enrollments = await prisma.courseEnrollment.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            section: true,
            department: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            isActive: true,
            group: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    )
  }
}

// POST - เพิ่มการลงทะเบียนใหม่
export async function POST(request: NextRequest) {
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
    const { employeeIds, courseIds, expiresAt } = body

    if (!employeeIds || !courseIds || !Array.isArray(employeeIds) || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: "employeeIds และ courseIds ต้องเป็น array" },
        { status: 400 }
      )
    }

    const enrollments = []

    // สร้าง enrollment สำหรับทุกคู่ employee-course
    for (const employeeId of employeeIds) {
      for (const courseId of courseIds) {
        try {
          // ตรวจสอบว่ามี enrollment อยู่แล้วหรือไม่
          const existingEnrollment = await prisma.courseEnrollment.findFirst({
            where: {
              employeeId,
              courseId,
              deletedAt: null
            }
          })

          if (existingEnrollment) {
            // อัพเดท enrollment ที่มีอยู่
            const updated = await prisma.courseEnrollment.update({
              where: { id: existingEnrollment.id },
              data: {
                status: "active",
                enrolledBy: adminEmployee.id,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                updatedAt: new Date()
              },
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
            enrollments.push(updated)
          } else {
            // สร้าง enrollment ใหม่
            const created = await prisma.courseEnrollment.create({
              data: {
                employeeId,
                courseId,
                enrolledBy: adminEmployee.id,
                status: "active",
                expiresAt: expiresAt ? new Date(expiresAt) : null
              },
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
            enrollments.push(created)
          }
        } catch (enrollmentError) {
          console.error(`Error enrolling ${employeeId} to ${courseId}:`, enrollmentError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      enrollments,
      message: `ลงทะเบียนเรียนสำเร็จ ${enrollments.length} รายการ`
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating enrollments:", error)
    return NextResponse.json(
      { error: "Failed to create enrollments" },
      { status: 500 }
    )
  }
}