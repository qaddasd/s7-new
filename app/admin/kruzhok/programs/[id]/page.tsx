"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface Program {
  id: string
  name: string
  description: string
  isActive: boolean
}

export default function AdminKruzhokProgramDetailPage({ params }: { params: { id: string } }) {
  const programId = params.id
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProgram()
  }, [programId])

  const fetchProgram = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<Program>(`/api/admin/kruzhok/programs/${programId}`)
      setProgram(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные программы",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program) return

    setIsSubmitting(true)
    try {
      const updatedProgram = await apiFetch<Program>(`/api/admin/kruzhok/programs/${programId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: program.name,
          description: program.description,
          isActive: program.isActive,
        }),
      })
      setProgram(updatedProgram)
      toast({ title: "Успех", description: "Данные программы обновлены." })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные программы",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-white/70">Загрузка...</div>
  }

  if (!program) {
    return <div className="p-6 text-white/70">Программа не найдена.</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Управление программой: {program.name}</h1>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-[#16161c] border-[#636370]/20">
          <TabsTrigger value="details" className="text-white/70 data-[state=active]:bg-[#00a3ff] data-[state=active]:text-black">Детали</TabsTrigger>
          <TabsTrigger value="lessons" className="text-white/70 data-[state=active]:bg-[#00a3ff] data-[state=active]:text-black">Уроки</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card className="bg-[#16161c] border-[#636370]/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Основные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={program.name}
                    onChange={(e) => setProgram({ ...program, name: e.target.value })}
                    className="bg-[#1e1e26] border-[#636370]/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={program.description}
                    onChange={(e) => setProgram({ ...program, description: e.target.value })}
                    className="bg-[#1e1e26] border-[#636370]/20 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={program.isActive}
                    onCheckedChange={(checked) => setProgram({ ...program, isActive: checked as boolean })}
                    className="border-[#636370]/20 data-[state=checked]:bg-[#00a3ff] data-[state=checked]:text-black"
                  />
                  <Label htmlFor="isActive">Активна</Label>
                </div>
                <Button type="submit" disabled={isSubmitting} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
                  {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-4">
          <Card className="bg-[#16161c] border-[#636370]/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Управление уроками</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white/70">
                <Link href={`/admin/kruzhok/programs/${programId}/lessons`}>
                  <Button className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Перейти к управлению уроками
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
