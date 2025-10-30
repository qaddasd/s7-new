"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

interface BytesizeItem { id: string; title: string; description?: string; duration?: number; xpReward?: number }

function BytesizeRow({ id, title, duration, xpReward, onDeleted }: { id: string; title: string; duration?: number; xpReward?: number; onDeleted: (id: string) => void }) {
  const confirm = useConfirm()
  
  const remove = async () => {
    const ok = await confirm({ 
      title: 'Удалить Bytesize?', 
      description: 'Вы уверены, что хотите удалить этот Bytesize? Все данные будут безвозвратно удалены. Это действие невозможно отменить.',
      confirmText: 'Удалить', 
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/bytesize/${id}`, { method: 'DELETE' })
      toast({ title: 'Bytesize удалён', description: 'Bytesize успешно удалён.' } as any)
      onDeleted(id)
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось удалить Bytesize. Попробуйте позже.', variant: 'destructive' as any })
    }
  }

  return (
    <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 text-white relative animate-slide-up">
      <div className="absolute top-4 right-4 text-white/70 flex items-center gap-2">
        <button onClick={remove} className="p-1 rounded hover:bg-[#2a2a35]" title="Удалить">
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>
        <ArrowUpRight className="w-6 h-6" />
      </div>
      <div className="text-white text-lg font-medium mb-1">{title}</div>
      <div className="text-[#a0a0b0] text-sm space-y-1">
        {duration && <div>Длительность: {duration} мин</div>}
        {xpReward && <div>Награда XP: {xpReward}</div>}
      </div>
      <div className="mt-3">
        <Link href={`/admin/bytesize/${id}`} className="text-xs bg-[#2a2a35] text-white/80 rounded-full px-3 py-1 hover:bg-[#333344]">
          Редактировать
        </Link>
      </div>
    </div>
  )
}

export default function AdminBytesize() {
  const [items, setItems] = useState<BytesizeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<BytesizeItem[]>("/api/admin/bytesize")
      .then((list) => setItems(list || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Bytesize</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {loading ? (
          <div className="text-white/60">Загрузка...</div>
        ) : items.length > 0 ? (
          items.map((it) => (
            <BytesizeRow
              key={it.id}
              id={it.id}
              title={it.title}
              duration={it.duration}
              xpReward={it.xpReward}
              onDeleted={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
            />
          ))
        ) : null}

        <Link href="/admin/bytesize/new" className="block md:col-span-2">
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white relative hover:bg-[#1a1a22] transition-colors cursor-pointer">
            <div className="absolute top-4 right-4 text-white/70">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div className="text-white text-lg font-medium">Добавить Bytesize</div>
          </div>
        </Link>
      </div>
    </main>
  )
}
