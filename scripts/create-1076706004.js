const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function create1076706004() {
  try {
    console.log('Creating 1076706004 employee...')
    
    // Create employee
    const employee = await prisma.employee.create({
      data: {
        idEmp: '1076706004',
        name: 'นายทดสอบ ระบบ',
        section: 'Management',
        department: 'IT',
        company: 'E-Learning Corp'
      }
    })
    
    console.log('✅ Created employee 1076706004')
    
    // Create user account
    const user = await prisma.user.create({
      data: {
        name: employee.name,
        email: '1076706004@company.local',
        employeeId: employee.id,
        role: 'admin'
      }
    })
    
    console.log('✅ Created user account for 1076706004')
    console.log('Role:', user.role)
    
  } catch (error) {
    console.log('Employee might already exist:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

create1076706004()