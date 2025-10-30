"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, BadgeInfo, LogIn, ShoppingCart, CheckCircle, ShieldAlert, Copy } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useConfirm } from "@/components/ui/confirm"
import { toast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
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
      </div>
    )
  }

  const viewCourse = fullCourse || course
  const activeModule = viewCourse.modules.find((m) => String(m.id) === String(activeModuleId)) || viewCourse.modules[0]

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
