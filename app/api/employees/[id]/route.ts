import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json(
      { error: "Failed to fetch employee" },
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
    const { idEmp, name, section, department, company } = body

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      )
    }

    // Check if new employee ID already exists (exclude current employee)
    if (idEmp !== existingEmployee.idEmp) {
      const duplicateEmployee = await prisma.employee.findFirst({
        where: {
          idEmp,
          deletedAt: null,
          id: { not: params.id }
        }
      })

      if (duplicateEmployee) {
        return NextResponse.json(
          { error: "รหัสพนักงานนี้มีอยู่ในระบบแล้ว" },
          { status: 400 }
        )
      }
    }

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        idEmp,
        name,
        section,
        department,
        company
      }
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json(
      { error: "Failed to update employee" },
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
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: "Employee deleted successfully" })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    )
  }
}