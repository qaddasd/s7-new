"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { LogIn, Plus, Image, Upload, Trash, Bold, Italic, Heading2, List } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import FileUpload from "@/components/kokonutui/file-upload"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import dynamic from "next/dynamic"

const ReactMarkdown = dynamic(() => import("react-markdown").then((m) => m.default as any), { ssr: false }) as any

interface LessonData {
  id?: string
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

interface ModuleData {
  id: string
  title: string
  lessons: LessonData[]
}

export default function Page() {
  const params = useParams<{ moduleId: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const courseId = search.get("edit")
  const moduleId = useMemo(() => Number(params.moduleId), [params.moduleId])
  
  const [module, setModule] = useState<ModuleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load module data
  useEffect(() => {
    if (!courseId || !moduleId) {
      toast({ title: "Ошибка", description: "Не указан курс или модуль", variant: "destructive" })
      router.push("/admin/courses")
      return
    }
    
    const loadModule = async () => {
      try {
        // Get course with modules and lessons
        const course = await apiFetch<any>(`/api/admin-courses/${courseId}`)
        if (!course || !course.modules) {
          toast({ title: "Ошибка", description: "Курс не найден", variant: "destructive" })
          return
        }
        
        // Find the specific module by orderIndex (since moduleId is local)
        const foundModule = course.modules.find((m: any, index: number) => index + 1 === moduleId)
        if (!foundModule) {
          toast({ title: "Ошибка", description: "Модуль не найден", variant: "destructive" })
          return
        }
        
        setModule({
          id: foundModule.id,
          title: foundModule.title,
          lessons: foundModule.lessons?.map((l: any, index: number) => ({
            id: l.id,
            title: l.title,
            content: l.content,
            duration: l.duration,
            isFreePreview: l.isFreePreview,
            videoUrl: l.videoUrl,
            presentationUrl: l.presentationUrl,
            slides: l.slides || [],
            contentType: l.contentType,
          })) || []
        })
      } catch (error) {
        console.error("Error loading module:", error)
        toast({ title: "Ошибка", description: "Не удалось загрузить модуль", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    
    loadModule()
  }, [courseId, moduleId, router])

  const addLesson = async () => {
    if (!module || !courseId) return
    
    const nextOrderIndex = module.lessons.length
    const newLesson: Omit<LessonData, 'id'> = {
      title: "Новый урок",
      content: "",
      duration: "",
      isFreePreview: false,
      contentType: "text",
      quizOptions: ["", "", "", ""],
      quizCorrectIndex: -1,
      quizXp: 100,
    }
    
    try {
      const response = await apiFetch<any>(`/api/admin-courses/modules/${module.id}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          ...newLesson,
          orderIndex: nextOrderIndex,
        }),
      })
      
      if (response?.id) {
        setModule({
          ...module,
          lessons: [...module.lessons, { ...newLesson, id: response.id }]
        })
        toast({ title: "Урок создан", description: "Урок успешно сохранен в базе данных" })
        // Navigate to edit the new lesson
        router.push(`/admin/courses/new-step/${moduleId}/${response.id}?edit=${courseId}`)
      }
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast({ title: "Ошибка", description: "Не удалось создать урок", variant: "destructive" })
    }
  }

  const openLesson = (lessonId: string) => {
    router.push(`/admin/courses/new-step/${moduleId}/${lessonId}?edit=${courseId}`)
  }

  const reorderLessons = (fromIndex: number, toIndex: number) => {
    if (!module) return
    
    const newLessons = [...module.lessons]
    const [moved] = newLessons.splice(fromIndex, 1)
    newLessons.splice(toIndex, 0, moved)
    
    setModule({ ...module, lessons: newLessons })
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
        <div className="max-w-4xl space-y-6">
          <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-2xl p-4 animate-pulse">
            <div className="h-6 bg-white/20 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-white/20 rounded"></div>
              <div className="h-12 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!module) {
    return (
      <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
        <div className="text-center text-[var(--color-text-2)]">
          Модуль не найден
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="mb-4">
        <button
          onClick={() => router.push(`/admin/courses/new-step?edit=${courseId}`)}
          className="inline-flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-2)]"
        >
          Назад
        </button>
      </div>
      <h2 className="text-[var(--color-text-1)] text-xl font-medium mb-6">{module.title}</h2>

      <div className="max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-2xl px-4 py-3 text-[var(--color-text-1)]">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[var(--color-border-2)] text-[var(--color-text-2)] flex items-center justify-center text-xs">{moduleId}</span>
            <span className="font-medium">{module.title}</span>
          </div>
          <div className="rounded-lg border border-[var(--color-border-2)] p-1 text-[var(--color-text-4)]">
            <LogIn className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-3">
          {module.lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', index.toString())
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
                if (!isNaN(draggedIndex) && draggedIndex !== index) {
                  reorderLessons(draggedIndex, index)
                }
              }}
              className="w-full flex items-center justify-between rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-2)] px-4 py-3 text-[var(--color-text-1)] hover:bg-[#1a1a22] transition-colors animate-slide-up cursor-pointer"
            >
              <button onClick={() => openLesson(lesson.id!)} className="flex items-center gap-3 flex-1 text-left">
                <span className="w-8 h-8 rounded-full bg-[var(--color-accent-warm)] text-black flex items-center justify-center font-semibold">{index + 1}</span>
                <span className="text-[var(--color-text-2)]">{lesson.title || "Название урока"}</span>
              </button>
              <span className="text-[var(--color-text-3)] text-sm">{lesson.duration || "Время курса"}</span>
            </div>
          ))}

          <button
            onClick={addLesson}
            className="w-full flex items-center justify-between rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-2)] px-4 py-3 text-[var(--color-text-1)] hover:bg-[#1a1a22] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[var(--color-accent-warm)] text-black flex items-center justify-center font-semibold">
                <Plus className="w-4 h-4" />
              </span>
              <span className="text-[var(--color-text-2)]">Добавить урок</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  )
}