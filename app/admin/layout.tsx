"use client"
import { useEffect, useState } from "react"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Menu } from "lucide-react"
import AdminAuthGate from "@/components/admin/auth-gate"
import ProfileDropdown from "@/components/kokonutui/profile-dropdown"
import { useAuth } from "@/components/auth/auth-context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [currentDate, setCurrentDate] = useState("")
  const [navOpen, setNavOpen] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const now = new Date()
    const months = [
      "Января",
      "Февраля",
      "Марта",
      "Апреля",
      "Мая",
      "Июня",
      "Июля",
      "Августа",
      "Сентября",
      "Октября",
      "Ноября",
      "Декабря",
    ]
    const day = now.getDate()
    const month = months[now.getMonth()]
    const year = now.getFullYear()
    setCurrentDate(`${day} ${month} ${year}`)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("s7_admin_nav_open")
      if (raw != null) setNavOpen(raw === "1")
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem("s7_admin_nav_open", navOpen ? "1" : "0") } catch {}
  }, [navOpen])

  return (
    <AdminAuthGate>
      <div className="flex min-h-screen bg-[#0b0b10]">
        <AdminSidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <div className={`flex-1 transition-[margin-left] duration-200 ${navOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <header className="sticky top-0 z-10 bg-transparent">
            <div className="flex items-center gap-4 p-6">
              <button
                onClick={() => setNavOpen((v) => !v)}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white px-3 py-2 rounded-lg bg-[#16161c] border border-[#2a2a35]"
                aria-label="Меню"
                aria-expanded={navOpen}
              >
                <Menu className="w-5 h-5" />
                {navOpen ? 'Скрыть' : 'Меню'}
              </button>
              
              <div className="ml-auto flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white text-xl font-semibold">{currentDate.split(" ").slice(0, 2).join(" ")}</div>
                  <div className="text-white/60 text-xs">{currentDate.split(" ").slice(2).join(" ")}</div>
                </div>
              </div>
            </div>
          </header>
          {children}
        </div>
      </div>
    </AdminAuthGate>
  )
}
