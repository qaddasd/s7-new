import type { Request } from "express"

export type AuthenticatedRequest = Request & {
  user?: {
    id: string
    role: "USER" | "ADMIN"
  }
}
