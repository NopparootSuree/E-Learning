import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

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

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Overall statistics
    const totalEmployees = await prisma.employee.count({
      where: { deletedAt: null }
    })

    const totalCourses = await prisma.course.count({
      where: { deletedAt: null }
    })

    const totalCompletions = await prisma.score.count({
      where: {
        deletedAt: null,
        completedAt: { not: null },
        ...dateFilter
      }
    })

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

    const overallStats = [
      { "สถิติ": "พนักงานทั้งหมด", "จำนวน": totalEmployees, "หน่วย": "คน" },
      { "สถิติ": "หลักสูตรทั้งหมด", "จำนวน": totalCourses, "หน่วย": "หลักสูตร" },
      { "สถิติ": "การเรียนจบทั้งหมด", "จำนวน": totalCompletions, "หน่วย": "ครั้ง" },
      { "สถิติ": "คะแนนเฉลี่ยรวม", "จำนวน": Math.round(avgScoreResult._avg.finalScore || 0), "หน่วย": "%" }
    ]

    const statsSheet = XLSX.utils.json_to_sheet(overallStats)
    XLSX.utils.book_append_sheet(workbook, statsSheet, "สถิติรวม")

    // Completion by department
    const completionByDepartment = await prisma.$queryRaw`
      SELECT 
        e.DEPARTMENT as department,
        COUNT(DISTINCT e.id) as totalEmployees,
        COUNT(DISTINCT CASE WHEN s.completedAt IS NOT NULL THEN s.employeeId END) as completedEmployees,
        AVG(CAST(s.finalScore as FLOAT)) as avgScore,
        COUNT(s.id) as totalEnrollments,
        COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completedEnrollments
      FROM employees e
      LEFT JOIN scores s ON e.id = s.employeeId AND s.deletedAt IS NULL
      WHERE e.deletedAt IS NULL
      GROUP BY e.DEPARTMENT
      ORDER BY e.DEPARTMENT
    ` as Array<{
      department: string
      totalEmployees: bigint
      completedEmployees: bigint
      avgScore: number | null
      totalEnrollments: bigint
      completedEnrollments: bigint
    }>

    const deptData = completionByDepartment.map(dept => ({
      "ฝ่าย": dept.department,
      "พนักงานทั้งหมด": Number(dept.totalEmployees),
      "พนักงานที่เสร็จ": Number(dept.completedEmployees),
      "เปอร์เซ็นต์พนักงานที่เสร็จ": Number(dept.totalEmployees) > 0 
        ? `${Math.round((Number(dept.completedEmployees) / Number(dept.totalEmployees)) * 100)}%`
        : "0%",
      "การลงทะเบียนทั้งหมด": Number(dept.totalEnrollments),
      "การเรียนจบทั้งหมด": Number(dept.completedEnrollments),
      "เปอร์เซ็นต์การเรียนจب": Number(dept.totalEnrollments) > 0 
        ? `${Math.round((Number(dept.completedEnrollments) / Number(dept.totalEnrollments)) * 100)}%`
        : "0%",
      "คะแนนเฉลี่ย": dept.avgScore !== null ? `${Math.round(dept.avgScore)}%` : "-"
    }))

    const deptSheet = XLSX.utils.json_to_sheet(deptData)
    XLSX.utils.book_append_sheet(workbook, deptSheet, "สถิติตามฝ่าย")

    // Course performance
    const coursePerformance = await prisma.$queryRaw`
      SELECT 
        c.title as courseTitle,
        COUNT(s.id) as totalAttempts,
        COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completions,
        AVG(CAST(s.preTestScore as FLOAT)) as avgPreTest,
        AVG(CAST(s.postTestScore as FLOAT)) as avgPostTest,
        AVG(CAST(s.finalScore as FLOAT)) as avgFinalScore,
        MIN(CAST(s.finalScore as FLOAT)) as minScore,
        MAX(CAST(s.finalScore as FLOAT)) as maxScore
      FROM courses c
      LEFT JOIN scores s ON c.id = s.courseId AND s.deletedAt IS NULL
      WHERE c.deletedAt IS NULL
      GROUP BY c.id, c.title
      ORDER BY AVG(CAST(s.finalScore as FLOAT)) DESC
    ` as Array<{
      courseTitle: string
      totalAttempts: bigint
      completions: bigint
      avgPreTest: number | null
      avgPostTest: number | null
      avgFinalScore: number | null
      minScore: number | null
      maxScore: number | null
    }>

    const courseData = coursePerformance.map(course => ({
      "หลักสูตร": course.courseTitle,
      "จำนวนผู้เรียน": Number(course.totalAttempts),
      "จำนวนผู้เสร็จ": Number(course.completions),
      "เปอร์เซ็นต์เสร็จ": Number(course.totalAttempts) > 0 
        ? `${Math.round((Number(course.completions) / Number(course.totalAttempts)) * 100)}%`
        : "0%",
      "คะแนนเฉลี่ย Pre-test": course.avgPreTest !== null ? `${Math.round(course.avgPreTest)}%` : "-",
      "คะแนนเฉลี่ย Post-test": course.avgPostTest !== null ? `${Math.round(course.avgPostTest)}%` : "-",
      "คะแนนเฉลี่ยรวม": course.avgFinalScore !== null ? `${Math.round(course.avgFinalScore)}%` : "-",
      "คะแนนต่ำสุด": course.minScore !== null ? `${Math.round(course.minScore)}%` : "-",
      "คะแนนสูงสุด": course.maxScore !== null ? `${Math.round(course.maxScore)}%` : "-"
    }))

    const courseSheet = XLSX.utils.json_to_sheet(courseData)
    XLSX.utils.book_append_sheet(workbook, courseSheet, "ประสิทธิภาพหลักสูตร")

    // Top performers
    const topPerformers = await prisma.$queryRaw`
      SELECT 
        e.name as employeeName,
        e.ID_EMP as employeeId,
        e.DEPARTMENT as department,
        e.SECTION as section,
        AVG(CAST(s.finalScore as FLOAT)) as averageScore,
        COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completedCourses,
        COUNT(s.id) as totalCourses
      FROM employees e
      INNER JOIN scores s ON e.id = s.employeeId AND s.deletedAt IS NULL AND s.finalScore IS NOT NULL
      WHERE e.deletedAt IS NULL
      GROUP BY e.id, e.name, e.ID_EMP, e.DEPARTMENT, e.SECTION
      HAVING COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) > 0
      ORDER BY AVG(CAST(s.finalScore as FLOAT)) DESC, COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) DESC
      OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
    ` as Array<{
      employeeName: string
      employeeId: string
      department: string
      section: string
      averageScore: number
      completedCourses: bigint
      totalCourses: bigint
    }>

    const performerData = topPerformers.map((performer, index) => ({
      "อันดับ": index + 1,
      "รหัสพนักงาน": performer.employeeId,
      "ชื่อ-นามสกุล": performer.employeeName,
      "แผนก": performer.section,
      "ฝ่าย": performer.department,
      "คะแนนเฉลี่ย": `${Math.round(performer.averageScore)}%`,
      "หลักสูตรที่เสร็จ": Number(performer.completedCourses),
      "หลักสูตรทั้งหมด": Number(performer.totalCourses),
      "เปอร์เซ็นต์เสร็จ": Number(performer.totalCourses) > 0 
        ? `${Math.round((Number(performer.completedCourses) / Number(performer.totalCourses)) * 100)}%`
        : "0%"
    }))

    const performerSheet = XLSX.utils.json_to_sheet(performerData)
    XLSX.utils.book_append_sheet(workbook, performerSheet, "ผู้เรียนดีเด่น")

    // Low performers (need improvement)
    const lowPerformers = await prisma.$queryRaw`
      SELECT 
        e.name as employeeName,
        e.ID_EMP as employeeId,
        e.DEPARTMENT as department,
        e.SECTION as section,
        AVG(CAST(s.finalScore as FLOAT)) as averageScore,
        COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completedCourses,
        COUNT(s.id) as totalCourses
      FROM employees e
      INNER JOIN scores s ON e.id = s.employeeId AND s.deletedAt IS NULL AND s.finalScore IS NOT NULL
      WHERE e.deletedAt IS NULL
      GROUP BY e.id, e.name, e.ID_EMP, e.DEPARTMENT, e.SECTION
      HAVING AVG(CAST(s.finalScore as FLOAT)) < 70 OR 
             (COUNT(s.id) - COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END)) > 0
      ORDER BY AVG(CAST(s.finalScore as FLOAT)) ASC
      OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
    ` as Array<{
      employeeName: string
      employeeId: string
      department: string
      section: string
      averageScore: number
      completedCourses: bigint
      totalCourses: bigint
    }>

    const lowPerformerData = lowPerformers.map(performer => ({
      "รหัสพนักงาน": performer.employeeId,
      "ชื่อ-นามสกุล": performer.employeeName,
      "แผนก": performer.section,
      "ฝ่าย": performer.department,
      "คะแนนเฉลี่ย": `${Math.round(performer.averageScore)}%`,
      "หลักสูตรที่เสร็จ": Number(performer.completedCourses),
      "หลักสูตรที่ยังไม่เสร็จ": Number(performer.totalCourses) - Number(performer.completedCourses),
      "สถานะ": performer.averageScore < 70 ? "คะแนนต่ำ" : "ยังไม่เสร็จ",
      "ข้อเสนอแนะ": performer.averageScore < 70 ? "ควรเรียนซ้ำ" : "ควรติดตามให้เสร็จ"
    }))

    const lowPerformerSheet = XLSX.utils.json_to_sheet(lowPerformerData)
    XLSX.utils.book_append_sheet(workbook, lowPerformerSheet, "ต้องปรับปรุง")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: "xlsx", 
      type: "buffer",
      compression: true
    })

    // Generate filename with current date
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const rangeText = {
      "all": "ทั้งหมด",
      "7d": "7วัน",
      "30d": "30วัน", 
      "90d": "3เดือน",
      "1y": "1ปี"
    }[range] || "ทั้งหมด"
    
    const filename = `รายงานสถิติการเรียน_${rangeText}_${dateStr}.xlsx`

    // Return file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error("Error exporting report:", error)
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    )
  }
}