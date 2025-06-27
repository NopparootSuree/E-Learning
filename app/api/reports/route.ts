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

    // Total groups
    const totalGroups = await prisma.group.count({
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
        COUNT(DISTINCT e.ID) as total,
        COUNT(DISTINCT CASE WHEN s.COMPLETED_AT IS NOT NULL THEN s.EMPLOYEE_ID END) as completed
      FROM EL_EMPLOYEES e
      LEFT JOIN EL_SCORES s ON e.ID = s.EMPLOYEE_ID AND s.DELETED_AT IS NULL
      WHERE e.DELETED_AT IS NULL
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

    // Scores by course and group
    const scoresByCourse = await prisma.$queryRaw`
      SELECT 
        c.TITLE as courseTitle,
        ISNULL(g.TITLE, 'ไม่ระบุกลุ่ม') as groupTitle,
        AVG(CAST(s.PRE_TEST_SCORE as FLOAT)) as averagePreTest,
        AVG(CAST(s.POST_TEST_SCORE as FLOAT)) as averagePostTest,
        COUNT(CASE WHEN s.COMPLETED_AT IS NOT NULL THEN 1 END) as completions
      FROM EL_COURSES c
      LEFT JOIN EL_GROUPS g ON c.GROUP_ID = g.ID AND g.DELETED_AT IS NULL
      LEFT JOIN EL_SCORES s ON c.ID = s.COURSE_ID AND s.DELETED_AT IS NULL
      WHERE c.DELETED_AT IS NULL
      GROUP BY c.ID, c.TITLE, g.TITLE
      ORDER BY g.TITLE, c.TITLE
    ` as Array<{
      courseTitle: string
      groupTitle: string
      averagePreTest: number | null
      averagePostTest: number | null
      completions: bigint
    }>

    const scoresByCourseFormatted = scoresByCourse.map(course => ({
      courseTitle: course.courseTitle,
      groupTitle: course.groupTitle,
      averagePreTest: Math.round(course.averagePreTest || 0),
      averagePostTest: Math.round(course.averagePostTest || 0),
      completions: Number(course.completions)
    }))

    // Completion by group
    const completionByGroup = await prisma.$queryRaw`
      SELECT 
        ISNULL(g.TITLE, 'ไม่ระบุกลุ่ม') as groupTitle,
        COUNT(DISTINCT c.ID) as totalCourses,
        COUNT(DISTINCT CASE WHEN s.COMPLETED_AT IS NOT NULL THEN s.COURSE_ID END) as completedCourses
      FROM EL_COURSES c
      LEFT JOIN EL_GROUPS g ON c.GROUP_ID = g.ID AND g.DELETED_AT IS NULL
      LEFT JOIN EL_SCORES s ON c.ID = s.COURSE_ID AND s.DELETED_AT IS NULL
      WHERE c.DELETED_AT IS NULL
      GROUP BY g.TITLE
      ORDER BY g.TITLE
    ` as Array<{
      groupTitle: string
      totalCourses: bigint
      completedCourses: bigint
    }>

    const completionByGroupFormatted = completionByGroup.map(group => ({
      groupTitle: group.groupTitle,
      totalCourses: Number(group.totalCourses),
      completedCourses: Number(group.completedCourses),
      percentage: Number(group.totalCourses) > 0 ? Math.round((Number(group.completedCourses) / Number(group.totalCourses)) * 100) : 0
    }))

    // Top performers
    const topPerformers = await prisma.$queryRaw`
      SELECT 
        e.NAME as employeeName,
        e.ID_EMP as employeeId,
        e.DEPARTMENT as department,
        AVG(CAST(s.FINAL_SCORE as FLOAT)) as averageScore,
        COUNT(CASE WHEN s.COMPLETED_AT IS NOT NULL THEN 1 END) as completedCourses
      FROM EL_EMPLOYEES e
      INNER JOIN EL_SCORES s ON e.ID = s.EMPLOYEE_ID AND s.DELETED_AT IS NULL AND s.FINAL_SCORE IS NOT NULL
      WHERE e.DELETED_AT IS NULL
      GROUP BY e.ID, e.NAME, e.ID_EMP, e.DEPARTMENT
      HAVING COUNT(CASE WHEN s.COMPLETED_AT IS NOT NULL THEN 1 END) > 0
      ORDER BY AVG(CAST(s.FINAL_SCORE as FLOAT)) DESC, COUNT(CASE WHEN s.COMPLETED_AT IS NOT NULL THEN 1 END) DESC
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
      totalGroups,
      totalCompletions,
      averageScore,
      completionByDepartment: completionByDepartmentFormatted,
      completionByGroup: completionByGroupFormatted,
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