const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function finalFix() {
  try {
    console.log('🔧 Final fix for authentication...')
    
    // Get employees without users
    const employees = await prisma.employee.findMany({
      where: { 
        deletedAt: null,
        user: null
      }
    })
    
    console.log(`Found ${employees.length} employees without user accounts`)
    
    for (const emp of employees) {
      try {
        await prisma.user.create({
          data: {
            name: emp.name,
            email: `${emp.idEmp}@company.local`, // Add unique email
            employeeId: emp.id,
            role: emp.idEmp === "admin" || emp.idEmp === "1076706004" ? "admin" : "user"
          }
        })
        console.log(`✅ Created user for ${emp.idEmp}`)
      } catch (error) {
        console.log(`❌ Failed to create user for ${emp.idEmp}: ${error.message}`)
      }
    }
    
    // Final check
    console.log('\n🎯 Final Authentication Test:')
    const finalEmployees = await prisma.employee.findMany({
      where: { deletedAt: null },
      include: { user: true }
    })
    
    finalEmployees.forEach(emp => {
      const userStatus = emp.user ? `✅ ${emp.user.role}` : '❌ No user'
      console.log(`${emp.idEmp}: ${userStatus}`)
    })
    
    console.log('\n🔑 Ready to test login:')
    console.log('👤 Regular Users:')
    console.log('- user001 / user001')
    console.log('- user002 / user002')
    console.log('🔧 Admin Users:')
    console.log('- admin / admin')
    console.log('- 1076706004 / 1076706004')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalFix()