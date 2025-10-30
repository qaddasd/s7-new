import { PrismaClient } from './server/node_modules/.prisma/client/index.js'

const prisma = new PrismaClient()

async function verifyAdmin() {
  try {
    const admin = await prisma.user.update({
      where: { email: 'ch.qynon@gmail.com' },
      data: { emailVerified: true }
    })

    console.log('✅ Admin email верифицирован!')
    console.log('📧 Email:', admin.email)
    console.log('✔️ Verified:', admin.emailVerified)
  } catch (error) {
    console.error('❌ Қате:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdmin()
