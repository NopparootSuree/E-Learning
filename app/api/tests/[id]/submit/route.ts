import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { answers } = body

    // Find employee from session
    const employee = await prisma.employee.findFirst({
      where: {
        id: session.user.employeeId,
        deletedAt: null
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      )
    }

    // Check if test exists
    const test = await prisma.test.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        isActive: true
      },
      include: {
        questions: {
          where: {
            deletedAt: null
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json(
        { error: "Test not found or inactive" },
        { status: 404 }
      )
    }

    // Check if user already submitted this test
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        employeeId: employee.id,
        testId: params.id,
        deletedAt: null,
        status: "completed"
      }
    })

    if (existingAttempt) {
      return NextResponse.json(
        { error: "คุณได้ทำแบบทดสอบนี้แล้ว" },
        { status: 400 }
      )
    }

    // Create or update test attempt
    let testAttempt = await prisma.testAttempt.findFirst({
      where: {
        employeeId: employee.id,
        testId: params.id,
        deletedAt: null,
        status: "in_progress"
      }
    })

    if (!testAttempt) {
      testAttempt = await prisma.testAttempt.create({
        data: {
          employeeId: employee.id,
          testId: params.id,
          status: "in_progress"
        }
      })
    }

    // Process answers and calculate score
    let totalScore = 0
    let totalPoints = 0

    for (const question of test.questions) {
      totalPoints += question.points
      
      const userAnswer = answers.find((a: any) => a.questionId === question.id)
      if (!userAnswer) continue

      let isCorrect = false
      let points = 0

      if (question.type === "multiple_choice" && question.correctAnswer) {
        isCorrect = userAnswer.answer.trim() === question.correctAnswer.trim()
        points = isCorrect ? question.points : 0
      } else if (question.type === "written") {
        // For written questions, give full points (manual grading can be implemented later)
        isCorrect = true
        points = question.points
      }

      totalScore += points

      // Create or update answer
      await prisma.answer.upsert({
        where: {
          testAttemptId_questionId: {
            testAttemptId: testAttempt.id,
            questionId: question.id
          }
        },
        update: {
          answer: userAnswer.answer,
          isCorrect,
          points
        },
        create: {
          testAttemptId: testAttempt.id,
          questionId: question.id,
          answer: userAnswer.answer,
          isCorrect,
          points
        }
      })
    }

    // Calculate percentage score
    const percentageScore = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0

    // Update test attempt as completed
    await prisma.testAttempt.update({
      where: { id: testAttempt.id },
      data: {
        completedAt: new Date(),
        score: percentageScore,
        status: "completed"
      }
    })

    // Update or create score record
    await prisma.score.upsert({
      where: {
        employeeId_courseId: {
          employeeId: employee.id,
          courseId: test.courseId
        }
      },
      update: test.type === "pretest" 
        ? { preTestScore: percentageScore }
        : { 
            postTestScore: percentageScore,
            finalScore: percentageScore, // Can be calculated differently later
            completedAt: new Date()
          },
      create: {
        employeeId: employee.id,
        courseId: test.courseId,
        ...(test.type === "pretest" 
          ? { preTestScore: percentageScore }
          : { 
              postTestScore: percentageScore,
              finalScore: percentageScore,
              completedAt: new Date()
            }
        )
      }
    })

    return NextResponse.json({
      success: true,
      score: percentageScore,
      totalScore,
      totalPoints
    })
  } catch (error) {
    console.error("Error submitting test:", error)
    return NextResponse.json(
      { error: "Failed to submit test" },
      { status: 500 }
    )
  }
}