"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

export default function KruzhokDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const kruzhokId = params.id as string

  const now = useMemo(() => new Date(), [])
  const parts = useMemo(() => {
    const d = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(now).split(" ")
    return { day: d[0], month: d[1], year: d[2] }
  }, [now])

  return (
    <main className="container mx-auto p-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-3xl font-bold text-white mb-1">Панель управление</div>
          <div className="text-white/60">Кружок {kruzhokId}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{parts.day} {parts.month}</div>
          <div className="text-white/50">{parts.year}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: classes list */}
        <div className="space-y-4">
          {[1,2].map((n) => (
            <button
              key={n}
              onClick={() => router.push(`/kruzhok/${kruzhokId}/lessons`)}
              className="w-full text-left rounded-2xl bg-[#16161c] border border-[#2a2a35] p-6 hover:border-[#00a3ff]/50 transition"
            >
              <div className="text-white font-semibold mb-1">Класс #{n}</div>
              <div className="text-white/60 text-sm">Ментор: Hz</div>
            </button>
          ))}
        </div>

        {/* Right: calendar placeholder */}
        <Card className="min-h-[360px] bg-[#16161c] border-[#2a2a35] text-white flex items-center justify-center rounded-2xl">
          календарь уроков
        </Card>
      </div>
    </main>
  )
}
