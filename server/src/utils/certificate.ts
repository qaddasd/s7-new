import { createCanvas, loadImage, registerFont } from 'canvas'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Email configuration (shared from email.ts)
const transporter = nodemailer.createTransport({
  host: 'mail.spacemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@s7robotics.space',
    pass: '15862865Bb$'
  }
})

/**
 * Генерирует сертификат с ФИО пользователя
 * @param fullName - ФИО пользователя
 * @returns Promise<Buffer> - Buffer с изображением сертификата
 */
export async function generateCertificate(fullName: string): Promise<Buffer> {
  // Путь к шаблону сертификата
  const templatePath = path.join(__dirname, '../../../public/A4 - 3.png')
  
  // Загружаем шаблон
  const image = await loadImage(templatePath)
  
  // Размеры изображения: 842 x 595 пикселей
  const canvas = createCanvas(842, 595)
  const ctx = canvas.getContext('2d')
  
  // Рисуем шаблон
  ctx.drawImage(image, 0, 0, 842, 595)
  
  // Настраиваем шрифт для ФИО
  ctx.font = '26px Arial'
  ctx.fillStyle = '#000000' // Черный цвет текста
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Измеряем ширину текста
  const textMetrics = ctx.measureText(fullName)
  const textWidth = textMetrics.width
  
  // Центрируем горизонтально
  const x = (842 - textWidth) / 2
  const y = 280
  
  // Рисуем текст
  ctx.fillText(fullName, 842 / 2, y) // Используем center alignment
  
  // Возвращаем буфер
  return canvas.toBuffer('image/png')
}

/**
 * Отправляет сертификат на почту пользователя
 * @param email - Email пользователя
 * @param fullName - ФИО пользователя
 */
export async function sendCertificate(email: string, fullName: string): Promise<void> {
  try {
    // Генерируем сертификат
    const certificateBuffer = await generateCertificate(fullName)
    
    // Настройки письма
    const mailOptions = {
      from: 'no-reply@s7robotics.space',
      to: email,
      subject: '🎉 Поздравляем! Вы получили сертификат S7 Robotics',
      html: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сертификат S7 Robotics</title>
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
    .achievement {
      font-size: 48px;
      text-align: center;
      margin: 20px 0;
    }
    .highlight {
      color: #F3E6A2;
      font-weight: bold;
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
      <h1>🎉 Поздравляем!</h1>
    </div>
    <div class="content">
      <div class="achievement">🏆</div>
      <p>Здравствуйте, <span class="highlight">${fullName}</span>!</p>
      <p>Поздравляем вас с достижением <span class="highlight">100 баллов опыта</span> на платформе S7 Robotics!</p>
      <p>В знак признания ваших достижений, мы рады вручить вам сертификат. Вы можете найти его во вложении к этому письму.</p>
      <p>Продолжайте обучение и достигайте новых высот в робототехнике!</p>
    </div>
    <div class="footer">
      <p>© 2025 S7 Robotics. Все права защищены.</p>
    </div>
  </div>
</body>
</html>`,
      attachments: [
        {
          filename: `certificate-${fullName.replace(/\s+/g, '-')}.png`,
          content: certificateBuffer,
          contentType: 'image/png'
        }
      ]
    }
    
    // Отправляем письмо
    await transporter.sendMail(mailOptions)
    console.log(`Certificate sent to ${email} for ${fullName}`)
  } catch (error) {
    console.error('Error sending certificate:', error)
    throw error
  }
}
