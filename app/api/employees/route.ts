import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idEmp, name, section, department, company } = body

    // Check if employee ID already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        idEmp,
        deletedAt: null
      }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: "รหัสพนักงานนี้มีอยู่ในระบบแล้ว" },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        idEmp,
        name,
        section,
        department,
        company
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    )
  }
}