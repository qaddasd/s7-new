import nodemailer from 'nodemailer'

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'mail.spacemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@s7robotics.space',
    pass: '15862865Bb$'
  }
})

// Generate a verification code in format 6 digits
export function generateVerificationCode(): string {
  const chars = '0123456789'
  let code = ''
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return code
}

// Send verification email
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const mailOptions = {
    from: 'no-reply@s7robotics.space',
    to: email,
    subject: 'Код подтверждения S7 Robotics',
    html: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение почты</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #0b0b0b;
      border: 1px dashed #1f1f1f;
      border-radius: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    .content {
      padding: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 5px;
      color: #F3E6A2;
      margin: 30px 0;
      padding: 20px;
      background-color: #121212;
      border: 1px dashed #1f1f1f;
      border-radius: 10px;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      color: #a7a7a7;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #F3E6A2;
      color: #000000;
      text-decoration: none;
      border-radius: 999px;
      font-weight: bold;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://s7robotics.space/logo-s7.png" alt="S7 Robotics Logo" class="logo">
      <h1>Подтверждение почты</h1>
    </div>
    <div class="content">
      <p>Здравствуйте!</p>
      <p>Для завершения входа в систему S7 Robotics, пожалуйста, введите следующий код подтверждения:</p>
      <div class="code">${code}</div>
      <p>Если вы не запрашивали этот код, просто проигнорируйте это сообщение.</p>
    </div>
    <div class="footer">
      <p>© 2025 S7 Robotics. Все права защищены.</p>
    </div>
  </div>
</body>
</html>`
  }

  await transporter.sendMail(mailOptions)
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  const mailOptions = {
    from: 'no-reply@s7robotics.space',
    to: email,
    subject: 'Сброс пароля S7 Robotics',
    html: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сброс пароля</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #0b0b0b;
      border: 1px dashed #1f1f1f;
      border-radius: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    .content {
      padding: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 5px;
      color: #F3E6A2;
      margin: 30px 0;
      padding: 20px;
      background-color: #121212;
      border: 1px dashed #1f1f1f;
      border-radius: 10px;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      color: #a7a7a7;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://s7robotics.space/logo-s7.png" alt="S7 Robotics Logo" class="logo">
      <h1>Сброс пароля</h1>
    </div>
    <div class="content">
      <p>Здравствуйте!</p>
      <p>Вы запросили сброс пароля для аккаунта S7 Robotics. Используйте следующий код для сброса пароля:</p>
      <div class="code">${code}</div>
      <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это сообщение.</p>
    </div>
    <div class="footer">
      <p>© 2025 S7 Robotics. Все права защищены.</p>
    </div>
  </div>
</body>
</html>`
  }

  await transporter.sendMail(mailOptions)
}