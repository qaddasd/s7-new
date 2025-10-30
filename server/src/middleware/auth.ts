import { NextFunction, Response } from "express"
import { verifyToken } from "../utils/jwt"
import type { AuthenticatedRequest } from "../types"

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: "Unauthorized" })

  try {
    const payload = verifyToken(token)
    req.user = { id: payload.sub, role: payload.role }
    return next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" })
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" })
  return next()
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return next()
  try {
    const payload = verifyToken(token)
    req.user = { id: payload.sub, role: payload.role }
  } catch (error) {
  }
  return next()
}
