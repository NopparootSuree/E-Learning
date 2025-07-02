import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
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
    const { idEmp, name, section, department, company, email, password, role } = body

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

    // Check if email already exists (if provided)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "อีเมลนี้มีอยู่ในระบบแล้ว" },
          { status: 400 }
        )
      }
    }

    // Create employee and user account in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create employee first
      const employee = await tx.employee.create({
        data: {
          idEmp,
          name,
          section,
          department,
          company
        }
      })

      // Create user account if email and password provided
      let user = null
      if (email && password) {
        // Simple password hashing (in production, use bcrypt)
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash(password, 10)
        
        user = await tx.user.create({
          data: {
            email,
            name,
            role: role || "user",
            employeeId: employee.id
          }
        })

        // Store hashed password in employee record
        await tx.employee.update({
          where: { id: employee.id },
          data: { password: hashedPassword }
        })
      }

      return { employee, user }
    })

    // Return employee with user data
    const employeeWithUser = await prisma.employee.findUnique({
      where: { id: result.employee.id },
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

    return NextResponse.json(employeeWithUser, { status: 201 })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    )
  }
}