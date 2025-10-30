"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

interface Stats { totalUsers: number; totalCourses: number; pendingPayments: number; completedPayments: number; newUsersThisWeek: number; totalRevenue: number }

export default function AdminToolsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [health, setHealth] = useState<string>("...")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<Stats>("/api/admin/stats").catch(() => null),
      fetch("/api/health").then(r => r.ok ? r.json() : Promise.reject()).catch(() => ({ status: "error" })),
    ]).then(([s, h]: any) => { setStats(s); setHealth(h?.status || "error") }).finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h1 className="text-white text-2xl font-bold mb-6">S7 Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white">
          <div className="text-sm text-white/60">Health</div>
          <div className="text-2xl font-bold mt-2">{health}</div>
        </div>
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white">
          <div className="text-sm text-white/60">Пользователи</div>
          <div className="text-2xl font-bold mt-2">{stats?.totalUsers ?? 0}</div>
        </div>
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white">
          <div className="text-sm text-white/60">Курсы</div>
          <div className="text-2xl font-bold mt-2">{stats?.totalCourses ?? 0}</div>
        </div>
      </div>

      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white">
        <div className="font-semibold mb-2">Быстрые действия</div>
        <div className="text-sm text-white/70">Скоро здесь будут инструменты админа для обслуживания платформы.</div>
      </div>
    </main>
  )
}
