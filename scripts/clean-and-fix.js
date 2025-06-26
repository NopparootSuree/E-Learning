const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function cleanAndFix() {
  try {
    console.log('🧹 Cleaning and fixing auth...')
    
    // 1. Delete orphaned users (users without employees)
    const orphanedUsers = await prisma.user.deleteMany({
      where: {
        employeeId: null
      }
    })
    console.log(`Deleted ${orphanedUsers.count} orphaned users`)
    
    // 2. Find employees without user accounts
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null },
      include: { user: true }
    })
    
    console.log('\n👥 Processing employees:')
    
    for (const employee of employees) {
      if (!employee.user) {
        try {
          const newUser = await prisma.user.create({
            data: {
              name: employee.name,
              employeeId: employee.id,
              role: employee.idEmp === "admin" || employee.idEmp === "1076706004" ? "admin" : "user"
            }
          })
          console.log(`✅ Created user for ${employee.idEmp} (${employee.name}) - Role: ${newUser.role}`)
        } catch (error) {
          console.log(`❌ Failed to create user for ${employee.idEmp}: ${error.message}`)
        }
      } else {
        console.log(`✅ ${employee.idEmp} already has user account - Role: ${employee.user.role}`)
      }
    }
    
    // 3. Final verification
    console.log('\n🔍 Final verification:')
    const finalCheck = await prisma.employee.findMany({
      where: { deletedAt: null },
      include: { user: true }
    })
    
    finalCheck.forEach(emp => {
      const status = emp.user ? `✅ ${emp.user.role}` : '❌ No user'
      console.log(`${emp.idEmp} (${emp.name}): ${status}`)
    })
    
    console.log('\n🔑 Login Credentials:')
    console.log('👤 Users: user001/user001, user002/user002')  
    console.log('🔧 Admins: admin/admin, 1076706004/1076706004')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanAndFix()