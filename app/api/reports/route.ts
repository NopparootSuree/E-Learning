import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "all"

    // Calculate date filter
    let dateFilter: any = {}
    if (range !== "all") {
      const now = new Date()
      const daysAgo = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365
      }[range] || 30

      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
      dateFilter = {
        createdAt: {
          gte: startDate
        }
      }
    }

    // Total employees
    const totalEmployees = await prisma.employee.count({
      where: { deletedAt: null }
    })

    // Total courses
    const totalCourses = await prisma.course.count({
      where: { deletedAt: null }
    })

    // Total completions
    const totalCompletions = await prisma.score.count({
      where: {
        deletedAt: null,
        completedAt: { not: null },
        ...dateFilter
      }
    })

    // Average score
    const avgScoreResult = await prisma.score.aggregate({
      where: {
        deletedAt: null,
        finalScore: { not: null },
        ...dateFilter
      },
      _avg: {
        finalScore: true
      }
    })
    const averageScore = Math.round(avgScoreResult._avg.finalScore || 0)

    // Completion by department
    const completionByDepartment = await prisma.$queryRaw`
      SELECT 
        e.DEPARTMENT as department,
        COUNT(DISTINCT e.id) as total,
        COUNT(DISTINCT CASE WHEN s.completedAt IS NOT NULL THEN s.employeeId END) as completed
      FROM employees e
      LEFT JOIN scores s ON e.id = s.employeeId AND s.deletedAt IS NULL
      WHERE e.deletedAt IS NULL
      GROUP BY e.DEPARTMENT
      ORDER BY e.DEPARTMENT
    ` as Array<{
      department: string
      total: bigint
      completed: bigint
    }>

    const completionByDepartmentFormatted = completionByDepartment.map(dept => ({
      department: dept.department,
      total: Number(dept.total),
      completed: Number(dept.completed),
      percentage: Number(dept.total) > 0 ? Math.round((Number(dept.completed) / Number(dept.total)) * 100) : 0
    }))

    // Scores by course
    const scoresByCourse = await prisma.$queryRaw`
      SELECT 
        c.title as courseTitle,
        AVG(CAST(s.preTestScore as FLOAT)) as averagePreTest,
        AVG(CAST(s.postTestScore as FLOAT)) as averagePostTest,
        COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completions
      FROM courses c
      LEFT JOIN scores s ON c.id = s.courseId AND s.deletedAt IS NULL
      WHERE c.deletedAt IS NULL
      GROUP BY c.id, c.title
      ORDER BY c.title
    ` as Array<{
      courseTitle: string
      averagePreTest: number | null
      averagePostTest: number | null
      completions: bigint
    }>

    const scoresByCourseFormatted = scoresByCourse.map(course => ({
      courseTitle: course.courseTitle,
      averagePreTest: Math.round(course.averagePreTest || 0),
      averagePostTest: Math.round(course.averagePostTest || 0),
      completions: Number(course.completions)
    }))

    // Top performers
    const topPerformers = await prisma.$queryRaw`
      SELECT 
        e.name as employeeName,
        e.ID_EMP as employeeId,
        e.DEPARTMENT as department,
        AVG(CAST(s.finalScore as FLOAT)) as averageScore,
        COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completedCourses
      FROM employees e
      INNER JOIN scores s ON e.id = s.employeeId AND s.deletedAt IS NULL AND s.finalScore IS NOT NULL
      WHERE e.deletedAt IS NULL
      GROUP BY e.id, e.name, e.ID_EMP, e.DEPARTMENT
      HAVING COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) > 0
      ORDER BY AVG(CAST(s.finalScore as FLOAT)) DESC, COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) DESC
      OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
    ` as Array<{
      employeeName: string
      employeeId: string
      department: string
      averageScore: number
      completedCourses: bigint
    }>

    const topPerformersFormatted = topPerformers.map(performer => ({
      employeeName: performer.employeeName,
      employeeId: performer.employeeId,
      department: performer.department,
      averageScore: Math.round(performer.averageScore),
      completedCourses: Number(performer.completedCourses)
    }))

    // Completion trend (placeholder - simplified for now)
    const completionTrend = [
      { month: "ม.ค.", completions: Math.floor(Math.random() * 50) + 10 },
      { month: "ก.พ.", completions: Math.floor(Math.random() * 50) + 10 },
      { month: "มี.ค.", completions: Math.floor(Math.random() * 50) + 10 },
      { month: "เม.ย.", completions: Math.floor(Math.random() * 50) + 10 },
      { month: "พ.ค.", completions: Math.floor(Math.random() * 50) + 10 },
      { month: "มิ.ย.", completions: Math.floor(Math.random() * 50) + 10 },
    ]

    const reportData = {
      totalEmployees,
      totalCourses,
      totalCompletions,
      averageScore,
      completionByDepartment: completionByDepartmentFormatted,
      scoresByCourse: scoresByCourseFormatted,
      completionTrend,
      topPerformers: topPerformersFormatted
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}