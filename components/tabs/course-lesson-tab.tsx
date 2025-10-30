"use client"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Info, Play, Image, Lock, FileText } from "lucide-react"
import type { CourseDetails } from "@/components/tabs/course-details-tab"
import { useAuth } from "@/components/auth/auth-context"
import dynamic from "next/dynamic"
import { getObjectUrl } from "@/lib/s7media"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
const ReactMarkdown = dynamic(() => import("react-markdown").then((m) => m.default as any), { ssr: false }) as any

function resolveMediaUrl(u?: string | null): string {
  try {
    const s = String(u || "").trim()
    if (!s) return ""
    if (s.startsWith("http://") || s.startsWith("https://")) {
      try {
        const url = new URL(s)
        if (url.pathname.startsWith("/media/")) {
          return new URL(url.pathname.replace("/media/", "/api/media/"), window.location.origin).href
        }
        return s
      } catch {
        return s
      }
    }
    const path = s.startsWith("/media/") ? s.replace("/media/", "/api/media/") : s
    return new URL(path, window.location.origin).href
  } catch {
    return String(u || "")
  }
}

export default function CourseLessonTab({
  course,
  moduleId,
  lessonId,
  onBack,
}: {
  course: CourseDetails | null
  moduleId: number | string | null
  lessonId: number | string | null
  onBack: () => void
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const { user } = useAuth()
  const [canAccess, setCanAccess] = useState<boolean>(false)
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!course?.id) { setCanAccess(false); return }
      try {
        const data = await apiFetch<any>(`/courses/${course.id}`)
        if (alive) setCanAccess(Boolean(data?.isFree || data?.hasAccess))
      } catch {
        if (alive) setCanAccess(Boolean(!course?.price || course?.price === 0))
      }
    })()
    return () => { alive = false }
  }, [course?.id, course?.price, user?.id])
  if (!course || moduleId == null || lessonId == null) {
    return (
      <div className="flex-1 p-8">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white transition-colors inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>К курсу</span>
        </button>
        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 text-white">
          Не удалось загрузить урок.
        </div>
      </div>
    )
  }

  const mod = course.modules.find((m) => String(m.id) === String(moduleId)) || course.modules[0]
  const lesson = mod.lessons.find((l) => String(l.id) === String(lessonId)) || mod.lessons[0]
  const modIndex = course.modules.findIndex((m) => String(m.id) === String((mod as any)?.id))
  const lessonIndex = mod.lessons.findIndex((l) => String(l.id) === String((lesson as any)?.id))

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [slideUrls, setSlideUrls] = useState<(string | null)[]>([])
  const [presUrl, setPresUrl] = useState<string | null>(null)
  const [lessonContent, setLessonContent] = useState<string>(lesson?.content || "")
  const [lessonQuiz, setLessonQuiz] = useState<Array<any>>([])
  const [loadingQuiz, setLoadingQuiz] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if ((lesson as any)?.videoUrl) {
        setVideoUrl(resolveMediaUrl((lesson as any).videoUrl))
      } else if (lesson?.videoMediaId) {
        const url = await getObjectUrl(lesson.videoMediaId)
        if (alive) setVideoUrl(url)
      } else {
        setVideoUrl(null)
      }

      const serverSlides = (lesson as any)?.serverSlides || (lesson as any)?.slides
      if (Array.isArray(serverSlides) && serverSlides.length) {
        const urls = serverSlides
          .map((s: any) => (typeof s === 'string' ? s : s?.url))
          .filter(Boolean)
          .map((u: string) => resolveMediaUrl(u))
        setSlideUrls(urls)
      } else if (Array.isArray(lesson?.slideMediaIds) && lesson!.slideMediaIds!.length) {
        const urls = await Promise.all(lesson!.slideMediaIds!.map((id) => getObjectUrl(id)))
        if (alive) setSlideUrls(urls)
      } else {
        setSlideUrls([])
      }

      if ((lesson as any)?.presentationUrl) {
        setPresUrl(resolveMediaUrl((lesson as any).presentationUrl))
      } else if (lesson?.presentationMediaId) {
        const url = await getObjectUrl(lesson.presentationMediaId)
        if (alive) setPresUrl(url)
      } else {
        setPresUrl(null)
      }
    })()
    return () => { alive = false }
  }, [lesson?.videoMediaId, lesson?.slideMediaIds, lesson?.presentationMediaId, (lesson as any)?.videoUrl, (lesson as any)?.presentationUrl, (lesson as any)?.serverSlides, (lesson as any)?.slides])

  useEffect(() => {
    let ignore = false
    if (!course?.id || !lesson?.id) return
    const lid = String((lesson as any).id)
    apiFetch<any>(`/courses/${course.id}/lessons/${encodeURIComponent(lid)}`)
      .then((data) => {
        if (ignore || !data) return
        setCanAccess((prev) => prev || true)
        if (typeof data.content === 'string') setLessonContent(data.content)
        if (data.videoUrl) setVideoUrl(resolveMediaUrl(data.videoUrl))
        if (data.presentationUrl) setPresUrl(resolveMediaUrl(data.presentationUrl))
        if (Array.isArray(data.slides)) {
          const urls = data.slides
            .map((s: any) => (typeof s === 'string' ? s : s?.url))
            .filter(Boolean)
            .map((u: string) => resolveMediaUrl(u))
          setSlideUrls(urls)
        }
      })
      .catch((e) => {  
        console.warn("Failed to load lesson data:", e)
        // Не отображаем ошибку пользователю, просто логируем
      })
    return () => { ignore = true }
  }, [course?.id, (lesson as any)?.id])

  useEffect(() => {
    if (!course?.id || moduleId == null || lessonId == null) { setLessonQuiz([]); return }
    setLoadingQuiz(true)
    const params = new URLSearchParams({ lessonId: String(lessonId) })
    apiFetch<Array<any>>(`/courses/${course.id}/questions?${params.toString()}`)
      .then((list) => setLessonQuiz(list || []))
      .catch(() => setLessonQuiz([]))
      .finally(() => setLoadingQuiz(false))
  }, [course?.id, moduleId, lessonId])

  const answerLessonQuestion = async (questionId: string, selectedIndex: number) => {
    try {
      const res = await apiFetch<{ isCorrect: boolean; correctIndex: number }>(`/courses/questions/${questionId}/answer`, {
        method: "POST",
        body: JSON.stringify({ selectedIndex })
      })
      setLessonQuiz((prev) => prev.map((q) => (q.id === questionId ? { ...q, selectedIndex, isCorrect: res.isCorrect, correctIndex: res.correctIndex } : q)))
      toast({ title: res.isCorrect ? 'Верно' : 'Неверно', description: res.isCorrect ? 'Отличная работа!' : 'Правильный вариант подсвечен' })
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось отправить ответ', variant: 'destructive' as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      
      <div className="mb-6 flex items-center gap-2 text-white">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
          aria-label="Назад к курсу"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Курсы</span>
        </button>
      </div>

      <div className="space-y-4 relative">
        
        <div className="rounded-full bg-[#1b1b22] px-4 py-2 text-white/80 inline-flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#2a2a35] text-white/80 flex items-center justify-center text-xs">
            {(modIndex >= 0 ? modIndex : 0) + 1}
          </span>
          <span>{mod.title}</span>
        </div>

        
        <div className="rounded-full bg-[#16161c] border border-[#2a2a35] px-4 py-2 text-white inline-flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold">
            {(lessonIndex >= 0 ? lessonIndex : 0) + 1}
          </span>
          <span className="font-medium">{lesson.title}</span>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <section className="space-y-6">
            
            {videoUrl ? (
              <video
                key={videoUrl}
                controls
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                className="w-full rounded-2xl border border-[#2a2a35] bg-black animate-slide-up"
                src={videoUrl}
              />
            ) : (
              <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-2xl p-6 text-white min-h-[220px] flex items-center justify-center animate-slide-up">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[#2a2a35] flex items-center justify-center mx-auto mb-3">
                    <Play className="w-8 h-8 text-[#a0a0b0]" />
                  </div>
                  <div className="text-lg font-medium">Видео не найдено</div>
                  <div className="text-white/60 text-sm">Добавьте видео в админке</div>
                </div>
              </div>
            )}

            
            {(lessonContent && lessonContent.trim().length > 0) && (
              <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-2 animate-slide-up">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-[#1b1b22] border border-[#2a2a35] text-white/70 text-xs">
                  <FileText className="w-4 h-4" />
                  Конспект урока
                </div>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{lessonContent}</ReactMarkdown>
                </div>
              </div>
            )}

            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#0f2d3a] border border-[#174a5d] text-[#7ed8ff]">
                <Info className="w-4 h-4" />
                <span>Проверьте свои знания по этому уроку</span>
              </div>
              <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-3">
                {loadingQuiz && <div className="text-white/60">Загрузка вопросов...</div>}
                {!loadingQuiz && lessonQuiz.length === 0 && <div className="text-white/60">Вопросов пока нет</div>}
                {!loadingQuiz && lessonQuiz.length > 0 && (
                  <div className="space-y-4">
                    {lessonQuiz.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <div className="text-white/80">{q.text}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(q.options || []).map((opt: string, idx: number) => {
                            const isSelected = q.selectedIndex === idx
                            const isCorrect = q.correctIndex === idx
                            const showCorrect = typeof q.correctIndex === 'number'
                            return (
                              <button
                                key={idx}
                                onClick={() => answerLessonQuestion(q.id, idx)}
                                disabled={showCorrect}
                                className={`flex items-center gap-3 rounded-full px-4 py-3 border text-left transition-colors ${
                                  showCorrect
                                    ? isCorrect
                                      ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-white'
                                      : isSelected
                                        ? 'bg-[#ef4444]/15 border-[#ef4444]/40 text-white'
                                        : 'bg-transparent border-[#2a2a35] text-white/80'
                                    : isSelected
                                      ? 'bg-[#1b1b22] border-[#2a2a35] text-white'
                                      : 'bg-[#0f0f14] border-[#2a2a35] hover:bg-[#1a1a22]'
                                }`}
                              >
                                <span className="w-8 h-8 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold">
                                  {idx + 1}
                                </span>
                                <span className="text-white/80 flex-1">{opt}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          
          <aside className="space-y-3">
            
            {slideUrls.length > 0 ? (
              slideUrls.map((url, idx) => (
                <div key={idx} className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white flex items-center justify-between animate-slide-up">
                  <div className="inline-flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    <span>Слайд {idx + 1}</span>
                  </div>
                  {url && (
                    <a href={url} target="_blank" className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Открыть</a>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white animate-slide-up">
                <div className="rounded-full bg-[#1b1b22] px-4 py-2 text-white/80 inline-flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span>Слайды не загружены</span>
                </div>
              </div>
            )}

            
            {presUrl && (
              <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white flex items-center justify-between animate-slide-up">
                <div className="inline-flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span>Презентация</span>
                </div>
                <a href={presUrl} target="_blank" className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Открыть</a>
              </div>
            )}
          </aside>
        </div>

        
        {!canAccess && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
            <div className="text-center text-white space-y-3 p-6">
              <div className="inline-flex items-center gap-2 bg-[#1b1b22] border border-[#2a2a35] px-4 py-2 rounded-full">
                <Lock className="w-4 h-4" />
                <span>Контент доступен после покупки</span>
              </div>
              <div>
                <button onClick={onBack} className="mt-2 rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium px-5 py-2">
                  Купить курс
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
