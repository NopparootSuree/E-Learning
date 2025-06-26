const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function checkAllEmployees() {
  try {
    // Check ALL employees including soft deleted
    const allEmployees = await prisma.employee.findMany({
      include: { user: true }
    })
    
    console.log('📊 ALL Employees (including deleted):')
    allEmployees.forEach((emp, index) => {
      const deleted = emp.deletedAt ? '🗑️ DELETED' : '✅ ACTIVE'
      const user = emp.user ? `User: ${emp.user.role}` : 'No user'
      console.log(`${index + 1}. ${emp.idEmp} (${emp.name}) - ${deleted} - ${user}`)
    })
    
    // Try to find 1076706004 specifically
    const target = await prisma.employee.findFirst({
      where: { idEmp: '1076706004' }
    })
    
    if (target) {
      console.log('\n🎯 Found 1076706004:')
      console.log('Deleted At:', target.deletedAt)
      console.log('Active:', !target.deletedAt)
      
      if (target.deletedAt) {
        console.log('🔧 Restoring deleted employee...')
        await prisma.employee.update({
          where: { id: target.id },
          data: { deletedAt: null }
        })
        console.log('✅ Restored!')
      }
    } else {
      console.log('\n❌ 1076706004 not found, creating...')
      await prisma.employee.create({
        data: {
          idEmp: '1076706004',
          name: 'นายทดสอบ ระบบ',
          section: 'Management',
          department: 'IT',
          company: 'E-Learning Corp'
        }
      })
      console.log('✅ Created 1076706004')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllEmployees()