import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/app/generated/prisma"
import { buildWhereClause, buildOrderBy, getPaginationParams, parseQueryString } from "@/lib/filters"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = parseQueryString(searchParams.toString())

    // Build base where clause
    const where: any = {
      deletedAt: null
    }

    // Role-based filtering
    if (session.user.role !== 'admin' && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (filters.employeeId) {
      where.employeeId = filters.employeeId
    }

    // Course filtering
    if (filters.courseId) {
      where.courseId = filters.courseId
    }

    // Score range filtering
    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      where.finalScore = {}
      if (filters.minScore !== undefined) {
        where.finalScore.gte = filters.minScore
      }
      if (filters.maxScore !== undefined) {
        where.finalScore.lte = filters.maxScore
      }
    }

    // Status filtering
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'completed':
          where.completedAt = { not: null }
          break
        case 'in_progress':
          where.completedAt = null
          break
        case 'passed':
          where.finalScore = { gte: 70 }
          break
        case 'failed':
          where.AND = [
            { finalScore: { not: null } },
            { finalScore: { lt: 70 } }
          ]
          break
      }
    }

    // Search by employee name
    if (filters.search) {
      where.employee = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { idEmp: { contains: filters.search, mode: 'insensitive' } }
        ]
      }
    }

    // Date range filtering
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder)
    const { page, limit, skip } = getPaginationParams(filters)

    // Get total count
    const total = await prisma.score.count({ where })

    // Get scores with filtering
    const scores = await prisma.score.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            department: true,
            company: true,
            section: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: filters.sortBy ? orderBy : { createdAt: "desc" },
      skip,
      take: limit
    })

    // Calculate statistics
    const stats = {
      averageScore: 0,
      passRate: 0,
      completionRate: 0
    }

    if (scores.length > 0) {
      const completedScores = scores.filter(s => s.finalScore !== null)
      const passedScores = completedScores.filter(s => s.finalScore !== null && s.finalScore >= 70)
      
      stats.averageScore = completedScores.length > 0 
        ? completedScores.reduce((sum, s) => sum + (s.finalScore || 0), 0) / completedScores.length
        : 0
      
      stats.passRate = completedScores.length > 0 
        ? (passedScores.length / completedScores.length) * 100
        : 0
        
      stats.completionRate = scores.length > 0 
        ? (completedScores.length / scores.length) * 100
        : 0
    }

    return NextResponse.json({
      data: scores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats,
      filters: filters
    })

  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    )
  }
}