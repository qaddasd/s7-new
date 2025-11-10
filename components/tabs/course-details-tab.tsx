"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, BadgeInfo, LogIn, ShoppingCart, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"

export interface CourseLesson {
  id: number
  title: string
  time?: string
  videoName?: string
  videoMediaId?: string
  slides?: string[]
  slideMediaIds?: string[]
  presentationFileName?: string
  presentationMediaId?: string
  content?: string
  videoUrl?: string
  presentationUrl?: string
  serverSlides?: any
}

export interface CourseModule {
  id: number
  title: string
  lessons: CourseLesson[]
}

export interface CourseDetails {
  id: string
  title: string
  difficulty: string
  author: string
  price?: number
  modules: CourseModule[]
}

export default function CourseDetailsTab({
  course,
  onBack,
  onOpenLesson,
}: {
  course: CourseDetails | null
  onBack: () => void
  onOpenLesson?: (moduleId: number | string, lessonId: number | string) => void
}) {
  const { user } = useAuth()
  const [activeModuleId, setActiveModuleId] = useState<string | number>(course?.modules?.[0]?.id ?? 0)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [canAccess, setCanAccess] = useState<boolean>(false)
  const [fullCourse, setFullCourse] = useState<CourseDetails | null>(course)
  const [isGameOpen, setIsGameOpen] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({})
  const [dailyMissions, setDailyMissions] = useState<Array<{ id: string; title: string; target: number; xpReward: number; type?: string; progress: number; completed: boolean }>>([])
  

  const isFree = !course?.price || course.price === 0

  useEffect(() => {
    let ignore = false
    if (!course?.id) return
    apiFetch<any>(`/courses/${course.id}`)
      .then((data) => {
        if (ignore) return
        setCanAccess(isFree ? true : Boolean(data.hasAccess))
        if (data && data.modules) setFullCourse({
          id: data.id,
          title: data.title,
          difficulty: data.difficulty,
          author: (data.author?.fullName ?? data.author) as any,
          price: Number(data.price || 0),
          modules: (data.modules || []).map((m: any) => ({
            id: Number(m.id) || m.id,
            title: m.title,
            lessons: (m.lessons || []).map((l: any) => ({
              id: Number(l.id) || l.id,
              title: l.title,
              time: l.duration,
              content: l.content,
              videoUrl: l.videoUrl,
              presentationUrl: l.presentationUrl,
              serverSlides: l.slides,
            })),
          })),
        } as any)
      })
      .catch(() => setCanAccess(isFree))
    return () => { ignore = true }
  }, [course?.id, isFree])

  // Load lesson progress to gate next lessons
  useEffect(() => {
    let alive = true
    if (!course?.id || !canAccess) { setCompletedLessons({}); return }
    apiFetch<any>(`/courses/${course.id}/progress`)
      .then((data) => {
        if (!alive) return
        const map: Record<string, boolean> = {}
        for (const p of data?.lessons || []) {
          if (p?.lessonId && p?.isCompleted) map[String(p.lessonId)] = true
        }
        setCompletedLessons(map)
      })
      .catch(() => setCompletedLessons({}))
    return () => { alive = false }
  }, [course?.id, canAccess])


  const handlePurchase = () => {
    if (!user || !course) { toast({ title: "Войдите", description: "Войдите чтобы купить курс" }); return }
    setShowPayment(true)
  }

  // simplified payment flow: instruction only

  // close game modal on Escape
  useEffect(() => {
    if (!isGameOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsGameOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isGameOpen])

  // load daily missions when game opens
  useEffect(() => {
    let alive = true
    if (!isGameOpen || !course?.id) return
    apiFetch<any[]>(`/courses/${course.id}/missions`)
      .then((data) => { if (alive) setDailyMissions(Array.isArray(data) ? data : []) })
      .catch(() => { if (alive) setDailyMissions([]) })
    return () => { alive = false }
  }, [isGameOpen, course?.id])

  if (!course) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white flex items-center gap-3">
          <BadgeInfo className="w-5 h-5 text-[#a0a0b0]" />
          <span>Курс не найден. Вернитесь назад и выберите курс.</span>
        </div>
      </div>
    )
  }

  const viewCourse = fullCourse || course
  const activeModule = viewCourse.modules.find((m) => String(m.id) === String(activeModuleId)) || viewCourse.modules[0]
  const firstIncompleteInModule = (activeModule?.lessons || []).find((l) => !completedLessons[String(l.id)])
  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Aqtobe' })
  const xpValue = Math.max(0, Math.min(100, Number((user as any)?.xp ?? (user as any)?.experiencePoints ?? 0)))

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      
      <div className="mb-6 flex items-center gap-2 text-white">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
          aria-label="Назад к курсам"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Курсы</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        
        <section className="space-y-6">
          
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-medium">{course.title}</h2>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block bg-[#f59e0b] text-black text-xs font-medium px-3 py-1 rounded-full">
                    {course.difficulty}
                  </span>
                  <span className="text-white/70 text-sm">{course.author}</span>
                </div>
              </div>
              <div className="text-right">
                {course.price && course.price > 0 ? (
                  <div className="text-2xl font-bold text-[#00a3ff]">{course.price.toLocaleString()} ₸</div>
                ) : (
                  <div className="text-xl font-medium text-[#22c55e]">Бесплатно</div>
                )}
              </div>
            </div>
            
            
            {!isFree && !canAccess && (
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || !user}
                className="w-full bg-[#00a3ff] hover:bg-[#0088cc] text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {isPurchasing ? 'Покупаем...' : 'Купить курс'}
              </button>
            )}
            {canAccess && !isFree && (
              <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-4 text-center">
                <div className="text-[#22c55e] font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Доступ к курсу открыт
                </div>
              </div>
            )}

            {canAccess && (
              <div className="mt-3">
                <button
                  onClick={() => setIsGameOpen(true)}
                  className="w-full rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-semibold py-3"
                >
                  Игра
                </button>
              </div>
            )}
          </div>

          

          
          <div className="space-y-3">
            {viewCourse.modules.map((mod, modIdx) => (
              <button
                key={mod.id}
                onClick={() => canAccess ? setActiveModuleId(mod.id) : setShowPayment(true)}
                disabled={!canAccess}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-4 border transition-all duration-200 text-white ${
                  activeModuleId === mod.id && canAccess
                    ? "bg-[#1b1b22] border-[#636370]/30"
                    : "bg-[#16161c] border-[#636370]/20 hover:bg-[#1b1b22]"
                } ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold">
                    {modIdx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{mod.title}</div>
                  </div>
                </div>
                <LogIn className="w-5 h-5 text-[#a0a0b0]" />
              </button>
            ))}
          </div>
        </section>

        
        <aside className="space-y-4">
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 text-white">
            <div className="rounded-full bg-[#1b1b22] px-4 py-2 text-white/80 inline-block">
              {activeModule?.title}
            </div>
          </div>

          <div className="space-y-3">
            {activeModule?.lessons.map((lesson, lesIdx) => {
              const unlocked = canAccess && (completedLessons[String(lesson.id)] || !firstIncompleteInModule || String(lesson.id) === String(firstIncompleteInModule.id))
              return (
                <button
                  key={lesson.id}
                  onClick={() => unlocked ? onOpenLesson?.(activeModule.id, lesson.id) : setShowPayment(true)}
                  disabled={!unlocked}
                  className={`w-full flex items-center justify-between bg-[#16161c] border border-[#636370]/20 rounded-full px-4 py-3 text-white transition-colors ${unlocked ? 'hover:bg-[#1b1b22]' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold">
                      {lesIdx + 1}
                    </div>
                    <div>
                      <div className="font-medium">{lesson.title}</div>
                    </div>
                  </div>
                  <div className="text-white/60 text-sm">{lesson.time ?? "10:21"}</div>
                </button>
              )
            })}
          </div>
          
        </aside>
      </div>

      
      {isGameOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setIsGameOpen(false)}>
          <div className="absolute inset-0 p-6 md:p-10" onClick={(e) => e.stopPropagation()}>
            <div className="h-full w-full bg-[#0f0f14] border border-[#2a2a35] rounded-2xl text-white relative overflow-hidden">
              <button onClick={() => setIsGameOpen(false)} className="absolute top-3 right-3 rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1 text-sm">Закрыть</button>
              <div className="absolute top-3 right-16 md:top-4 md:right-20 text-white text-xl md:text-2xl">{dateStr}</div>
              <div className="flex h-full">
                <div className="hidden md:flex flex-col items-center justify-center w-28 p-4 border-r border-[#2a2a35]">
                  <div className="text-xs text-white/60 mb-1 text-center">До получения сертификата</div>
                  <div className="text-lg font-semibold mb-3">100xp</div>
                  <div className="h-64 w-2 rounded-full bg-[#1b1b22] overflow-hidden">
                    <div className="w-2 bg-[#00a3ff]" style={{ height: xpValue + '%' }}></div>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 p-6">
                    {((activeModule?.lessons || []).length === 0) && (
                      <div className="text-white/60">Уроков нет</div>
                    )}
                    {(activeModule?.lessons || []).map((lesson, i) => {
                      const top = 40 + i * 80
                      const left = 40 + ((i % 2) * 160)
                      const unlocked = canAccess && (completedLessons[String(lesson.id)] || !firstIncompleteInModule || String(lesson.id) === String(firstIncompleteInModule.id))
                      return (
                        <button
                          key={lesson.id}
                          style={{ position: 'absolute', top, left }}
                          onClick={() => { if (unlocked) { setIsGameOpen(false); onOpenLesson?.(activeModule.id, lesson.id) } else { setShowPayment(true) }}}
                          disabled={!unlocked}
                          className={`w-16 h-16 rounded-full bg-[#16161c] border border-[#2a2a35] text-white/90 flex items-center justify-center shadow-lg ${unlocked ? 'hover:bg-[#1b1b22] transition-colors' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          <div className="text-center">
                            <div className="text-lg leading-none">{i + 1}</div>
                            <div className="text-[10px] text-[#00a3ff]">+20xp</div>
                          </div>
                        </button>
                      )
                    })}
                    <div className="absolute left-0 right-0 bottom-8 flex justify-center">
                      <button
                        onClick={() => {
                          const first = firstIncompleteInModule || activeModule?.lessons?.[0]
                          if (!first) return 
                          if (!canAccess) { setShowPayment(true); return }
                          setIsGameOpen(false)
                          onOpenLesson?.(activeModule.id, first.id)
                        }}
                        className="w-full max-w-3xl rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-semibold py-4"
                      >
                        Продолжить
                      </button>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex flex-col w-72 p-4 border-l border-[#2a2a35]">
                  <div className="text-sm font-medium mb-2">Ежедневные миссии</div>
                  {dailyMissions.map((m) => {
                    const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0
                    return (
                      <div key={m.id} className="bg-[#16161c] border border-[#2a2a35] rounded-xl p-4 mb-3">
                        <div className="text-white/90 text-sm">{m.title}</div>
                        <div className="text-white/60 text-xs mb-2">{m.progress}/{m.target}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#1b1b22] rounded-full overflow-hidden">
                            <div className="h-2 bg-[#00a3ff]" style={{ width: `${pct}%` }}></div>
                          </div>
                          <div className="text-[#00a3ff] text-xs">+{m.xpReward}xp</div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="bg-[#16161c] border border-[#2a2a35] rounded-xl p-4 h-24 opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showPayment && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white animate-slide-up">
            <div className="text-lg font-medium mb-2">Оплата курса</div>
            <div className="text-white/90 text-sm mb-4">
              Просто переведите <b>2000 ₸</b> на номер Kaspi: <b>+7 776 045 7776</b> <span className="whitespace-nowrap">с комментарием</span>. После перевода мы откроем доступ вручную.
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowPayment(false)} className="rounded-full bg-[#1b1b22] border border-[#2a2a35] px-4 py-2 text-white/90">Понятно</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
