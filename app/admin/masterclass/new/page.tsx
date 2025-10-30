"use client"
import { useEffect, useState } from "react"
import { ArrowUpRight, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

export default function Page() {
  const router = useRouter()
  const confirm = useConfirm()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState<"online" | "offline" | "hybrid">("offline")
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState<number>(0)
  const [date, setDate] = useState<string>("") // ISO from input datetime-local
  const [location, setLocation] = useState<string>("")
  const [url, setUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const categories = ["Robotics", "Coding", "AI", "Design"]
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [customCats, setCustomCats] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem('s7_admin_mc_draft')
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.title) setTitle(d.title)
      if (d.description) setDescription(d.description)
      if (d.format) setFormat(d.format)
      if (typeof d.isFree === 'boolean') setIsFree(d.isFree)
      if (typeof d.price === 'number') setPrice(d.price)
      if (d.date) setDate(d.date)
      if (d.location) setLocation(d.location)
      if (d.url) setUrl(d.url)
      if (Array.isArray(d.categories)) {
        const map: Record<string, boolean> = {}
        d.categories.forEach((c: string) => map[c] = true)
        setSelected(map)
      }
      if (d.customCats) setCustomCats(d.customCats)
    } catch {}
  }, [])

  const publish = async () => {
    if (!title.trim()) { toast({ title: "Название обязательно" }); return }
    const ok = await confirm({ title: 'Опубликовать мастер-класс?', confirmText: 'Опубликовать', cancelText: 'Отмена' })
    if (!ok) return
    setLoading(true)
    try {
      const cats = [
        ...Object.keys(selected).filter((k) => selected[k]),
        ...customCats.split(',').map((s) => s.trim()).filter(Boolean),
      ]
      await apiFetch("/api/admin/events", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          audience: cats.join(', ') || undefined,
          format,
          isFree,
          price: isFree ? 0 : Number(price || 0),
          date: date ? new Date(date).toISOString() : undefined,
          location: location.trim() || undefined,
          url: url.trim() || undefined,
          status: "published",
        }),
      })
      toast({ title: "Событие создано" })
      try { localStorage.removeItem('s7_admin_mc_draft') } catch {}
      router.push("/admin/masterclass")
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось создать событие", variant: "destructive" as any })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Новый мастер-класс</h2>

      <div className="max-w-2xl space-y-5">
        
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-5 text-white">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название"
            className="w-full bg-transparent outline-none text-2xl md:text-3xl font-semibold placeholder-white/40"
          />
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full bg-[#f59e0b] text-black">
              формат
            </span>
            <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="bg-[#0f0f14] border border-[#2a2a35] text-white/80 text-xs rounded-full px-3 py-1 outline-none">
              <option value="offline">Оффлайн</option>
              <option value="online">Онлайн</option>
              <option value="hybrid">Гибрид</option>
            </select>
          </div>
        </div>

        
        <div className="flex items-center justify-between bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#2a2a35] text-white/80 flex items-center justify-center text-xs">1</span>
            <span className="font-medium">Описание</span>
          </div>
          <LogIn className="w-5 h-5 text-[#a0a0b0]" />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Текст описания..."
          className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-2xl p-4 text-white outline-none"
        />
        
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-4 text-white">
          <div className="text-white/80 mb-2">Категории</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [c]: !s[c] }))}
                className={`text-xs font-medium px-3 py-1 rounded-full border ${selected[c] ? 'bg-[#00a3ff] text-white border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Другие категории (через запятую)"
            value={customCats}
            onChange={(e) => setCustomCats(e.target.value)}
            className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white">
            <div className="text-white/70 text-xs mb-1">Дата и время</div>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none w-full" />
          </div>
          <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white">
            <div className="text-white/70 text-xs mb-1">Локация</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Адрес / Город" className="bg-transparent outline-none w-full" />
          </div>
          {format !== "offline" && (
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white">
              <div className="text-white/70 text-xs mb-1">Ссылка</div>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="bg-transparent outline-none w-full" />
            </div>
          )}
        </div>

        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const cats = [
                ...Object.keys(selected).filter((k) => selected[k]),
                ...customCats.split(',').map((s) => s.trim()).filter(Boolean),
              ]
              try {
                localStorage.setItem('s7_admin_mc_draft', JSON.stringify({ title, description, format, isFree, price, date, location, url, categories: cats, customCats }))
                toast({ title: 'Черновик сохранён' })
              } catch {}
            }}
            className="flex-1 rounded-2xl bg-[#2a2a35] hover:bg-[#333344] text-white font-medium py-4 transition-colors"
          >
            Сохранить черновик
          </button>
          <button onClick={publish} disabled={loading} className="flex-1 rounded-2xl bg-[#00a3ff] hover:bg-[#0088cc] disabled:opacity-60 text-black font-medium py-4 flex items-center justify-center gap-2 transition-colors">
            {loading ? 'Сохраняем...' : 'Опубликовать'}
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>

        
        <div className="flex items-center gap-3">
          <span className="text-white/70">Цена</span>
          <div className="rounded-full border border-[#2a2a35] p-1 flex items-center bg-[#0f0f14]">
            <button
              onClick={() => setIsFree(false)}
              className={`px-4 py-1 rounded-full text-sm ${!isFree ? "bg-[#111118] text-white" : "text-white/70"}`}
            >
              Цена
            </button>
            <button
              onClick={() => setIsFree(true)}
              className={`px-4 py-1 rounded-full text-sm ${isFree ? "bg-white text-black" : "text-white/70"}`}
            >
              Бесплатно
            </button>
          </div>
        </div>
        {!isFree && (
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="Введите цену"
            className="w-40 bg-[#0f0f14] border border-[#2a2a35] text-white rounded-lg px-3 py-2 outline-none"
          />
        )}
      </div>
    </main>
  )
}
