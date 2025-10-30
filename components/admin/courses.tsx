"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

interface AdminCourse {
  id: string
  title: string
  difficulty: string
  price: number
  isFree: boolean
  modules: Array<{ id: string; title: string; lessons: Array<{ id: string; title: string }> }>
}

const generateDraftId = () => {
  const random = typeof crypto !== "undefined" && crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint32Array(2))).map((n) => n.toString().padStart(10, "0")).join("").slice(0, 10)
    : `${Math.floor(1000000000 + Math.random() * 9000000000)}`
  return `s7-${random}`
}

function CourseCard({ id, title, level, price, lessonsCount, onDeleted }: { id: string; title: string; level: string; price: number; lessonsCount: number; onDeleted: (id: string) => void }) {
  const confirm = useConfirm()
  return (
    <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white relative">
      <div className="absolute top-4 right-4 text-white/70">
        <ArrowUpRight className="w-6 h-6" />
      </div>
      <div className="text-white text-lg font-medium mb-2">{title}</div>
      <span className="inline-block bg-[#22c55e] text-black text-xs font-medium px-3 py-1 rounded-full mb-4">
        {level}
      </span>
      <div className="text-[#a0a0b0] text-sm space-y-1">
        <div>Уроков: {lessonsCount}</div>
        <div>Стоимость: {price > 0 ? `${Number(price).toLocaleString()}₸` : '0₸'}</div>
      </div>
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <Link href={`/admin/courses/${encodeURIComponent(id)}/quiz`} className="text-xs bg-[#2a2a35] text-white/80 rounded-full px-3 py-1 hover:bg-[#333344]">
          Вопросы
        </Link>
        <Link href={`/admin/courses/${encodeURIComponent(id)}/analytics`} className="text-xs bg-[#2a2a35] text-white/80 rounded-full px-3 py-1 hover:bg-[#333344]">
          Аналитика
        </Link>
        <button
          onClick={async () => {
            const ok = await confirm({ 
              title: 'Удалить курс?', 
              description: 'Вы уверены, что хотите удалить этот курс? Все модули, уроки и данные пользователей, связанные с этим курсом, будут безвозвратно удалены. Это действие невозможно отменить.',
              confirmText: 'Удалить', 
              cancelText: 'Отмена',
              variant: 'danger' 
            })
            if (!ok) return
            try {
              await apiFetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
              toast({ title: 'Курс удалён', description: 'Курс успешно удалён.' } as any)
              onDeleted(id)
            } catch (e: any) {
              toast({ title: 'Ошибка', description: e?.message || 'Не удалось удалить курс. Попробуйте позже.', variant: 'destructive' as any })
            }
          }}
          className="text-xs bg-[#ef4444] text-white rounded-full px-3 py-1 hover:bg-[#dc2626]"
        >
          Удалить
        </button>
      </div>
      <Link
        href={`/admin/courses/new?edit=${encodeURIComponent(id)}`}
        className="absolute bottom-4 right-4 text-xs bg-[#2a2a35] text-white/80 rounded-full px-3 py-1 hover:bg-[#333344]"
      >
        Редакт.
      </Link>
    </div>
  )
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState<string>("Все")
  const [price, setPrice] = useState<"all" | "free" | "paid">("all")
  const [q, setQ] = useState("")
  const draftId = useMemo(() => generateDraftId(), [])

  useEffect(() => {
    apiFetch<AdminCourse[]>("/api/admin/courses")
      .then((list) => {
        if (Array.isArray(list)) setCourses(list)
        else setCourses([])
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem('s7_admin_courses')
          const list = raw ? JSON.parse(raw) : []
          setCourses(list || [])
        } catch {
          setCourses([])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Курсы</h2>
      
      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            {(["Все","Легкий","Средний","Сложный"] as string[]).map((lvl)=> (
              <button
                key={lvl}
                className={`text-xs px-3 py-1 rounded-full border ${difficulty===lvl ? 'bg-[#00a3ff] text-black border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}
                onClick={()=>setDifficulty(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {(["all","free","paid"] as Array<"all"|"free"|"paid">).map((p)=> (
              <button
                key={p}
                className={`text-xs px-3 py-1 rounded-full border ${price===p ? 'bg-white text-black border-white' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}
                onClick={()=>setPrice(p)}
              >
                {p === 'all' ? 'Все' : p === 'free' ? 'Бесплатные' : 'Платные'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Поиск по названию"
            className="w-full md:w-64 bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 outline-none text-white/80"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={`/admin/courses/new?fresh=1&draft=${encodeURIComponent(draftId)}`} className="block">
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white relative hover:bg-[#1b1b22] transition-colors">
            <div className="absolute top-4 right-4 text-white/70">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div className="text-white text-lg font-medium">Создать курс</div>
          </div>
        </Link>
        {loading ? (
          <div className="text-white/60">Загрузка...</div>
        ) : courses.length === 0 ? (
          <div className="text-white/60">Курсов пока нет</div>
        ) : (
          courses
            .filter((c) => (difficulty === "Все" ? true : (c.difficulty || "").toLowerCase() === difficulty.toLowerCase()))
            .filter((c) => (price === 'all' ? true : price === 'free' ? (c as any).isFree || Number((c as any).price || 0) === 0 : Number((c as any).price || 0) > 0))
            .filter((c) => (q.trim() ? c.title.toLowerCase().includes(q.trim().toLowerCase()) : true))
            .map((c) => (
            <CourseCard
              key={c.id}
              id={c.id}
              title={c.title}
              level={c.difficulty}
              price={Number((c as any).price || 0)}
              lessonsCount={c.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}
              onDeleted={(id) => setCourses((prev) => prev.filter((x) => x.id !== id))}
            />
          ))
        )}
      </div>
    </main>
  )
}


