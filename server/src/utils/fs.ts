import fs from "fs/promises"
import path from "path"

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export function resolveMediaPath(baseDir: string, filename: string) {
  return path.join(baseDir, filename)
}
