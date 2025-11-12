import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

interface CertificateData {
  fullName: string
  courseName: string
  date: Date
}

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  // Certificate template path
  const templatePath = path.join(process.cwd(), '..', 'public', 'A4 - 3.png')
  
  // Certificate dimensions and text positioning
  const CERTIFICATE_WIDTH = 842
  const CERTIFICATE_HEIGHT = 595
  const TEXT_Y_POSITION = 280
  const FONT_SIZE = 26
  
  // Load the certificate template
  const templateBuffer = await fs.readFile(templatePath)
  
  // Calculate text width for centering (approximation)
  const textWidth = data.fullName.length * FONT_SIZE * 0.6 // Approximate character width
  const textXPosition = Math.floor((CERTIFICATE_WIDTH - textWidth) / 2)
  
  // Create SVG text overlay
  const svgText = `
    <svg width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}">
      <text x="${textXPosition}" y="${TEXT_Y_POSITION}" 
            font-family="Arial, sans-serif" 
            font-size="${FONT_SIZE}" 
            fill="#000000" 
            text-anchor="start"
            font-weight="bold">
        ${data.fullName}
      </text>
    </svg>
  `
  
  // Convert SVG to buffer
  const svgBuffer = Buffer.from(svgText)
  
  // Composite the text onto the certificate template
  const certificateBuffer = await sharp(templateBuffer)
    .composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer()
  
  return certificateBuffer
}

export async function saveCertificate(buffer: Buffer, filename: string): Promise<string> {
  const certificatesDir = path.join(process.cwd(), 'certificates')
  
  // Ensure certificates directory exists
  try {
    await fs.access(certificatesDir)
  } catch {
    await fs.mkdir(certificatesDir, { recursive: true })
  }
  
  const filePath = path.join(certificatesDir, `${filename}.png`)
  await fs.writeFile(filePath, buffer)
  
  return filePath
}