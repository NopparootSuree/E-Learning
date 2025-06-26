const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function createSampleUsers() {
  try {
    console.log('Creating sample users...')
    
    const users = [
      {
        idEmp: '1001',
        name: 'นายทดสอบ หนึ่ง',
        section: 'Development',
        department: 'IT',
        company: 'E-Learning Corp'
      },
      {
        idEmp: '1002',
        name: 'นางสาวทดสอบ สอง',
        section: 'QA',
        department: 'IT',
        company: 'E-Learning Corp'
      }
    ]
    
    for (const userData of users) {
      // Create employee
      const employee = await prisma.employee.create({
        data: userData
      })
      
      // Create user account
      await prisma.user.create({
        data: {
          name: employee.name,
          email: `${employee.idEmp}@company.local`,
          employeeId: employee.id,
          role: 'user'
        }
      })
      
      console.log('✅ Created user:', employee.idEmp, employee.name)
    }
    
    console.log('Sample users created successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleUsers()