"use client"
import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

interface SubmissionItem {
  id: string
  title: string
  description?: string
  projectSummary?: string
  venue?: string
  placement?: string
  eventDate?: string
  imageUrl?: string
  status: "pending" | "approved" | "rejected"
  user: { id: string; email: string; fullName?: string }
  createdAt: string
}

export default function Page() {
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const confirm = useConfirm()

  const load = async () => {
    setLoading(true)
    try {
      const list = await apiFetch<SubmissionItem[]>("/api/admin/competition-submissions?" + (status !== "all" ? `status=${status}` : ""))
      setItems(list || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  const approve = async (id: string) => {
    const ok = await confirm({ title: "Одобрить заявку?", confirmText: "Одобрить", cancelText: "Отмена" })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/competition-submissions/${id}/approve`, { method: "POST" })
      toast({ title: "Одобрено" })
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "approved" } : x)))
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось одобрить", variant: "destructive" as any })
    }
  }

  const reject = async (id: string) => {
    const ok = await confirm({ title: "Отклонить заявку?", confirmText: "Отклонить", cancelText: "Отмена", variant: "danger" })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/competition-submissions/${id}/reject`, { method: "POST" })
      toast({ title: "Отклонено" })
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)))
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось отклонить", variant: "destructive" as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Заявки пользователей</h2>

      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 text-white mb-4">
        <div className="flex items-center gap-2">
          {["all","pending","approved","rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s as any)}
              className={`text-xs px-3 py-1 rounded-full border ${status===s? 'bg-[#00a3ff] text-black border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}
            >
              {s === "all" ? "Все" : s === "pending" ? "На проверке" : s === "approved" ? "Одобрено" : "Отклонено"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-white/70">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-white/60">Нет заявок</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white font-medium">{it.title}</div>
                  <div className="text-white/60 text-xs">{it.user.fullName || it.user.email} · {new Date(it.createdAt).toLocaleString('ru-RU')}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${it.status === 'approved' ? 'bg-[#22c55e]/20 text-[#22c55e]' : it.status === 'rejected' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>{it.status === 'pending' ? 'На проверке' : it.status === 'approved' ? 'Одобрено' : 'Отклонено'}</span>
              </div>
              <div className="text-white/80 text-sm space-y-1">
                {it.description && <div>{it.description}</div>}
                {it.projectSummary && <div>Проект: {it.projectSummary}</div>}
                {it.placement && <div>Место: {it.placement}</div>}
                {it.venue && <div>Локация: {it.venue}</div>}
                {it.eventDate && <div>Дата: {new Date(it.eventDate).toLocaleDateString('ru-RU')}</div>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {it.status !== 'approved' && <button onClick={() => approve(it.id)} className="text-xs bg-[#22c55e]/20 text-[#22c55e] rounded-full px-3 py-1 hover:bg-[#22c55e]/30">Одобрить</button>}
                {it.status !== 'rejected' && <button onClick={() => reject(it.id)} className="text-xs bg-[#ef4444]/20 text-[#ef4444] rounded-full px-3 py-1 hover:bg-[#ef4444]/30">Отклонить</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
