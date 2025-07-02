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
    const { idEmp, name, section, department, company, email, password, role } = body

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        user: true
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

    // Check if email already exists (exclude current user)
    if (email && existingEmployee.user?.email !== email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: existingEmployee.user?.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "อีเมลนี้มีอยู่ในระบบแล้ว" },
          { status: 400 }
        )
      }
    }

    // Update employee and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update employee
      const employee = await tx.employee.update({
        where: { id: params.id },
        data: {
          idEmp,
          name,
          section,
          department,
          company
        }
      })

      // Handle user account
      if (email) {
        let hashedPassword = existingEmployee.password
        
        // Hash new password if provided
        if (password) {
          const bcrypt = require('bcryptjs')
          hashedPassword = await bcrypt.hash(password, 10)
          
          await tx.employee.update({
            where: { id: params.id },
            data: { password: hashedPassword }
          })
        }

        if (existingEmployee.user) {
          // Update existing user
          await tx.user.update({
            where: { id: existingEmployee.user.id },
            data: {
              email,
              name,
              role: role || "user"
            }
          })
        } else {
          // Create new user account
          if (password) {
            await tx.user.create({
              data: {
                email,
                name,
                role: role || "user",
                employeeId: employee.id
              }
            })
          }
        }
      } else if (existingEmployee.user) {
        // Remove user account if email is cleared
        await tx.user.delete({
          where: { id: existingEmployee.user.id }
        })
        
        await tx.employee.update({
          where: { id: params.id },
          data: { password: null }
        })
      }

      return employee
    })

    // Return updated employee with user data
    const updatedEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(updatedEmployee)
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