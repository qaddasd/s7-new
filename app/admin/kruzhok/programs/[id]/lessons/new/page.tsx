"use client"
import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function AdminNewKruzhokProgramLessonPage({ params }: { params: { id: string } }) {
  const programId = params.id
  const [title, setTitle] = useState("")
  const [mediaType, setMediaType] = useState("presentation")
  const [contentUrl, setContentUrl] = useState("")
  const [scenarioText, setScenarioText] = useState("")
  const [quizId, setQuizId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await apiFetch(`/api/admin/kruzhok/programs/${programId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title,
          mediaType,
          contentUrl: contentUrl || undefined,
          scenarioText: scenarioText || undefined,
          quizId: quizId || undefined,
        }),
      })
      toast({ title: "Успех", description: `Урок "${title}" успешно создан.` })
      router.push(`/admin/kruzhok/programs/${programId}/lessons`)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать урок",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Добавить новый урок в программу</h1>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mediaType">Тип материала</Label>
              <Select value={mediaType} onValueChange={setMediaType}>
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
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenarioText">Сценарий урока (Методика)</Label>
              <Textarea
                id="scenarioText"
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quizId">ID Квиза (Геймификация)</Label>
              <Input
                id="quizId"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {isSubmitting ? "Создание..." : "Создать урок"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
