const { PrismaClient } = require('../app/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function debugAuth() {
  try {
    const testCredentials = [
      { idEmp: 'user001', password: 'user001' },
      { idEmp: 'admin', password: 'admin' },
      { idEmp: '1076706004', password: '1076706004' }
    ]
    
    for (const cred of testCredentials) {
      console.log(`\n🔍 Testing: ${cred.idEmp}`)
      
      // Find employee
      const employee = await prisma.employee.findFirst({
        where: {
          idEmp: cred.idEmp,
          deletedAt: null
        },
        include: {
          user: true
        }
      })

      if (!employee) {
        console.log('❌ Employee not found')
        continue
      }

      console.log('✅ Employee found:', employee.name)
      console.log('Password in DB:', employee.password ? 'Set' : 'Not set')
      
      // Test password logic
      if (employee.password) {
        const isValidPassword = await bcrypt.compare(cred.password, employee.password)
        console.log('Password hash match:', isValidPassword ? '✅' : '❌')
      } else {
        const isValidDefault = cred.password === employee.idEmp
        console.log('Default password match:', isValidDefault ? '✅' : '❌')
      }
      
      console.log('User account:', employee.user ? 'Exists' : 'Not created')
      
      if (employee.user) {
        console.log('Role:', employee.user.role)
        console.log('Employee ID:', employee.user.employeeId)
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAuth()