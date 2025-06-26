const { PrismaClient } = require('../app/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // Simple password
    const newPassword = 'admin'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update admin password
    const admin = await prisma.employee.update({
      where: { idEmp: 'admin' },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Admin password reset successfully!')
    console.log('รหัสพนักงาน: admin')
    console.log('รหัสผ่านใหม่: admin')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()