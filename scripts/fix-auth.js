const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function fixAuth() {
  try {
    console.log('🔧 Fixing authentication issues...')
    
    // 1. Create missing 1076706004 employee
    try {
      await prisma.employee.create({
        data: {
          idEmp: '1076706004',
          name: 'นายทดสอบ ระบบ',
          section: 'Management',
          department: 'IT',
          company: 'E-Learning Corp'
        }
      })
      console.log('✅ Created employee 1076706004')
    } catch (error) {
      console.log('Employee 1076706004 already exists')
    }
    
    // 2. Create user accounts for employees without them
    const employeesWithoutUsers = await prisma.employee.findMany({
      where: {
        deletedAt: null,
        user: null
      }
    })
    
    console.log(`Found ${employeesWithoutUsers.length} employees without user accounts`)
    
    for (const employee of employeesWithoutUsers) {
      try {
        await prisma.user.create({
          data: {
            name: employee.name,
            employeeId: employee.id,
            role: employee.idEmp === "admin" || employee.idEmp === "1076706004" ? "admin" : "user"
          }
        })
        console.log(`✅ Created user account for ${employee.idEmp}`)
      } catch (error) {
        console.log(`❌ Failed to create user for ${employee.idEmp}:`, error.message)
      }
    }
    
    // 3. Show final status
    console.log('\n📊 Final Status:')
    const allEmployees = await prisma.employee.findMany({
      where: { deletedAt: null },
      include: { user: true }
    })
    
    allEmployees.forEach(emp => {
      console.log(`${emp.idEmp} (${emp.name}): ${emp.user ? emp.user.role : 'No user account'}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuth()