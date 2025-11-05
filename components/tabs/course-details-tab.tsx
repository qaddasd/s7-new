"use client"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, BadgeInfo, LogIn, ShoppingCart, CheckCircle, ShieldAlert, Copy } from "lucide-react"
import { useConfirm } from "@/components/ui/confirm"
import { toast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { social } from "@/lib/site-config"

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
  const confirm = useConfirm()
  const [activeModuleId, setActiveModuleId] = useState<string | number>(course?.modules?.[0]?.id ?? 0)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [canAccess, setCanAccess] = useState<boolean>(false)
  const [fullCourse, setFullCourse] = useState<CourseDetails | null>(course)
  const [missions, setMissions] = useState<Array<{ id: string; title: string; target: number; progress: number; xpReward: number }>>([])
  const [showGame, setShowGame] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)
  const [gameQs, setGameQs] = useState<Array<{ id: string; text: string; options: string[]; xpReward?: number; level?: number }>>([])
  const [qIndex, setQIndex] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [answerInfo, setAnswerInfo] = useState<null | { correct: boolean; xpAwarded: number; correctIndex: number }>(null)
  const [levelStart, setLevelStart] = useState<number | null>(null)
  const [moduleFilterId, setModuleFilterId] = useState<string>("")
  const [lessonFilterId, setLessonFilterId] = useState<string>("")
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; id: string; name: string; xp: number }>>([])

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

  useEffect(() => {
    let ignore = false
    if (!course?.id) return
    apiFetch<any[]>(`/courses/${course.id}/missions`)
      .then((list) => {
        if (ignore) return
        const items = (list || []).map((m: any) => ({ id: m.id, title: m.title, target: Number(m.target||1), progress: Number(m.progress||0), xpReward: Number(m.xpReward||0) }))
        setMissions(items)
      })
      .catch(() => setMissions([]))
    return () => { ignore = true }
  }, [course?.id])

  useEffect(() => {
    let ignore = false
    if (!course?.id) return
    apiFetch<any[]>(`/courses/${course.id}/leaderboard`).then((rows)=>{
      if (ignore) return
      setLeaderboard((rows||[]).map((r:any)=>({ rank: r.rank, id: r.id, name: r.name, xp: Number(r.xp||0) })))
    }).catch(()=>setLeaderboard([]))
    return ()=>{ ignore = true }
  }, [course?.id])

  const openGame = async () => {
    if (!course?.id) return
    setShowGame(true)
    setGameLoading(true)
    setSelectedIdx(null)
    setAnswerInfo(null)
    setQIndex(0)
    try {
      const params = new URLSearchParams()
      if (moduleFilterId) params.set('moduleId', moduleFilterId)
      if (lessonFilterId) params.set('lessonId', lessonFilterId)
      if (typeof levelStart === 'number') params.set('levelMin', String(levelStart))
      const qsUrl = `/courses/${course.id}/questions${params.toString() ? `?${params.toString()}` : ''}`
      const list = await apiFetch<any[]>(qsUrl)
      const mapped = (list || []).map((q) => ({ id: q.id, text: q.text, options: q.options || [], xpReward: q.xpReward, level: q.level }))
      setGameQs(mapped)
    } catch {
      setGameQs([])
    } finally {
      setGameLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (selectedIdx === null || !gameQs[qIndex]) return
    try {
      const res = await apiFetch<{ isCorrect: boolean; correctIndex: number; xpAwarded: number }>(`/courses/questions/${gameQs[qIndex].id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ selectedIndex: selectedIdx })
      })
      setAnswerInfo({ correct: res.isCorrect, correctIndex: res.correctIndex, xpAwarded: res.xpAwarded || 0 })
      if (res.xpAwarded > 0) toast({ title: `+${res.xpAwarded} XP`, description: 'Ответ верный' })
      // refresh missions progress after answer
      if (course?.id) {
        apiFetch<any[]>(`/courses/${course.id}/missions`).then((list)=>{
          const items = (list || []).map((m: any) => ({ id: m.id, title: m.title, target: Number(m.target||1), progress: Number(m.progress||0), xpReward: Number(m.xpReward||0) }))
          setMissions(items)
        }).catch(()=>{})
      }
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось отправить ответ', variant: 'destructive' as any })
    }
  }

  const nextQuestion = () => {
    setSelectedIdx(null)
    setAnswerInfo(null)
    setQIndex((i) => i + 1)
  }

  const handlePurchase = () => {
    if (!user || !course) { toast({ title: "Войдите", description: "Войдите чтобы купить курс" }); return }
    setShowPayment(true)
  }

  const confirmPaymentSent = async () => {
    if (!user || !course) return
    const ok = await confirm({
      title: 'Вы точно отправили оплату?',
      description: 'Если вы не отправили перевод, не подтверждайте. Неправильное подтверждение замедлит обработку.',
      confirmText: 'Отправил',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!ok) return
    setIsPurchasing(true)
    try {
      const senderCode = (user.id || '').slice(-8)
      await apiFetch(`/courses/${course.id}/purchase`, {
        method: "POST",
        body: JSON.stringify({
          amount: course.price || 0,
          paymentMethod: "kaspi",
          payerFullName: user.fullName,
          senderCode,
        }),
      })
      toast({ title: "Заявка отправлена", description: "Как только оплата подтвердится, доступ будет открыт" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось отправить заявку", variant: "destructive" as any })
    } finally {
      setIsPurchasing(false)
      setShowPayment(false)
    }
  }

  if (!course) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white flex items-center gap-3">
          <BadgeInfo className="w-5 h-5 text-[#a0a0b0]" />
          <span>Курс не найден. Вернитесь назад и выберите курс.</span>
        </div>

      <div className="mt-10">
        <button
          onClick={() => canAccess && onOpenLesson?.(activeModule.id, activeModule?.lessons?.[0]?.id ?? 0)}
          disabled={!canAccess}
          className="w-full rounded-full h-12 bg-[#00a3ff] hover:bg-[#0088cc] text-black font-semibold disabled:opacity-50"
        >
          Продолжить
        </button>
      </div>
      </div>
    )
  }

  const viewCourse = fullCourse || course
  const activeModule = viewCourse.modules.find((m) => String(m.id) === String(activeModuleId)) || viewCourse.modules[0]
  const xpTarget = useMemo(() => {
    const sum = (missions || []).reduce((acc, m) => acc + (Number(m.xpReward || 0)), 0)
    return sum > 0 ? sum : 100
  }, [missions])
  const currentXp = Math.max(0, Number(user?.xp || 0))
  const xpProgress = xpTarget > 0 ? Math.min(100, Math.round((currentXp % xpTarget) / xpTarget * 100)) : 0

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      {/* Gamification header */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mb-8">
        <div className="relative bg-transparent">
          <div className="flex gap-6">
            <div className="w-16 bg-[#16161c] border border-[#2a2a35] rounded-2xl p-3 flex flex-col items-center justify-between">
              <div className="text-white/60 text-xs text-center">До получения сертификата</div>
              <div className="text-white font-bold text-lg">{xpTarget}xp</div>
              <div className="h-64 w-2 bg-[#0f0f14] rounded-full overflow-hidden my-3 border border-[#2a2a35]">
                <div className="bg-[#00a3ff] w-full" style={{ height: `${xpProgress}%` }} />
              </div>
            </div>
            <div className="relative flex-1 min-h-[280px]">
              {(missions.slice(0, 6)).map((m, i) => (
                <div
                  key={i}
                  className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#16161c] border border-[#2a2a35] text-white flex items-center justify-center shadow-sm"
                  style={{ left: `${i * 12}%`, top: `${i * 12}%` }}
                >
                  <div className="text-center leading-tight">
                    <div className="text-sm">{i + 1}</div>
                    <div className="text-[10px] text-[#00a3ff]">+{m.xpReward ?? 0}xp</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside>
          <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-5 text-white">
            <div className="text-white/80 text-sm mb-2">Ежедневные миссии</div>
            {missions.length === 0 ? (
              <div className="text-white/60 text-sm">Миссии пока не добавлены</div>
            ) : (
              <div className="space-y-3">
                {missions.slice(0,3).map((m,i)=>{
                  const pct = Math.min(100, Math.round((Number(m.progress)/Math.max(1, Number(m.target))) * 100))
                  return (
                    <div key={m.id} className="rounded-xl bg-[#0f0f14] border border-[#2a2a35] p-4">
                      <div className="font-semibold mb-1 truncate">{m.title}</div>
                      <div className="text-white/60 text-xs mb-2">Прогресс: {m.progress}/{m.target}</div>
                      <div className="h-2 w-full bg-[#1b1b22] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00a3ff]" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[#00a3ff] text-xs mt-2">+{m.xpReward}xp</div>
                    </div>
                  )
                })}
              </div>
            )}
      {showGame && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowGame(false)}>
          <div className="w-full max-w-2xl bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white animate-slide-up" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-medium">Игровой режим</div>
              <button onClick={() => setShowGame(false)} className="text-white/70 hover:text-white">Закрыть</button>
            </div>
            {gameLoading ? (
              <div className="text-white/60">Загрузка...</div>
            ) : gameQs.length === 0 ? (
              <div>
                <div className="text-white/60">Вопросов пока нет</div>
                <div className="mt-4 text-right">
                  <button onClick={()=>setShowGame(false)} className="rounded-lg bg-[#2a2a35] hover:bg-[#333344] px-4 py-2">Ок</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/70">Вопрос {qIndex + 1} из {gameQs.length}</div>
                  <div className="text-xs text-white/50 flex items-center gap-3">
                    {typeof gameQs[qIndex].level === 'number' && <span className="rounded-full bg-[#0f0f14] border border-[#2a2a35] px-2 py-1">Уровень: {gameQs[qIndex].level}</span>}
                    {typeof gameQs[qIndex].xpReward === 'number' && <span className="rounded-full bg-[#0f0f14] border border-[#2a2a35] px-2 py-1">+{gameQs[qIndex].xpReward} XP</span>}
                  </div>
                </div>
                <div className="text-base font-medium">{gameQs[qIndex].text}</div>
                <div className="grid grid-cols-1 gap-2">
                  {gameQs[qIndex].options.map((opt, i) => {
                    const isSelected = selectedIdx === i
                    const isAnswered = !!answerInfo
                    const isCorrect = isAnswered && i === (answerInfo?.correctIndex ?? -1)
                    const isWrongSelection = isAnswered && isSelected && !isCorrect
                    return (
                      <button
                        key={i}
                        onClick={() => !isAnswered && setSelectedIdx(i)}
                        className={`text-left rounded-lg px-4 py-3 border transition ${
                          isCorrect ? 'border-[#22c55e] bg-[#22c55e]/10' : isWrongSelection ? 'border-[#ef4444] bg-[#ef4444]/10' : isSelected ? 'border-[#00a3ff] bg-[#00a3ff]/10' : 'border-[#2a2a35] hover:bg-[#1b1b22]'
                        }`}
                        disabled={isAnswered}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-end gap-2">
                  {!answerInfo ? (
                    <button onClick={submitAnswer} disabled={selectedIdx===null} className="rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium px-4 py-2 disabled:opacity-50">Ответить</button>
                  ) : qIndex < gameQs.length - 1 ? (
                    <button onClick={nextQuestion} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] text-white px-4 py-2">Далее</button>
                  ) : (
                    <button onClick={()=>setShowGame(false)} className="rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium px-4 py-2">Завершить</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  if (!course?.id) return
                  const title = prompt('Название ежедневной миссии? (например: Ответь правильно 5 раз сегодня)') || 'Ежедневная миссия'
                  const target = Number(prompt('Цель (кол-во):', '5') || '5')
                  const xp = Number(prompt('XP за выполнение (по умолчанию 100):', '100') || '100')
                  apiFetch(`/courses/${course.id}/missions`, {
                    method: 'POST',
                    body: JSON.stringify({ title, target, xpReward: xp })
                  }).then(() => apiFetch<any[]>(`/courses/${course.id}/missions`))
                    .then((list) => {
                      const items = (list || []).map((m: any) => ({ id: m.id, title: m.title, target: Number(m.target||1), progress: Number(m.progress||0), xpReward: Number(m.xpReward||0) }))
                      setMissions(items)
                    })
                }}
                className="mt-4 w-full rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium py-2"
              >
                Добавить миссию
              </button>
            )}
          </div>
        </aside>
      </div>
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
          </div>

          {canAccess && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2">
                  <div className="text-white/60 text-xs mb-1">Уровень от</div>
                  <select value={String(levelStart ?? '')} onChange={(e)=> setLevelStart(e.target.value? Number(e.target.value): null)} className="w-full bg-transparent text-white text-sm outline-none">
                    <option value="" className="bg-[#0f0f14]">Все уровни</option>
                    {Array.from({length:10}).map((_,i)=> <option key={i+1} value={i+1} className="bg-[#0f0f14]">{i+1}</option>)}
                  </select>
                </div>
                <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2">
                  <div className="text-white/60 text-xs mb-1">Модуль</div>
                  <select value={moduleFilterId} onChange={(e)=>{ setModuleFilterId(e.target.value); setLessonFilterId('') }} className="w-full bg-transparent text-white text-sm outline-none">
                    <option value="" className="bg-[#0f0f14]">Все модули</option>
                    {viewCourse.modules.map((m)=> <option key={m.id} value={String(m.id)} className="bg-[#0f0f14]">{m.title}</option>)}
                  </select>
                </div>
                <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2">
                  <div className="text-white/60 text-xs mb-1">Урок</div>
                  <select value={lessonFilterId} onChange={(e)=> setLessonFilterId(e.target.value)} disabled={!moduleFilterId} className="w-full bg-transparent text-white text-sm outline-none disabled:opacity-50">
                    <option value="" className="bg-[#0f0f14]">Все уроки</option>
                    {(moduleFilterId ? (viewCourse.modules.find((m)=> String(m.id)===String(moduleFilterId))?.lessons||[]) : []).map((l)=> <option key={l.id} value={String(l.id)} className="bg-[#0f0f14]">{l.title}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={openGame}
                className="w-full rounded-full h-12 bg-[#00a3ff] hover:bg-[#0088cc] text-black font-semibold"
              >
                Игра
              </button>
            </div>
          )}

          
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

          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 text-white">
            <div className="text-white/80 text-sm mb-2">Лидерборд</div>
            {leaderboard.length === 0 ? (
              <div className="text-white/60 text-sm">Нет данных</div>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0,5).map((u)=> (
                  <div key={u.id} className="flex items-center justify-between bg-[#0f0f14] border border-[#2a2a35] rounded-full px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#00a3ff] text-black text-xs font-bold flex items-center justify-center">{u.rank}</div>
                      <div className="text-sm">{u.name}</div>
                    </div>
                    <div className="text-[#00a3ff] text-xs">{u.xp} XP</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        
          <div className="space-y-3">
            {activeModule?.lessons.map((lesson, lesIdx) => (
              <button
                key={lesson.id}
                onClick={() => canAccess ? onOpenLesson?.(activeModule.id, lesson.id) : setShowPayment(true)}
                disabled={!canAccess}
                className={`w-full flex items-center justify-between bg-[#16161c] border border-[#636370]/20 rounded-full px-4 py-3 text-white hover:bg-[#1b1b22] transition-colors ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            ))}
          </div>
          
        </aside>
      </div>

      
      {showPayment && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="w-full max-w-md bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white animate-slide-up">
            <div className="text-lg font-medium mb-2">Оплата через Kaspi</div>
            <div className="text-white/80 text-sm mb-4 space-y-1">
              <div>Сумма: <b>{course?.price?.toLocaleString()} ₸</b></div>
              <div>Номер Kaspi: <b>{social.phone}</b></div>
              <div className="mt-2">В комментарии укажите:</div>
              <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg p-3 text-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div>ФИО: <b>{user?.fullName ?? "Ваше ФИО"}</b></div>
                  <div>КОД: <b>{(user?.id ?? "код").slice(-8)}</b></div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${user?.fullName ?? ''} ${(user?.id ?? '').slice(-8)}`.trim())}
                  className="text-[#a0a0b0] hover:text-white"
                  aria-label="Скопировать"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-xs bg-[#0f0f14] border border-[#2a2a35] rounded-lg p-3">
              <div className="flex items-center gap-2 text-[#f59e0b]">
                <ShieldAlert className="w-4 h-4" />
                Подтверждаем вручную. Доступ откроется в течение 2 часов после проверки.
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setShowPayment(false)} className="rounded-lg bg-[#2a2a35] hover:bg-[#333344] py-2">Отмена</button>
              <button onClick={confirmPaymentSent} disabled={isPurchasing} className="rounded-lg bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium py-2 disabled:opacity-60">
                {isPurchasing ? 'Отправляем...' : 'Я отправил'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
