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
      padding: 20px;
    }
    .email-wrapper {
      background-color: #0a0a0a;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px;
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
      padding: 30px 0 20px;
      color: #a7a7a7;
      font-size: 14px;
      border-top: 1px dashed #1f1f1f;
      margin-top: 30px;
    }
    .contact-info {
      margin: 20px 0;
      padding: 15px;
      background-color: #0f0f0f;
      border-radius: 10px;
      font-size: 13px;
      color: #cfcfcf;
    }
    .contact-info a {
      color: #F3E6A2;
      text-decoration: none;
    }
    .contact-info a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body style="background-color: #0a0a0a;">
  <div class="email-wrapper">
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
        <div class="contact-info">
          <p><strong>Контактная информация:</strong></p>
          <p>Email: <a href="mailto:support@s7robotics.space">support@s7robotics.space</a></p>
          <p>Сайт: <a href="https://s7robotics.space">https://s7robotics.space</a></p>
        </div>
      </div>
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
      padding: 20px;
    }
    .email-wrapper {
      background-color: #0a0a0a;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px;
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
      padding: 30px 0 20px;
      color: #a7a7a7;
      font-size: 14px;
      border-top: 1px dashed #1f1f1f;
      margin-top: 30px;
    }
    .contact-info {
      margin: 20px 0;
      padding: 15px;
      background-color: #0f0f0f;
      border-radius: 10px;
      font-size: 13px;
      color: #cfcfcf;
    }
    .contact-info a {
      color: #F3E6A2;
      text-decoration: none;
    }
    .contact-info a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body style="background-color: #0a0a0a;">
  <div class="email-wrapper">
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
        <div class="contact-info">
          <p><strong>Контактная информация:</strong></p>
          <p>Email: <a href="mailto:info@s7robotics.space">info@s7robotics.space</a></p>
          <p>Сайт: <a href="https://s7robotics.space">https://s7robotics.space</a></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  }

  await transporter.sendMail(mailOptions)
}