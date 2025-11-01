"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Kruzhok {
  id: string
  name: string
  description?: string
  maxCapacity: number
  isActive: boolean
  admin?: { id: string; fullName: string }
  _count?: { members: number }
}

export default function KruzhokPage() {
  const [allKruzhoks, setAllKruzhoks] = useState<Kruzhok[]>([])
  const [myKruzhoks, setMyKruzhoks] = useState<Kruzhok[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "my">("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allData, myData] = await Promise.all([
        apiFetch<Kruzhok[]>("/api/kruzhok"),
        apiFetch<Kruzhok[]>("/api/kruzhok/my-clubs"),
      ])
      setAllKruzhoks(allData || [])
      setMyKruzhoks(myData || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить кружки",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const renderKruzhokCard = (kruzhok: Kruzhok, isEnrolled: boolean) => (
    <div
      key={kruzhok.id}
      className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 hover:border-[#00a3ff]/50 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-bold text-lg">
          {kruzhok.name.charAt(0).toUpperCase()}
        </div>
        {isEnrolled && (
          <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs font-medium px-3 py-1 rounded-full">
            Вы участник
          </span>
        )}
      </div>

      <h3 className="text-white font-bold text-lg mb-2">{kruzhok.name}</h3>

      {kruzhok.description && (
        <p className="text-white/60 text-sm mb-4 line-clamp-2">{kruzhok.description}</p>
      )}

      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="text-white/60">
          {kruzhok._count?.members || 0} участников
          {kruzhok.maxCapacity > 0 && ` / ${kruzhok.maxCapacity}`}
        </div>
        {kruzhok.admin && (
          <div className="text-white/60">
            Руководитель: <span className="text-white">{kruzhok.admin.fullName}</span>
          </div>
        )}
      </div>

      <Link href={`/kruzhok/${kruzhok.id}`}>
        <Button className="w-full bg-[#00a3ff] text-black hover:bg-[#0088cc]">
          {isEnrolled ? "Просмотреть" : "Подробнее"}
        </Button>
      </Link>
    </div>
  )

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
        <div className="text-white/70">Загрузка...</div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h1 className="text-white text-2xl font-bold mb-6">Кружки</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "all"
              ? "bg-[#00a3ff] text-black"
              : "bg-[#16161c] text-white hover:bg-[#1e1e26]"
          }`}
        >
          Все кружки ({allKruzhoks.length})
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "my"
              ? "bg-[#00a3ff] text-black"
              : "bg-[#16161c] text-white hover:bg-[#1e1e26]"
          }`}
        >
          Мои кружки ({myKruzhoks.length})
        </button>
      </div>

      {activeTab === "all" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allKruzhoks.length === 0 ? (
            <div className="col-span-full text-white/60 text-center py-8">
              Нет доступных кружков
            </div>
          ) : (
            allKruzhoks.map((kruzhok) => {
              const isEnrolled = myKruzhoks.some((m) => m.id === kruzhok.id)
              return renderKruzhokCard(kruzhok, isEnrolled)
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myKruzhoks.length === 0 ? (
            <div className="col-span-full text-white/60 text-center py-8">
              Вы еще не присоединились ни к одному кружку
            </div>
          ) : (
            myKruzhoks.map((kruzhok) => renderKruzhokCard(kruzhok, true))
          )}
        </div>
      )}
    </main>
  )
}
