"use client"
import { ExternalLink, Plus, Phone, MessageCircle, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { toast } from "@/hooks/use-toast"
import { linkFor } from "@/lib/site-config"

interface EventItem {
  id: string
  title: string
  description?: string
  audience?: string
  contact?: string
  date?: string
  imageUrl?: string
  url?: string
}

export default function S7ToolsTab() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventItem[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", audience: "", contact: "", date: "", imageUrl: "" })

  useEffect(() => {
    apiFetch<EventItem[]>("/events")
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [])

  const submitEvent = async () => {
    if (!user) { toast({ title: "Войдите", description: "Требуется авторизация" }); return }
    if (!form.title.trim()) return
    try {
      await apiFetch("/events", { method: "POST", body: JSON.stringify(form) })
      toast({ title: "Отправлено на модерацию" })
      setOpen(false)
      setForm({ title: "", description: "", audience: "", contact: "", date: "", imageUrl: "" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось отправить" as any, variant: "destructive" as any })
    }
  }

  return (
    <div className="flex-1 p-8 animate-slide-up">
      <div className="mb-8">
        <h2 className="text-white text-xl mb-6">Соревнования и события</h2>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev, index) => (
            <div
              key={ev.id}
              className={`bg-[#16161c] border border-[#636370]/20 text-white rounded-lg p-6 hover:scale-102 transition-all duration-200 group animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className={`text-lg font-medium group-hover:text-[#00a3ff] transition-colors duration-200`}>{ev.title}</h3>
                {ev.url && (
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" aria-label="Открыть ссылку" className="inline-flex">
                    <ExternalLink className={`w-5 h-5 text-[#a0a0b0] group-hover:text-[#00a3ff] transition-colors duration-200`} />
                  </a>
                )}
              </div>
              <div className="text-[#a0a0b0] text-sm line-clamp-3">{ev.description}</div>
              {ev.date && <div className="text-xs text-white/60 mt-3">Дата: {new Date(ev.date).toLocaleString("ru-RU")}</div>}
            </div>
          ))}
        </div>

        
        <div className="mt-12 pt-8 border-t border-[#636370]/20 animate-slide-up" style={{ animationDelay: "600ms" }}>
          <p className="text-[#a0a0b0] mb-4">Проводишь мероприятие и ищешь участников? Опубликуй его:</p>
          <button onClick={() => setOpen(true)} aria-label="Добавить мероприятие" className="w-12 h-12 bg-[#00a3ff] rounded-full flex items-center justify-center hover:bg-[#0088cc] transition-colors duration-200">
            <Plus className="text-white w-6 h-6" />
          </button>
        </div>

        
        <div className="mt-8 animate-slide-up" style={{ animationDelay: "700ms" }}>
          <p className="text-[#a0a0b0] mb-4">Вопросы? Свяжись с нами:</p>
          <div className="flex gap-4">
            <a href={linkFor("phone")} className="w-12 h-12 bg-[#00a3ff] rounded-full flex items-center justify-center hover:bg-[#0088cc] transition-colors duration-200" aria-label="Позвонить" title="Позвонить">
              <Phone className="text-white w-5 h-5" />
            </a>
            <a href={linkFor("telegram")} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#00a3ff] rounded-full flex items-center justify-center hover:bg-[#0088cc] transition-colors duration-200" aria-label="Telegram" title="Telegram">
              <MessageCircle className="text-white w-5 h-5" />
            </a>
            <a href={linkFor("email")} className="w-12 h-12 bg-[#00a3ff] rounded-full flex items-center justify-center hover:bg-[#0088cc] transition-colors duration-200" aria-label="Email" title="Email">
              <Mail className="text-white w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      
      {open && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
          <div className="w-[min(92vw,640px)] bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white shadow-xl">
            <div className="text-lg font-medium mb-4">Опубликовать мероприятие</div>
            <div className="grid grid-cols-1 gap-3">
              <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Название" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none" />
              <textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Описание" rows={4} className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none" />
              <input value={form.audience} onChange={(e)=>setForm({...form,audience:e.target.value})} placeholder="Для кого" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none" />
              <input value={form.contact} onChange={(e)=>setForm({...form,contact:e.target.value})} placeholder="Контакты" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none" />
              <input value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} placeholder="Дата и время (напр. 2025-10-05 18:00)" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none" />
              <input value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value})} placeholder="Ссылка на изображение (по желанию)" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={()=>setOpen(false)} className="rounded-lg bg-[#2a2a35] hover:bg-[#333344] py-2">Отмена</button>
              <button onClick={submitEvent} className="rounded-lg bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium py-2">Отправить</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
