import { sendVerificationEmail, generateVerificationCode } from './email'

async function testEmail() {
  try {
    const code = generateVerificationCode()
    console.log('Generated code:', code)
    
    await sendVerificationEmail('test@example.com', code)
    console.log('Email sent successfully')
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

testEmail()