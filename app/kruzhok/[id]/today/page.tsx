"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"

export default function KruzhokTodayPage() {
  const params = useParams()
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
          <div className="text-white/60">Класс 1</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{parts.day} {parts.month}</div>
          <div className="text-white/50">{parts.year}</div>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <div className="text-white font-semibold text-xl mb-4">Сегодня</div>
          <button className="w-full text-left rounded-2xl bg-[#16161c] border border-[#2a2a35] p-6 hover:border-[#00a3ff]/50 transition">
            <div className="text-white text-2xl font-semibold">Какойто урок</div>
          </button>
        </section>

        <section>
          <div className="text-white font-semibold text-xl mb-4">Настройки</div>
          <div className="space-y-4">
            <button className="w-full text-left rounded-2xl bg-[#16161c] border border-[#2a2a35] p-6 hover:border-[#00a3ff]/50 transition">
              <div className="text-white text-2xl font-semibold">Отчет прошлых уроков</div>
            </button>
            <button className="w-full text-left rounded-2xl bg-[#16161c] border border-[#2a2a35] p-6 hover:border-[#00a3ff]/50 transition">
              <div className="text-white text-2xl font-semibold">И тд</div>
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
