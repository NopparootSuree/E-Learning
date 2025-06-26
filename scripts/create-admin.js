const { PrismaClient } = require('../app/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create admin employee
    const admin = await prisma.employee.upsert({
      where: { idEmp: 'admin' },
      update: {
        password: hashedPassword
      },
      create: {
        idEmp: 'admin',
        name: 'Administrator',
        section: 'IT',
        department: 'Information Technology',
        company: 'E-Learning Corp',
        password: hashedPassword
      }
    })
    
    console.log('✅ Admin created/updated successfully!')
    console.log('รหัสพนักงาน: admin')
    console.log('รหัสผ่าน: admin123')
    console.log('ชื่อ:', admin.name)
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()