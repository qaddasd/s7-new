"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

export default function EntryToasts() {
  useEffect(() => {
    if (typeof window === "undefined") return
    let justLoggedIn = null as string | null
    try { justLoggedIn = window.sessionStorage.getItem("justLoggedIn") } catch {}
    if (justLoggedIn === "1") {
      try { window.sessionStorage.removeItem("justLoggedIn") } catch {}
      toast({ title: "Вы успешно вошли в аккаунт", description: "Добро пожаловать!" })
    }
  }, [])
  return null
}
