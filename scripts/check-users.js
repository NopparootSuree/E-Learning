const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    // Check all users
    const users = await prisma.user.findMany()
    console.log('👥 All Users:')
    users.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, EmployeeId: ${user.employeeId}, Role: ${user.role}`)
    })
    
    // Check all employees
    console.log('\n👷 All Employees:')
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null }
    })
    employees.forEach(emp => {
      console.log(`ID: ${emp.id}, ID_EMP: ${emp.idEmp}, Name: ${emp.name}`)
    })
    
    // Try manual user creation
    console.log('\n🔧 Trying manual user creation...')
    const emp = await prisma.employee.findFirst({
      where: { idEmp: 'user001' }
    })
    
    if (emp) {
      console.log(`Employee found: ${emp.id}`)
      
      // Delete any existing user with this employeeId
      await prisma.user.deleteMany({
        where: { employeeId: emp.id }
      })
      
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name: emp.name,
          employeeId: emp.id,
          role: 'user'
        }
      })
      console.log('✅ Created user for user001')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()