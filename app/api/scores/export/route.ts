import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const courseId = searchParams.get("courseId")
    const format = searchParams.get("format") || "detailed" // detailed or summary

    const whereClause: any = {
      deletedAt: null,
      employee: {
        deletedAt: null
      },
      course: {
        deletedAt: null
      }
    }

    if (employeeId && employeeId !== "all") {
      whereClause.employeeId = employeeId
    }

    if (courseId && courseId !== "all") {
      whereClause.courseId = courseId
    }

    const scores = await prisma.score.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            idEmp: true,
            name: true,
            section: true,
            department: true,
            company: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { employee: { department: "asc" } },
        { employee: { name: "asc" } },
        { course: { title: "asc" } }
      ]
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()

    if (format === "detailed") {
      // Detailed scores sheet
      const detailedData = scores.map(score => ({
        "รหัสพนักงาน": score.employee.idEmp,
        "ชื่อ-นามสกุล": score.employee.name,
        "แผนก": score.employee.section,
        "ฝ่าย": score.employee.department,
        "บริษัท": score.employee.company,
        "หลักสูตร": score.course.title,
        "คะแนน Pre-test": score.preTestScore !== null ? `${score.preTestScore}%` : "-",
        "คะแนน Post-test": score.postTestScore !== null ? `${score.postTestScore}%` : "-",
        "คะแนนรวม": score.finalScore !== null ? `${score.finalScore}%` : "-",
        "สถานะ": score.completedAt ? "เสร็จสมบูรณ์" : "กำลังเรียน",
        "วันที่เสร็จ": score.completedAt ? new Date(score.completedAt).toLocaleDateString("th-TH") : "-",
        "วันที่เริ่ม": new Date(score.createdAt).toLocaleDateString("th-TH")
      }))

      const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
      XLSX.utils.book_append_sheet(workbook, detailedSheet, "รายละเอียดคะแนน")

      // Summary by employee
      const employeeSummary = await prisma.$queryRaw`
        SELECT 
          e.ID_EMP as employeeId,
          e.name as employeeName,
          e.DEPARTMENT as department,
          COUNT(s.id) as totalCourses,
          COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completedCourses,
          AVG(CAST(s.finalScore as FLOAT)) as averageScore
        FROM employees e
        LEFT JOIN scores s ON e.id = s.employeeId AND s.deletedAt IS NULL
        WHERE e.deletedAt IS NULL
        GROUP BY e.id, e.ID_EMP, e.name, e.DEPARTMENT
        ORDER BY e.DEPARTMENT, e.name
      ` as Array<{
        employeeId: string
        employeeName: string
        department: string
        totalCourses: bigint
        completedCourses: bigint
        averageScore: number | null
      }>

      const summaryData = employeeSummary.map(emp => ({
        "รหัสพนักงาน": emp.employeeId,
        "ชื่อ-นามสกุล": emp.employeeName,
        "ฝ่าย": emp.department,
        "หลักสูตรทั้งหมด": Number(emp.totalCourses),
        "หลักสูตรที่เสร็จ": Number(emp.completedCourses),
        "เปอร์เซ็นต์เสร็จ": Number(emp.totalCourses) > 0 
          ? `${Math.round((Number(emp.completedCourses) / Number(emp.totalCourses)) * 100)}%`
          : "0%",
        "คะแนนเฉลี่ย": emp.averageScore !== null ? `${Math.round(emp.averageScore)}%` : "-"
      }))

      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, "สรุปตามพนักงาน")

      // Summary by course
      const courseSummary = await prisma.$queryRaw`
        SELECT 
          c.title as courseTitle,
          COUNT(s.id) as totalAttempts,
          COUNT(CASE WHEN s.completedAt IS NOT NULL THEN 1 END) as completions,
          AVG(CAST(s.preTestScore as FLOAT)) as avgPreTest,
          AVG(CAST(s.postTestScore as FLOAT)) as avgPostTest,
          AVG(CAST(s.finalScore as FLOAT)) as avgFinalScore
        FROM courses c
        LEFT JOIN scores s ON c.id = s.courseId AND s.deletedAt IS NULL
        WHERE c.deletedAt IS NULL
        GROUP BY c.id, c.title
        ORDER BY c.title
      ` as Array<{
        courseTitle: string
        totalAttempts: bigint
        completions: bigint
        avgPreTest: number | null
        avgPostTest: number | null
        avgFinalScore: number | null
      }>

      const courseData = courseSummary.map(course => ({
        "หลักสูตร": course.courseTitle,
        "จำนวนผู้เรียน": Number(course.totalAttempts),
        "จำนวนผู้เสร็จ": Number(course.completions),
        "เปอร์เซ็นต์เสร็จ": Number(course.totalAttempts) > 0 
          ? `${Math.round((Number(course.completions) / Number(course.totalAttempts)) * 100)}%`
          : "0%",
        "คะแนนเฉลี่ย Pre-test": course.avgPreTest !== null ? `${Math.round(course.avgPreTest)}%` : "-",
        "คะแนนเฉลี่ย Post-test": course.avgPostTest !== null ? `${Math.round(course.avgPostTest)}%` : "-",
        "คะแนนเฉลี่ยรวม": course.avgFinalScore !== null ? `${Math.round(course.avgFinalScore)}%` : "-"
      }))

      const courseSheet = XLSX.utils.json_to_sheet(courseData)
      XLSX.utils.book_append_sheet(workbook, courseSheet, "สรุปตามหลักสูตร")

      // Department summary
      const deptSummary = await prisma.$queryRaw`
        SELECT 
          e.DEPARTMENT as department,
          COUNT(DISTINCT e.id) as totalEmployees,
          COUNT(DISTINCT CASE WHEN s.completedAt IS NOT NULL THEN s.employeeId END) as completedEmployees,
          AVG(CAST(s.finalScore as FLOAT)) as avgScore
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
      }>

      const deptData = deptSummary.map(dept => ({
        "ฝ่าย": dept.department,
        "พนักงานทั้งหมด": Number(dept.totalEmployees),
        "พนักงานที่เสร็จ": Number(dept.completedEmployees),
        "เปอร์เซ็นต์เสร็จ": Number(dept.totalEmployees) > 0 
          ? `${Math.round((Number(dept.completedEmployees) / Number(dept.totalEmployees)) * 100)}%`
          : "0%",
        "คะแนนเฉลี่ย": dept.avgScore !== null ? `${Math.round(dept.avgScore)}%` : "-"
      }))

      const deptSheet = XLSX.utils.json_to_sheet(deptData)
      XLSX.utils.book_append_sheet(workbook, deptSheet, "สรุปตามฝ่าย")

    } else {
      // Summary format only
      const summaryData = scores.map(score => ({
        "รหัสพนักงาน": score.employee.idEmp,
        "ชื่อ-นามสกุล": score.employee.name,
        "ฝ่าย": score.employee.department,
        "หลักสูตร": score.course.title,
        "คะแนนรวม": score.finalScore !== null ? `${score.finalScore}%` : "-",
        "สถานะ": score.completedAt ? "เสร็จสมบูรณ์" : "กำลังเรียน",
        "วันที่เสร็จ": score.completedAt ? new Date(score.completedAt).toLocaleDateString("th-TH") : "-"
      }))

      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, "สรุปคะแนน")
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: "xlsx", 
      type: "buffer",
      compression: true
    })

    // Generate filename with current date
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const filename = `คะแนนการเรียน_${dateStr}.xlsx`

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
    console.error("Error exporting scores:", error)
    return NextResponse.json(
      { error: "Failed to export scores" },
      { status: 500 }
    )
  }
}