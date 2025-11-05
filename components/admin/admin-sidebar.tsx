"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, BookOpen, Users, GraduationCap, FileText, Wrench, CreditCard, Award, LogOut, Newspaper, Gamepad2 } from "lucide-react"
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
    { href: "/admin/games", label: "Игры", icon: Gamepad2 },
    { href: "/admin/kruzhok", label: "Кружки", icon: GraduationCap },
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
      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 bg-[var(--color-surface-1)] border-r border-[var(--color-border-1)] p-4 flex flex-col transform transition-transform ${panelClasses}`}>
      
      <div className="mb-8">
        <div className="text-[var(--color-text-1)] font-bold text-xl mb-2">S7 Admin</div>
        {user && (
          <div className="text-[var(--color-text-3)] text-sm">
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
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-[var(--dur-fast)] ${
                  active
                    ? "bg-[var(--color-accent-warm)] text-black"
                    : "text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-[var(--color-border-1)] space-y-2">
        
        <div className="px-1">
          <ProfileDropdown
            data={{ name: user?.fullName || user?.email || "Профиль", email: user?.email || "", avatar: "/logo-s7.png", xp: user?.xp || 0 }}
            onLogout={handleLogout}
          />
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-surface-2)] transition-colors duration-[var(--dur-fast)] w-full"
        >
          <Home className="w-5 h-5" />
          <span>На главную</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-surface-2)] transition-colors duration-[var(--dur-fast)] w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
      </aside>
    </>
  )
}
