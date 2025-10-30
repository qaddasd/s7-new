"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Home, BookOpen, User, Users, GraduationCap, FileText, Wrench, ChevronLeft, ChevronRight, LogOut, Shield, Calendar } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useConfirm } from "@/components/ui/confirm"
import { useRouter } from "next/navigation"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  onCollapseChange: (collapsed: boolean) => void
}

export default function Sidebar({
  activeTab,
  onTabChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onCollapseChange,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const confirm = useConfirm()

  const handleLogout = async () => {
    const ok = await confirm({ preset: 'logout' })
    if (!ok) return
    await logout()
    router.push('/')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest(".sidebar-container")) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileMenuOpen, setIsMobileMenuOpen])

  useEffect(() => {
    onCollapseChange(isCollapsed)
  }, [isCollapsed, onCollapseChange])

  const navItems = [
    { id: "home", label: "Главная", icon: Home },
    { id: "courses", label: "Курсы", icon: BookOpen },
    { id: "clubs", label: "Кружок", icon: Calendar },
    { id: "s7-tools", label: "S7 Tools", icon: Wrench },
    { id: "teams", label: "Команда", icon: Users },
    { id: "profile", label: "Профиль", icon: User },
    { id: "masterclass", label: "Мастер классы", icon: GraduationCap },
    { id: "bytesize", label: "ByteSize", icon: FileText },
    ...(user?.role === 'admin' ? [{ id: "admin", label: "Админ", icon: Shield }] as const : []),
  ]

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`sidebar-container bg-[#0b0b0b] border-r border-[#1f1f1f] flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-64"}
        ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 w-64 animate-slide-in-left" : "hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-30"}`}
      >
        <div
          className={`${isCollapsed ? "p-3" : "p-6"} border-b border-[#1f1f1f] flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <Image
            src="/logo-s7.png"
            alt="S7 Robotics Logo"
            width={isCollapsed ? 28 : 40}
            height={isCollapsed ? 28 : 40}
            className={isCollapsed ? "mx-auto" : ""}
          />
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-[#a7a7a7] hover:text-white transition-colors duration-200 hover:bg-[#141414] rounded-lg p-1 hidden md:block"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="p-2 border-b border-[#1f1f1f] hidden md:block">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full text-[#a7a7a7] hover:text-white transition-colors duration-200 hover:bg-[#141414] rounded-lg p-2 flex justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'admin') {
                      router.push('/admin')
                    } else {
                      onTabChange(item.id)
                    }
                    setIsMobileMenuOpen(false)
                  }}
                  className={`group relative flex items-center ${isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3"} rounded-lg transition-all duration-200 cursor-pointer animate-slide-up ${
                    isActive
                      ? "bg-[#141414] border border-[#2a2a2a] text-white"
                      : "text-[#a7a7a7] hover:text-white hover:bg-[#141414]"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon
                    className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5"} transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                  />
                  {isMobileMenuOpen && (
                    <span className={`text-sm transition-all duration-200 ${isActive ? "font-medium" : ""}`}>
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && !isMobileMenuOpen && (
                    <span className={`text-sm transition-all duration-200 ${isActive ? "font-medium" : ""}`}>
                      {item.label}
                    </span>
                  )}

                  {isCollapsed && !isMobileMenuOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#141414] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
        <div className="p-2 border-t border-[#1f1f1f] space-y-1">
          {user?.role === 'admin' && (
            <div
              onClick={() => router.push('/admin')}
              className="group relative flex items-center justify-center p-3 rounded-lg transition-all duration-200 cursor-pointer text-[#a7a7a7] hover:text-white hover:bg-[#141414]"
            >
              <Shield className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
              {!isCollapsed && (
                <span className="text-sm ml-3">Админ панель</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#141414] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Админ панель
                </div>
              )}
            </div>
          )}
          <div
            onClick={handleLogout}
            className="group relative flex items-center justify-center p-3 rounded-lg transition-all duration-200 cursor-pointer text-[#ff4757] hover:text-white hover:bg-[#141414]"
          >
            <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
            {!isCollapsed && (
              <span className="text-sm ml-3">Выйти</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#141414] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Выйти
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
