"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit, ArrowUp, ArrowDown, BookOpen } from "lucide-react"
import { useConfirm } from "@/components/ui/confirm"
import Link from "next/link"

interface LessonTemplate {
  id: string
  title: string
  orderIndex: number
  mediaType: string
  contentUrl: string | null
  scenarioText: string | null
  quizId: string | null
}

export default function AdminKruzhokProgramLessonsPage({ params }: { params: { id: string } }) {
  const programId = params.id
  const [lessons, setLessons] = useState<LessonTemplate[]>([])
  const [programName, setProgramName] = useState("")
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()

  useEffect(() => {
    fetchLessons()
  }, [programId])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<{ name: string, lessons: LessonTemplate[] }>(`/api/admin/kruzhok/programs/${programId}/lessons`)
      setProgramName(data.name)
      setLessons(data.lessons.sort((a, b) => a.orderIndex - b.orderIndex) || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список уроков",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Удалить урок",
      message: `Вы уверены, что хотите удалить урок "${title}"? Это действие необратимо.`,
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await apiFetch(`/api/admin/kruzhok/programs/${programId}/lessons/${id}`, { method: "DELETE" })
      toast({ title: "Успех", description: `Урок "${title}" успешно удален.` })
      fetchLessons()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить урок",
        variant: "destructive" as any,
      })
    }
  }

  const handleReorder = async (lessonId: string, direction: 'up' | 'down') => {
    try {
      await apiFetch(`/api/admin/kruzhok/programs/${programId}/lessons/${lessonId}/reorder`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      })
      toast({ title: "Успех", description: "Порядок уроков обновлен." })
      fetchLessons()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить порядок уроков",
        variant: "destructive" as any,
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold mb-6">Уроки программы: {programName}</h1>
        <Card className="bg-[#16161c] border-[#636370]/20 text-white">
          <CardContent className="p-6">
            <div className="text-white/70">Загрузка...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-bold">Уроки программы: {programName}</h1>
        <Link href={`/admin/kruzhok/programs/${programId}/lessons/new`}>
          <Button className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">
            <Plus className="w-4 h-4 mr-2" />
            Добавить урок
          </Button>
        </Link>
      </div>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Список уроков ({lessons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#636370]/20">
                <TableHead className="text-white/70">#</TableHead>
                <TableHead className="text-white/70">Название</TableHead>
                <TableHead className="text-white/70">Тип</TableHead>
                <TableHead className="text-white/70">Материал</TableHead>
                <TableHead className="text-white/70">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson, index) => (
                <TableRow key={lesson.id} className="border-[#636370]/20 hover:bg-[#1e1e26]">
                  <TableCell className="font-medium text-white">{lesson.orderIndex}</TableCell>
                  <TableCell className="text-white/80">{lesson.title}</TableCell>
                  <TableCell className="text-white/80">{lesson.mediaType}</TableCell>
                  <TableCell className="text-white/80">
                    {lesson.contentUrl ? <Link href={lesson.contentUrl} target="_blank" className="text-[#00a3ff] hover:underline">Материал</Link> : "Нет"}
                    {lesson.scenarioText && <span className="ml-2 text-[#22c55e]">(Сценарий)</span>}
                    {lesson.quizId && <span className="ml-2 text-[#f59e0b]">(Квиз)</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-[#00a3ff]"
                        onClick={() => handleReorder(lesson.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-[#00a3ff]"
                        onClick={() => handleReorder(lesson.id, 'down')}
                        disabled={index === lessons.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Link href={`/admin/kruzhok/programs/${programId}/lessons/${lesson.id}`}>
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-[#00a3ff]">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#ef4444] hover:text-[#dc2626]"
                        onClick={() => handleDelete(lesson.id, lesson.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
