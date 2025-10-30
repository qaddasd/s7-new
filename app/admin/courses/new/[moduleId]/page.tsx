"use client"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { LogIn, Plus } from "lucide-react"

interface DraftLesson {
  id: number
  title: string
  time?: string
  slides?: string[]
  videoName?: string
  remoteId?: string
}

interface DraftModule {
  id: number
  title: string
  remoteId?: string
  lessons: DraftLesson[]
}

interface DraftCourse {
  title: string
  author: string
  modules: DraftModule[]
}

function readDraftBy(key: string): DraftCourse | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeDraftBy(key: string, d: DraftCourse) {
  try {
    localStorage.setItem(key, JSON.stringify(d))
    localStorage.setItem("s7_admin_course_draft", JSON.stringify(d))
  } catch {}
}

export default function Page() {
  const params = useParams<{ moduleId: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const moduleId = useMemo(() => Number(params.moduleId), [params.moduleId])
  const draftKey = useMemo(() => {
    const d = search.get("draft")
    return d ? `s7_admin_course_draft_${d}` : "s7_admin_course_draft"
  }, [search])
  const qs = useMemo(() => {
    const d = search.get("draft")
    const e = search.get("edit")
    const params = new URLSearchParams()
    if (d) params.set("draft", d)
    if (e) params.set("edit", e)
    const s = params.toString()
    return s ? `?${s}` : ""
  }, [search])
  const [course, setCourse] = useState<DraftCourse | null>(null)
  const [dragLessonId, setDragLessonId] = useState<number | null>(null)

  useEffect(() => {
    const d = search.get("draft")
    if (!d && typeof window !== 'undefined') {
      const stored = localStorage.getItem("s7_admin_course_default_id")
      const generated = stored || `s7-${(typeof crypto !== 'undefined' && crypto.getRandomValues ? Array.from(crypto.getRandomValues(new Uint32Array(2))).map(n=>n.toString().padStart(10,'0')).join('').slice(0,10) : `${Math.floor(1000000000 + Math.random()*9000000000)}`)}`
      if (!stored) localStorage.setItem("s7_admin_course_default_id", generated)
      const e = search.get('edit')
      router.replace(`/admin/courses/new/${moduleId}?draft=${encodeURIComponent(generated)}${e?`&edit=${encodeURIComponent(e)}`:''}`)
    }
  }, [search, moduleId, router])

  useEffect(() => {
    const d = readDraftBy(draftKey)
    if (d) setCourse(d)
    else {
      try {
        const raw = localStorage.getItem("s7_admin_course_draft")
        const fallback = raw ? JSON.parse(raw) : null
        if (fallback) setCourse(fallback)
      } catch {}
    }
  }, [draftKey])

  const module = course?.modules?.find((m) => m.id === moduleId)

  const addLesson = () => {
    if (!course || !module) return
    const nextId = module.lessons?.length ? Math.max(...module.lessons.map((l) => l.id)) + 1 : 1
    const newLesson: DraftLesson = { id: nextId, title: "Название урока", time: "" }
    const newModules = course.modules.map((m) => (m.id === module.id ? { ...m, lessons: [...(m.lessons || []), newLesson] } : m))
    const next = { ...course, modules: newModules }
    setCourse(next)
    writeDraftBy(draftKey, next)
    router.push(`/admin/courses/new/${moduleId}/${nextId}${qs}`)
  }

  const openLesson = (lessonId: number) => {
    router.push(`/admin/courses/new/${moduleId}/${lessonId}${qs}`)
  }

  const reorderLessons = (fromId: number, toId: number) => {
    if (!course || !module) return
    const list = [...(module.lessons || [])]
    const fromIdx = list.findIndex((l) => l.id === fromId)
    const toIdx = list.findIndex((l) => l.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    const [item] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, item)
    const newModules = course.modules.map((m) => (m.id === module.id ? { ...m, lessons: list } : m))
    const next = { ...course, modules: newModules }
    setCourse(next)
    writeDraftBy(draftKey, next)
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="mb-4">
        <button
          onClick={() => { if (course) { try { writeDraftBy(draftKey, course) } catch {} } router.push(`/admin/courses/new${qs}`) }}
          className="inline-flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-2)]"
        >
          Назад
        </button>
      </div>
      <h2 className="text-[var(--color-text-1)] text-xl font-medium mb-6">Создать курс</h2>

      <div className="max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-2xl px-4 py-3 text-[var(--color-text-1)]">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[var(--color-border-2)] text-[var(--color-text-2)] flex items-center justify-center text-xs">{module?.id ?? 1}.</span>
            <span className="font-medium">{module?.title ?? `Модуль ${moduleId}`}</span>
          </div>
          <div className="rounded-lg border border-[var(--color-border-2)] p-1 text-[var(--color-text-4)]">
            <LogIn className="w-5 h-5" />
          </div>
        </div>

        
        <div className="space-y-3">
          {(Array.isArray(module?.lessons) ? module!.lessons : []).map((l) => (
            <div
              key={l.id}
              draggable
              onDragStart={() => setDragLessonId(l.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragLessonId != null && dragLessonId !== l.id) reorderLessons(dragLessonId, l.id); setDragLessonId(null) }}
              className="w-full flex items-center justify-between rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-2)] px-4 py-3 text-[var(--color-text-1)] hover:bg-[#1a1a22] transition-colors animate-slide-up"
            >
              <button onClick={() => openLesson(l.id)} className="flex items-center gap-3 flex-1 text-left">
                <span className="w-8 h-8 rounded-full bg-[var(--color-accent-warm)] text-black flex items-center justify-center font-semibold">{l.id}</span>
                <span className="text-[var(--color-text-2)]">{l.title || "Название урока"}</span>
              </button>
              <span className="text-[var(--color-text-3)] text-sm">{l.time || "Время курса"}</span>
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