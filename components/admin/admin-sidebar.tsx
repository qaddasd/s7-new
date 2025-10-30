"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, BookOpen, Users, GraduationCap, FileText, Wrench, CreditCard, Award, LogOut, Newspaper } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import ProfileDropdown from "@/components/kokonutui/profile-dropdown"
import { useConfirm } from "@/components/ui/confirm"

export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const confirm = useConfirm()
  const { user, logout } = useAuth()
  
  const nav = [
    { href: "/admin", label: "Главная", icon: Home },
    { href: "/admin/courses", label: "Курсы", icon: BookOpen },
    { href: "/admin/users", label: "Пользователи", icon: Users },
    { href: "/admin/payments", label: "Платежи", icon: CreditCard },
    { href: "/admin/teams", label: "Команды", icon: Users },
    { href: "/admin/achievements", label: "Достижения", icon: Award },
    { href: "/admin/masterclass", label: "Мастер классы", icon: GraduationCap },
    { href: "/admin/news", label: "Новости", icon: Newspaper },
    { href: "/admin/bytesize", label: "ByteSize", icon: FileText },
    { href: "/admin/submissions", label: "Заявки", icon: FileText },
    { href: "/admin/tools", label: "S7 Tool", icon: Wrench },
  ]

  const handleLogout = async () => {
    const ok = await confirm({ preset: 'logout' })
    if (!ok) return
    await logout()
    router.replace('/')
  }

  const panelClasses = `${open ? "translate-x-0 md:translate-x-0" : "-translate-x-full md:-translate-x-full"}`
  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/50 md:hidden z-30" />}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 bg-[#0b0b10] border-r border-[#636370]/20 p-4 flex flex-col transform transition-transform ${panelClasses}`}>
      
      <div className="mb-8">
        <div className="text-white font-bold text-xl mb-2">S7 Admin</div>
        {user && (
          <div className="text-white/60 text-sm">
            {user.fullName || user.email}
          </div>
        )}
        {typeof user?.xp === 'number' && (
          <div className="mt-1 text-xs text-[#00a3ff]">XP: {user.xp}</div>
        )}
      </div>
      
      
      <div className="flex-1">
        <div className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-[#16161c] text-white" : "text-white/70 hover:text-white hover:bg-[#16161c]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-[#636370]/20 space-y-2">
        
        <div className="px-1">
          <ProfileDropdown
            data={{ name: user?.fullName || user?.email || "Профиль", email: user?.email || "", avatar: "/logo-s7.png", xp: user?.xp || 0 }}
            onLogout={handleLogout}
          />
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-[#16161c] transition-colors w-full"
        >
          <Home className="w-5 h-5" />
          <span>На главную</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-[#16161c] transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
      </aside>
    </>
  )
}
