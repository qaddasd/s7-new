"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface LessonTemplate {
  id: string
  programId: string
  title: string
  orderIndex: number
  mediaType: string
  contentUrl: string | null
  scenarioText: string | null
  quizId: string | null
}

export default function AdminKruzhokProgramLessonDetailPage({ params }: { params: { id: string, lessonId: string } }) {
  const { id: programId, lessonId } = params
  const [lesson, setLesson] = useState<LessonTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<LessonTemplate>(`/api/admin/kruzhok/programs/${programId}/lessons/${lessonId}`)
      setLesson(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные урока",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lesson) return

    setIsSubmitting(true)
    try {
      const updatedLesson = await apiFetch<LessonTemplate>(`/api/admin/kruzhok/programs/${programId}/lessons/${lessonId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: lesson.title,
          mediaType: lesson.mediaType,
          contentUrl: lesson.contentUrl,
          scenarioText: lesson.scenarioText,
          quizId: lesson.quizId,
        }),
      })
      setLesson(updatedLesson)
      toast({ title: "Успех", description: "Данные урока обновлены." })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные урока",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-white/70">Загрузка...</div>
  }

  if (!lesson) {
    return <div className="p-6 text-white/70">Урок не найден.</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Редактирование урока: {lesson.title}</h1>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={lesson.title}
                onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mediaType">Тип материала</Label>
              <Select value={lesson.mediaType} onValueChange={(value) => setLesson({ ...lesson, mediaType: value })}>
                <SelectTrigger className="bg-[#1e1e26] border-[#636370]/20 text-white">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e26] border-[#636370]/20 text-white">
                  <SelectItem value="video">Видео</SelectItem>
                  <SelectItem value="slide">Слайд</SelectItem>
                  <SelectItem value="presentation">Презентация</SelectItem>
                  <SelectItem value="resource">Ресурс</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentUrl">Ссылка на материал (Презентация/Видео)</Label>
              <Input
                id="contentUrl"
                value={lesson.contentUrl || ""}
                onChange={(e) => setLesson({ ...lesson, contentUrl: e.target.value })}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenarioText">Сценарий урока (Методика)</Label>
              <Textarea
                id="scenarioText"
                value={lesson.scenarioText || ""}
                onChange={(e) => setLesson({ ...lesson, scenarioText: e.target.value })}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quizId">ID Квиза (Геймификация)</Label>
              <Input
                id="quizId"
                value={lesson.quizId || ""}
                onChange={(e) => setLesson({ ...lesson, quizId: e.target.value })}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
