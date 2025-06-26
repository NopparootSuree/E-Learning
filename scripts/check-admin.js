const { PrismaClient } = require('../app/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    // Find admin employee
    const admin = await prisma.employee.findFirst({
      where: { idEmp: 'admin' }
    })
    
    if (!admin) {
      console.log('❌ Admin not found in database')
      return
    }
    
    console.log('✅ Admin found:')
    console.log('ID:', admin.id)
    console.log('ID_EMP:', admin.idEmp)
    console.log('Name:', admin.name)
    console.log('Password stored:', admin.password ? 'Yes' : 'No')
    
    if (admin.password) {
      // Test password
      const testPassword = 'admin123'
      const isMatch = await bcrypt.compare(testPassword, admin.password)
      console.log('Password test (admin123):', isMatch ? '✅ Match' : '❌ No match')
      
      // Try comparing with idEmp
      const isIdEmpMatch = await bcrypt.compare(admin.idEmp, admin.password)
      console.log('Password test (admin):', isIdEmpMatch ? '✅ Match' : '❌ No match')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()