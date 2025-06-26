const { PrismaClient } = require('../app/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth() {
  try {
    const idEmp = 'admin'
    const password = 'admin123'
    
    console.log('🔍 Testing authentication...')
    console.log('ID_EMP:', idEmp)
    console.log('Password:', password)
    
    // Find employee by ID_EMP
    const employee = await prisma.employee.findFirst({
      where: {
        idEmp: idEmp,
        deletedAt: null
      },
      include: {
        user: true
      }
    })

    if (!employee) {
      console.log('❌ Employee not found')
      return
    }

    console.log('✅ Employee found:', employee.name)

    // Check password
    if (employee.password) {
      // If employee has hashed password, verify it
      const isValidPassword = await bcrypt.compare(password, employee.password)
      console.log('Password verification:', isValidPassword ? '✅ Valid' : '❌ Invalid')
      
      if (!isValidPassword) {
        console.log('❌ Authentication failed')
        return
      }
    } else {
      // For employees without password, use idEmp as default password
      if (password !== employee.idEmp) {
        console.log('❌ Authentication failed (no stored password, idEmp mismatch)')
        return
      }
    }

    console.log('✅ Authentication successful!')
    
    // Check admin role
    const isAdmin = employee.idEmp === "admin" || employee.idEmp === "1076706004"
    console.log('Admin status:', isAdmin ? '✅ Admin' : '❌ Regular user')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()