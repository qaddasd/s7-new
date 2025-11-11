import sharp from "sharp"
import path from "path"

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function generateCertificate(fullName: string): Promise<Buffer> {
  const width = 842
  const height = 595
  const y = 280
  const fontSize = 26
  const basePath = path.resolve(process.cwd(), "..", "public", "A4 - 3.png")
  const safeText = escapeXml(fullName || "")
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<style>.t{font-size:${fontSize}px;font-family:Arial,Helvetica,sans-serif;fill:#000000;}</style>` +
      `<text x="${Math.floor(width / 2)}" y="${y}" text-anchor="middle" class="t">${safeText}</text>` +
    `</svg>`
  )
  const img = await sharp(basePath)
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer()
  return img
}
