import { PrismaClient } from './server/node_modules/.prisma/client/index.js'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Admin пайдаланушы бар:', existingAdmin.email)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@s7.kz',
        passwordHash: hashedPassword,
        fullName: 'Admin User',
        role: 'ADMIN',
        profile: {
          create: {
            bio: 'System Administrator'
          }
        }
      },
      include: {
        profile: true
      }
    })

    console.log('✅ Admin пайдаланушы құрылды!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password: admin123')
    console.log('👤 Аты:', admin.fullName)
    console.log('🎭 Рөлі:', admin.role)
  } catch (error) {
    console.error('❌ Қате:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
