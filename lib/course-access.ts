import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

/**
 * ตรวจสอบว่าพนักงานมีสิทธิ์เข้าถึงหลักสูตรหรือไม่
 */
export async function checkCourseAccess(employeeId: string, courseId: string): Promise<boolean> {
  try {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        employeeId,
        courseId,
        status: 'active',
        deletedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    return !!enrollment
  } catch (error) {
    console.error("Error checking course access:", error)
    return false
  }
}

/**
 * รับรายการหลักสูตรที่พนักงานมีสิทธิ์เข้าถึง
 */
export async function getAccessibleCourses(employeeId: string) {
  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        employeeId,
        status: 'active',
        deletedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        course: {
          where: {
            deletedAt: null,
            isActive: true
          },
          include: {
            group: {
              select: {
                id: true,
                title: true,
                description: true,
                order: true
              }
            }
          }
        }
      }
    })

    return enrollments
      .map(enrollment => enrollment.course)
      .filter(course => course !== null)
      .sort((a, b) => {
        // Sort by group order, then course order, then creation date
        if (a.group?.order !== b.group?.order) {
          return (a.group?.order || 0) - (b.group?.order || 0)
        }
        if (a.order !== b.order) {
          return a.order - b.order
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  } catch (error) {
    console.error("Error getting accessible courses:", error)
    return []
  }
}

/**
 * ตรวจสอบสิทธิ์และ redirect หากไม่มีสิทธิ์
 */
export async function requireCourseAccess(employeeId: string, courseId: string, userRole?: string) {
  // Admin มีสิทธิ์เข้าถึงทุกหลักสูตร
  if (userRole === 'admin') {
    return true
  }

  // ตรวจสอบสิทธิ์ปกติสำหรับ user
  const hasAccess = await checkCourseAccess(employeeId, courseId)
  
  if (!hasAccess) {
    throw new Error("คุณไม่มีสิทธิ์เข้าถึงหลักสูตรนี้ กรุณาติดต่อผู้ดูแลระบบ")
  }

  return true
}