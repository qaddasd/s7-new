import type { Request, Response, NextFunction } from "express"
import { validationResult, type ValidationError } from "express-validator"

// Common validator middleware used by routes that leverage express-validator chains
export function validate(req: Request, res: Response, next: NextFunction) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    const errors = result.array().map((e: ValidationError | any) => ({
      field: e.type === "field" ? e.path : undefined,
      msg: e.msg,
      value: (e as any).value,
    }))
    return res.status(400).json({ error: "Validation failed", details: errors })
  }
  return next()
}
