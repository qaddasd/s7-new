"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight, Eye, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

function BSCard({ id, title, tag, views, openHref, onDelete }: { id?: string; title: string; tag: string; views: number; openHref?: string; onDelete?: (id: string) => void }) {
  return (
    <div
      className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white min-h-[170px] relative animate-slide-up cursor-pointer"
      onClick={() => { if (openHref) window.open(openHref, '_blank') }}
      role={openHref ? 'button' : undefined}
      tabIndex={openHref ? 0 : -1}
    >
      <div className="flex items-center justify-between text-white/70 mb-6">
        <div className="inline-flex items-center gap-2 text-xs">
          <Eye className="w-4 h-4" /> {views}
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(id) }} className="p-1 rounded hover:bg-[#2a2a35]" title="Удалить">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
          {openHref ? (
            <a href={openHref} target="_blank" rel="noreferrer" title="Открыть видео" className="p-1 rounded hover:bg-[#2a2a35]">
              <ArrowUpRight className="w-5 h-5" />
            </a>
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>
      </div>
      <div className="text-xl font-semibold mb-6">{title}</div>
      <span className="inline-block bg-[#00a3ff] text-white text-xs font-medium px-3 py-1 rounded-full">
        {tag}
      </span>
    </div>
  )
}

interface AdminBS { id: string; title: string; description?: string; videoUrl: string; coverImageUrl?: string; createdAt: string; _count?: { likes: number }; _views?: number }

export default function Page() {
  const [items, setItems] = useState<AdminBS[]>([])
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()

  useEffect(() => {
    Promise.all([
      apiFetch<AdminBS[]>("/api/admin/bytesize").catch(() => [] as AdminBS[]),
      apiFetch<Array<{ id: string; views?: number }>>("/bytesize").catch(() => [] as Array<{ id: string; views?: number }>),
    ])
      .then(([adminList, feed]) => {
        const vMap = new Map(feed.map((f) => [f.id, f.views ?? 0]))
        const merged = (adminList || []).map((a) => ({ ...a, _views: vMap.get(a.id) ?? 0 }))
        setItems(merged)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const remove = async (id: string) => {
    const ok = await confirm({ title: 'Удалить видео?', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'danger' })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/bytesize/${id}`, { method: "DELETE" })
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast({ title: "Удалено" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось удалить", variant: "destructive" as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Byte Size</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        <Link href="/admin/bytesize/new" className="block">
          <BSCard title="Добавить" tag="Robotics" views={0} />
        </Link>
        {loading ? (
          <div className="text-white/60">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="text-white/60">Нет видео</div>
        ) : (
          items.map((v) => (
            <BSCard key={v.id} id={v.id} title={v.title} tag={"Robotics"} views={v._views ?? 0} openHref={v.videoUrl} onDelete={remove} />
          ))
        )}
      </div>
    </main>
  )
}
