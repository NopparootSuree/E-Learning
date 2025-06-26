const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function checkEmployees() {
  try {
    // Find all employees
    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        idEmp: true,
        name: true,
        password: true
      }
    })
    
    console.log('📊 Employee Data:')
    console.log(`Total employees: ${employees.length}`)
    console.log('')
    
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ID_EMP: ${emp.idEmp}`)
      console.log(`   Name: ${emp.name}`)
      console.log(`   Password: ${emp.password ? 'Set' : 'Not set'}`)
      console.log('')
    })
    
    if (employees.length === 0) {
      console.log('❌ No employees found! Creating sample employees...')
      
      // Create sample employees
      await prisma.employee.createMany({
        data: [
          {
            idEmp: 'user001',
            name: 'John Doe',
            section: 'Development',
            department: 'IT',
            company: 'E-Learning Corp'
          },
          {
            idEmp: 'user002', 
            name: 'Jane Smith',
            section: 'Testing',
            department: 'IT',
            company: 'E-Learning Corp'
          }
        ]
      })
      
      console.log('✅ Sample employees created!')
      console.log('Login credentials:')
      console.log('- ID_EMP: user001, Password: user001')
      console.log('- ID_EMP: user002, Password: user002')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmployees()