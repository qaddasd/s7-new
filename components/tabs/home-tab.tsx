import { ArrowUpRight, Search } from "lucide-react"
import type { CourseDetails } from "@/components/tabs/course-details-tab"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

export default function HomeTab({
  onOpenCourse,
}: {
  onOpenCourse?: (course: CourseDetails) => void
}) {
  const [continueCourses, setContinueCourses] = useState<CourseDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<any[]>("/courses/continue")
      .then((list) => {
        const mapped: CourseDetails[] = (list || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          difficulty: c.difficulty || "",
          author: c.author?.fullName || "",
          price: Number(c.price || 0),
          modules: (c.modules || []).map((m: any) => ({ id: m.id, title: m.title, lessons: m.lessons || [] })),
        }))
        setContinueCourses(mapped)
      })
      .catch(() => setContinueCourses([]))
      .finally(() => setLoading(false))
  }, [])
  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-slide-up">
      
      <section className="mb-8 md:mb-12">
        <h2
          className="text-[var(--color-text-1)] text-xl font-medium mb-4 md:mb-6 animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          Продолжить
        </h2>
        {loading ? (
          <div className="text-[var(--color-text-3)]">Загрузка...</div>
        ) : continueCourses.length === 0 ? (
          <div className="text-[var(--color-text-3)] text-sm">Нет курсов для продолжения</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {continueCourses.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => onOpenCourse?.(c)}
                role="link"
                tabIndex={0}
                className="bg-[var(--color-surface-2)] border border-[var(--color-border-1)] rounded-2xl p-4 md:p-6 hover:border-[var(--color-border-hover-1)] transition-all duration-[var(--dur-mid)] cursor-pointer group hover:scale-102 animate-slide-up"
                style={{ animationDelay: `${300 + idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[var(--color-text-1)] text-lg font-medium mb-2">{c.title}</h3>
                    <span className="inline-block bg-[#22c55e] text-black text-xs font-medium px-3 py-1 rounded-full">
                      {c.difficulty || "Курс"}
                    </span>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-[var(--color-text-3)] group-hover:text-[var(--color-text-1)] transition-colors duration-[var(--dur-mid)]" />
                </div>
                <div className="text-[var(--color-text-3)] text-sm space-y-1">
                  <div>Автор: {c.author || "—"}</div>
                  <div>Уроков: {(c.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}</div>
                  <div>Стоимость: {c.price && c.price > 0 ? `${c.price.toLocaleString()}₸` : "0₸"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      

      
      <section>
        <h2
          className="text-[var(--color-text-1)] text-xl font-medium mb-4 md:mb-6 animate-slide-up"
          style={{ animationDelay: "800ms" }}
        >
          Новости
        </h2>
        <div
          className="bg-[var(--color-surface-2)] border border-[var(--color-border-1)] rounded-2xl p-6 md:p-8 text-center animate-slide-up"
          style={{ animationDelay: "900ms" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-black/20 border border-[var(--color-border-1)]">
            <Search className="w-7 h-7 text-[var(--color-text-3)]" />
          </div>
          <h3 className="text-[var(--color-text-1)] text-lg font-medium mb-2">Ничего не найдено</h3>
          <p className="text-[var(--color-text-3)] text-sm">Пока нет новостей</p>
        </div>
      </section>
    </main>
  )
}
