"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/auth/auth-context"

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b10] p-4">
        <div className="text-white text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!user) return null

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b10] p-4">
        <div className="w-full max-w-sm bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white text-center space-y-4">
          <div className="text-lg font-medium text-red-400">Доступ запрещен</div>
          <div className="text-sm text-white/70">У вас нет прав администратора</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium py-2 transition-colors"
          >
            Вернуться к панели управления
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
