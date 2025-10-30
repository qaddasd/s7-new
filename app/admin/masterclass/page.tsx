"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

function MCItem({
  title,
  badge,
  location,
  date,
  price,
  onDelete,
  onView,
}: {
  title: string
  badge: string
  location?: string
  date?: string
  price?: string
  onDelete?: () => void
  onView?: () => void
}) {
  return (
    <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white relative animate-slide-up">
      <div className="absolute top-4 right-4 text-white/70">
        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="p-1 rounded hover:bg-[#2a2a35]" title="Удалить">
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
          <ArrowUpRight className="w-6 h-6" />
        </div>
      </div>
      <div className="text-white text-lg font-medium mb-3">{title}</div>
      <span className="inline-block bg-[#00a3ff] text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
        {badge}
      </span>
      <div className="text-[#a0a0b0] text-sm space-y-1">
        {location && <div>Локация: {location}</div>}
        {date && <div>Дата: {date}</div>}
        {price && <div>Стоимость участия: {price}</div>}
      </div>
      <div className="mt-4">
        <button onClick={onView} className="text-xs bg-[#2a2a35] text-white/80 rounded-full px-3 py-1 hover:bg-[#333344]">Заявки</button>
      </div>
    </div>
  )
}

interface AdminEvent { id: string; title: string; date?: string; format?: string; isFree?: boolean; price?: number; location?: string }

export default function Page() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [openRegs, setOpenRegs] = useState<{ open: boolean; eventId?: string; title?: string }>({ open: false })
  const [regs, setRegs] = useState<Array<{ id: string; status: string; contactPhone?: string; user: { id: string; email: string; fullName?: string } }>>([])
  const confirm = useConfirm()

  useEffect(() => {
    apiFetch<AdminEvent[]>("/api/admin/events")
      .then((list) => setEvents(list || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  const deleteEvent = async (id: string) => {
    const ok = await confirm({ title: 'Удалить событие?', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'danger' })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/events/${id}`, { method: "DELETE" })
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast({ title: "Удалено" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось удалить", variant: "destructive" as any })
    }
  }
  const viewRegs = async (eventId: string, title: string) => {
    setOpenRegs({ open: true, eventId, title })
    try {
      const list = await apiFetch<Array<{ id: string; status: string; contactPhone?: string; user: { id: string; email: string; fullName?: string } }>>(`/api/admin/events/${eventId}/registrations`)
      setRegs(list || [])
    } catch {
    }
  }
  const bulkDelete = async () => {
    const ok = await confirm({ title: 'Удалить все мастер-классы?', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'danger' })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/events`, { method: 'DELETE' })
      setEvents([])
      toast({ title: 'Все события удалены' })
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось удалить', variant: 'destructive' as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Мастер-классы</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        <div className="md:col-span-2 flex justify-end">
          <button onClick={bulkDelete} className="text-xs bg-[#ef4444]/20 text-[#ef4444] rounded-full px-3 py-1 hover:bg-[#ef4444]/30">Удалить все</button>
        </div>
        {loading ? (
          <div className="text-white/60">Загрузка...</div>
        ) : events.length > 0 ? (
          events.map((it) => (
            <MCItem
              key={it.id}
              title={it.title}
              badge={it.format ? it.format.toUpperCase() : "—"}
              location={it.location}
              date={it.date ? new Date(it.date).toLocaleString('ru-RU') : undefined}
              price={it.isFree ? "Бесплатно" : `${Number(it.price || 0).toLocaleString()} ₸`}
              onDelete={() => deleteEvent(it.id)}
              onView={() => viewRegs(it.id, it.title)}
            />
          ))
        ) : null}

        <Link href="/admin/masterclass/new" className="block md:col-span-2">
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white relative hover:bg-[#1a1a22] transition-colors cursor-pointer">
            <div className="absolute top-4 right-4 text-white/70">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div className="text-white text-lg font-medium">Добавить мастер класс</div>
          </div>
        </Link>
      </div>
      
      {openRegs.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-full max-w-xl bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white">
            <div className="text-lg font-medium mb-4">Заявки: {openRegs.title}</div>
            {regs.length === 0 ? (
              <div className="text-white/60">Нет заявок</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {regs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2">
                    <div>
                      <div className="text-white/90">{r.user.fullName || r.user.email}</div>
                      <div className="text-white/60 text-xs">{r.contactPhone || '—'} · {r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-right">
              <button onClick={() => setOpenRegs({ open: false })} className="rounded-lg bg-[#2a2a35] hover:bg-[#333344] py-2 px-3">Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
