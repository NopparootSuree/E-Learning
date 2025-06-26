const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function cleanUsers() {
  try {
    // Delete all users to start fresh
    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`✅ Deleted ${deletedUsers.count} user records`)
    
    // Delete all sessions
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`✅ Deleted ${deletedSessions.count} session records`)
    
    // Delete all accounts
    const deletedAccounts = await prisma.account.deleteMany({})
    console.log(`✅ Deleted ${deletedAccounts.count} account records`)
    
    console.log('✅ Database cleaned! Now try logging in again.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanUsers()