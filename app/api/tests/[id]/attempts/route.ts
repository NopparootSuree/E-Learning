import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: session.user.employeeId,
        deletedAt: null
      }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const attempts = await prisma.testAttempt.findMany({
      where: {
        testId: params.id,
        employeeId: employee.id,
        deletedAt: null
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error("Error fetching test attempts:", error)
    return NextResponse.json(
      { error: "Failed to fetch test attempts" },
      { status: 500 }
    )
  }
}