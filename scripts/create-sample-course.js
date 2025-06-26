const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function createSampleCourse() {
  try {
    console.log('Creating sample course with video...')
    
    // Create course with YouTube video
    const course = await prisma.course.create({
      data: {
        title: 'หลักสูตรทดสอบวิดีโอ',
        description: 'หลักสูตรสำหรับทดสอบการแสดงผลวิดีโอ',
        contentType: 'video',
        contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoSource: 'url',
        videoFile: null,
        isActive: true
      }
    })
    
    console.log('✅ Created sample course:', course.title)
    
    // Create pre-test
    const preTest = await prisma.test.create({
      data: {
        courseId: course.id,
        type: 'pretest',
        title: 'แบบทดสอบก่อนเรียน',
        description: 'ทดสอบความรู้ก่อนเรียน',
        isActive: true
      }
    })
    
    console.log('✅ Created pre-test:', preTest.title)
    
    // Create some questions
    const questions = await Promise.all([
      prisma.question.create({
        data: {
          testId: preTest.id,
          type: 'multiple_choice',
          question: 'คำถามที่ 1: 2 + 2 = ?',
          options: JSON.stringify(['2', '3', '4', '5']),
          correctAnswer: '4',
          points: 1,
          order: 1
        }
      }),
      prisma.question.create({
        data: {
          testId: preTest.id,
          type: 'multiple_choice',
          question: 'คำถามที่ 2: เมืองหลวงของไทยคือ?',
          options: JSON.stringify(['เชียงใหม่', 'กรุงเทพมหานคร', 'ขอนแก่น', 'หาดใหญ่']),
          correctAnswer: 'กรุงเทพมหานคร',
          points: 1,
          order: 2
        }
      })
    ])
    
    console.log('✅ Created questions:', questions.length)
    console.log('Sample course setup complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleCourse()