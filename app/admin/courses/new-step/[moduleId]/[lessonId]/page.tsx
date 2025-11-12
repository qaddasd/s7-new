"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { LogIn, Image, Upload, Trash, Bold, Italic, Heading2, List, Save, ArrowLeft } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import FileUpload from "@/components/kokonutui/file-upload"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import dynamic from "next/dynamic"

const ReactMarkdown = dynamic(() => import("react-markdown").then((m) => m.default as any), { ssr: false }) as any

interface LessonData {
  id: string
  title: string
  content?: string
  duration?: string
  isFreePreview: boolean
  videoUrl?: string
  presentationUrl?: string
  slides?: Array<{ url: string }>
  contentType: string
  quizQuestion?: string
  quizOptions?: string[]
  quizCorrectIndex?: number
  quizXp?: number
}

export default function Page() {
  const params = useParams<{ moduleId: string; lessonId: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const courseId = search.get("edit")
  const moduleId = useMemo(() => Number(params.moduleId), [params.moduleId])
  const lessonId = useMemo(() => params.lessonId, [params.lessonId])
  
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  // Load lesson data
  useEffect(() => {
    if (!courseId || !lessonId || lessonId === "new") {
      toast({ title: "Ошибка", description: "Не указан курс или урок", variant: "destructive" })
      router.push("/admin/courses")
      return
    }
    
    const loadLesson = async () => {
      try {
        // Get course with modules and lessons
        const course = await apiFetch<any>(`/api/admin-courses/${courseId}`)
        if (!course || !course.modules) {
          toast({ title: "Ошибка", description: "Курс не найден", variant: "destructive" })
          return
        }
        
        // Find the specific lesson
        let foundLesson = null
        for (const mod of course.modules) {
          const lesson = mod.lessons?.find((l: any) => l.id === lessonId)
          if (lesson) {
            foundLesson = lesson
            break
          }
        }
        
        if (!foundLesson) {
          toast({ title: "Ошибка", description: "Урок не найден", variant: "destructive" })
          return
        }
        
        setLesson({
          id: foundLesson.id,
          title: foundLesson.title,
          content: foundLesson.content,
          duration: foundLesson.duration,
          isFreePreview: foundLesson.isFreePreview,
          videoUrl: foundLesson.videoUrl,
          presentationUrl: foundLesson.presentationUrl,
          slides: foundLesson.slides || [],
          contentType: foundLesson.contentType,
        })
        
        // Load quiz question for this lesson
        try {
          const questions = await apiFetch<any[]>(`/api/courses/${courseId}/questions?lessonId=${lessonId}`)
          if (questions && questions.length > 0) {
            const question = questions[0]
            setLesson(prev => prev ? {
              ...prev,
              quizQuestion: question.text,
              quizOptions: question.options,
              quizCorrectIndex: question.correctIndex,
              quizXp: question.xpReward,
            } : null)
          }
        } catch (error) {
          console.error("Error loading quiz question:", error)
        }
        
        setLastSaved(new Date())
      } catch (error) {
        console.error("Error loading lesson:", error)
        toast({ title: "Ошибка", description: "Не удалось загрузить урок", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    
    loadLesson()
  }, [courseId, lessonId, router])

  // Auto-save function
  const saveLesson = async () => {
    if (!lesson || saving) return
    
    setSaving(true)
    try {
      // Update lesson basic info
      await apiFetch(`/api/admin-courses/lessons/${lesson.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: lesson.title,
          content: lesson.content,
          duration: lesson.duration,
          isFreePreview: lesson.isFreePreview,
          videoUrl: lesson.videoUrl,
          presentationUrl: lesson.presentationUrl,
          slides: lesson.slides,
          contentType: lesson.contentType,
          quizQuestion: lesson.quizQuestion,
          quizOptions: lesson.quizOptions,
          quizCorrectIndex: lesson.quizCorrectIndex,
          quizXp: lesson.quizXp,
        }),
      })
      
      setLastSaved(new Date())
      console.log("Lesson saved")
    } catch (error) {
      console.error("Error saving lesson:", error)
      toast({ title: "Ошибка", description: "Не удалось сохранить урок", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Auto-save when data changes
  useEffect(() => {
    if (!lesson || loading) return
    
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    
    saveTimer.current = setTimeout(saveLesson, 1000) // Auto-save after 1 second of inactivity
    
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [lesson, loading])

  const updateLesson = (updates: Partial<LessonData>) => {
    setLesson(prev => prev ? { ...prev, ...updates } : null)
  }

  const addSlide = () => {
    if (!lesson) return
    const newSlides = [...(lesson.slides || []), { url: "" }]
    updateLesson({ slides: newSlides })
  }

  const removeSlide = (index: number) => {
    if (!lesson) return
    const newSlides = lesson.slides?.filter((_, i) => i !== index) || []
    updateLesson({ slides: newSlides })
  }

  const addQuizOption = () => {
    if (!lesson || !lesson.quizOptions) return
    const newOptions = [...lesson.quizOptions, ""]
    updateLesson({ quizOptions: newOptions })
  }

  const removeQuizOption = (index: number) => {
    if (!lesson || !lesson.quizOptions || lesson.quizOptions.length <= 2) return
    const newOptions = lesson.quizOptions.filter((_, i) => i !== index)
    // Adjust correct index if necessary
    let newCorrectIndex = lesson.quizCorrectIndex
    if (lesson.quizCorrectIndex === index) {
      newCorrectIndex = -1
    } else if (lesson.quizCorrectIndex > index) {
      newCorrectIndex = lesson.quizCorrectIndex - 1
    }
    updateLesson({ quizOptions: newOptions, quizCorrectIndex: newCorrectIndex })
  }

  const saveManually = async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    await saveLesson()
    toast({ title: "Сохранено", description: "Урок успешно сохранен" })
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
        <div className="max-w-6xl space-y-5">
          <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-2xl p-4 animate-pulse">
            <div className="h-8 bg-white/20 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-40 bg-white/20 rounded"></div>
              <div className="h-32 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
        <div className="text-center text-[var(--color-text-2)]">
          Урок не найден
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/admin/courses/new-step/${moduleId}?edit=${courseId}`)}
            className="inline-flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-2)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <h2 className="text-[var(--color-text-1)] text-xl font-medium">Редактировать урок</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-sm text-[var(--color-text-3)]">Сохранение...</span>
          )}
          {lastSaved && !saving && (
            <span className="text-sm text-[var(--color-text-3)]">
              Сохранено {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={saveManually}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-warm)] hover:bg-[#0088cc] px-4 py-2 text-black font-medium"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      </div>

      <div className="max-w-6xl space-y-5">
        {/* Lesson Title */}
        <div className="flex items-center justify-between rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-2)] px-4 py-3 text-[var(--color-text-1)]">
          <div className="flex items-center gap-3 w-full">
            <span className="w-8 h-8 rounded-full bg-[var(--color-accent-warm)] text-black flex items-center justify-center font-semibold">
              {moduleId}
            </span>
            <input
              value={lesson.title}
              onChange={(e) => updateLesson({ title: e.target.value })}
              placeholder="Название урока"
              className="flex-1 bg-transparent outline-none text-[var(--color-text-2)]"
            />
          </div>
          <input
            value={lesson.duration || ""}
            onChange={(e) => updateLesson({ duration: e.target.value })}
            placeholder="Время курса"
            className="w-32 text-right bg-transparent outline-none text-[var(--color-text-3)]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Video Section */}
          <section>
            <div className="rounded-3xl border-2 border-[var(--color-border-2)] p-3">
              <div className="rounded-2xl bg-[var(--color-surface-3)] border border-[var(--color-border-2)] min-h-[320px] flex items-center justify-center text-[var(--color-text-1)] overflow-hidden p-4">
                {!lesson.videoUrl ? (
                  <div className="text-center">
                    <div className="mb-4 text-[var(--color-text-2)]">Видео не загружено</div>
                    <input
                      type="url"
                      value={lesson.videoUrl || ""}
                      onChange={(e) => updateLesson({ videoUrl: e.target.value })}
                      placeholder="Вставьте URL видео"
                      className="w-full max-w-md bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-lg px-3 py-2 text-[var(--color-text-1)] outline-none"
                    />
                  </div>
                ) : (
                  <AspectRatio ratio={16/9} className="w-full">
                    <video src={lesson.videoUrl} controls className="w-full h-full object-contain bg-black" />
                  </AspectRatio>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <input
                  type="url"
                  value={lesson.videoUrl || ""}
                  onChange={(e) => updateLesson({ videoUrl: e.target.value })}
                  placeholder="URL видео"
                  className="flex-1 bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg px-3 py-2 text-[var(--color-text-1)] outline-none mr-2"
                />
                {lesson.videoUrl && (
                  <button
                    onClick={() => updateLesson({ videoUrl: undefined })}
                    className="rounded-full bg-[#ef4444] hover:bg-[#dc2626] px-3 py-1 text-white text-sm"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Slides and Presentation Section */}
          <aside className="space-y-3">
            {/* Slides */}
            <div>
              <div className="text-[var(--color-text-2)] text-sm mb-2">Слайды</div>
              {lesson.slides?.map((slide, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={slide.url}
                    onChange={(e) => {
                      const newSlides = [...(lesson.slides || [])]
                      newSlides[index] = { url: e.target.value }
                      updateLesson({ slides: newSlides })
                    }}
                    placeholder={`URL слайда ${index + 1}`}
                    className="flex-1 bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg px-3 py-2 text-[var(--color-text-1)] outline-none text-sm"
                  />
                  <button
                    onClick={() => removeSlide(index)}
                    className="rounded-full bg-[#ef4444] hover:bg-[#dc2626] p-2 text-white"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addSlide}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-2)] px-3 py-2 text-[var(--color-text-1)] hover:bg-[#1a1a22] transition-colors"
              >
                <Image className="w-4 h-4" />
                Добавить слайд
              </button>
            </div>

            {/* Presentation */}
            <div>
              <div className="text-[var(--color-text-2)] text-sm mb-2">Презентация</div>
              <input
                type="url"
                value={lesson.presentationUrl || ""}
                onChange={(e) => updateLesson({ presentationUrl: e.target.value })}
                placeholder="URL презентации"
                className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg px-3 py-2 text-[var(--color-text-1)] outline-none"
              />
            </div>

            {/* Free Preview */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lesson.isFreePreview}
                onChange={(e) => updateLesson({ isFreePreview: e.target.checked })}
                className="rounded"
              />
              <label className="text-[var(--color-text-2)] text-sm">Бесплатный предпросмотр</label>
            </div>
          </aside>
        </div>

        {/* Content Section */}
        <section className="bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-2xl p-4 text-[var(--color-text-1)] space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="text-[var(--color-text-2)] font-medium">Текст урока (Markdown)</div>
            <div className="inline-flex items-center gap-1">
              <button title="Жирный" onClick={() => updateLesson({ content: (lesson.content || "") + "**жирный**" })} className="p-2 rounded hover:bg-[var(--color-border-2)]"><Bold className="w-4 h-4" /></button>
              <button title="Курсив" onClick={() => updateLesson({ content: (lesson.content || "") + " *курсив*" })} className="p-2 rounded hover:bg-[var(--color-border-2)]"><Italic className="w-4 h-4" /></button>
              <button title="Заголовок" onClick={() => updateLesson({ content: (lesson.content || "") + "\n\n## Заголовок" })} className="p-2 rounded hover:bg-[var(--color-border-2)]"><Heading2 className="w-4 h-4" /></button>
              <button title="Список" onClick={() => updateLesson({ content: (lesson.content || "") + "\n- пункт" })} className="p-2 rounded hover:bg-[var(--color-border-2)]"><List className="w-4 h-4" /></button>
            </div>
          </div>
          <textarea
            value={lesson.content || ""}
            onChange={(e) => updateLesson({ content: e.target.value })}
            placeholder="Добавьте поясняющий текст, конспект, ссылки и т.д."
            className="w-full min-h-[160px] bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg p-3 outline-none text-[var(--color-text-2)]"
          />
          <div className="bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg p-3 text-[var(--color-text-2)]">
            <div className="text-[var(--color-text-3)] text-xs mb-2">Предпросмотр</div>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{lesson.content || ""}</ReactMarkdown>
            </div>
          </div>
        </section>
      </div>

      {/* Quiz Section */}
      <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-2xl p-4 text-[var(--color-text-1)] space-y-3 animate-slide-up">
        <div className="text-[var(--color-text-2)] font-medium">Вопрос по уроку (опционально)</div>
        <input
          value={lesson.quizQuestion || ""}
          onChange={(e) => updateLesson({ quizQuestion: e.target.value })}
          placeholder="Текст вопроса"
          className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg p-2 outline-none"
        />
        
        <div className="space-y-2">
          {(lesson.quizOptions || ["", "", "", ""]).map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="quiz-correct"
                checked={(lesson.quizCorrectIndex ?? -1) === idx}
                onChange={() => updateLesson({ quizCorrectIndex: idx })}
              />
              <input
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(lesson.quizOptions || ["", "", "", ""])]
                  newOptions[idx] = e.target.value
                  updateLesson({ quizOptions: newOptions })
                }}
                placeholder={`Вариант ${idx + 1}`}
                className="flex-1 bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg p-2 outline-none"
              />
              {(lesson.quizOptions || []).length > 2 && (
                <button
                  onClick={() => removeQuizOption(idx)}
                  className="rounded-full bg-[#ef4444] hover:bg-[#dc2626] p-1 text-white"
                >
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={addQuizOption}
            disabled={(lesson.quizOptions || []).length >= 8}
            className="rounded-lg bg-[var(--color-border-2)] hover:bg-[var(--color-border-hover-1)] px-3 py-1 text-[var(--color-text-2)] text-sm disabled:opacity-50"
          >
            Добавить вариант
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-3)] text-sm">XP за верный ответ</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={typeof lesson.quizXp === 'number' ? lesson.quizXp : 100}
              onChange={(e) => updateLesson({ quizXp: Number(e.target.value || 0) })}
              className="w-24 bg-[var(--color-surface-3)] border border-[var(--color-border-2)] rounded-lg p-2 outline-none text-right"
            />
          </div>
        </div>
      </div>
    </main>
  )
}