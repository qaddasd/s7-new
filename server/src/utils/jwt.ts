import jwt from "jsonwebtoken"
import { env } from "../env"

interface TokenPayload {
  sub: string
  role: "USER" | "ADMIN"
}

export function signAccessToken(userId: string, role: "USER" | "ADMIN") {
  const payload: TokenPayload = { sub: userId, role }
  return jwt.sign(payload, env.APP_SECRET, { expiresIn: "1h" })
}

export function signRefreshToken(userId: string, role: "USER" | "ADMIN") {
  const payload: TokenPayload = { sub: userId, role }
  return jwt.sign(payload, env.APP_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.APP_SECRET) as TokenPayload
}
