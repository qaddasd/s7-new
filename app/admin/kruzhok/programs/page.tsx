"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit, CheckCircle, XCircle, BookOpen } from "lucide-react"
import { useConfirm } from "@/components/ui/confirm"
import Link from "next/link"

interface Program {
  id: string
  name: string
  description: string
  isActive: boolean
  _count: { lessons: number }
}

export default function AdminKruzhokProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<Program[]>("/api/admin/kruzhok/programs")
      setPrograms(data || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список программ",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Удалить программу",
      message: `Вы уверены, что хотите удалить программу "${name}"? Это действие необратимо.`,
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await apiFetch(`/api/admin/kruzhok/programs/${id}`, { method: "DELETE" })
      toast({ title: "Успех", description: `Программа "${name}" успешно удалена.` })
      fetchPrograms()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить программу",
        variant: "destructive" as any,
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold mb-6">Управление программами кружков</h1>
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
        <h1 className="text-white text-2xl font-bold">Управление программами кружков</h1>
        <Link href="/admin/kruzhok/programs/new">
          <Button className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">
            <Plus className="w-4 h-4 mr-2" />
            Создать программу
          </Button>
        </Link>
      </div>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Список программ ({programs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#636370]/20">
                <TableHead className="text-white/70">Название</TableHead>
                <TableHead className="text-white/70">Описание</TableHead>
                <TableHead className="text-white/70">Уроков</TableHead>
                <TableHead className="text-white/70">Статус</TableHead>
                <TableHead className="text-white/70">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id} className="border-[#636370]/20 hover:bg-[#1e1e26]">
                  <TableCell className="font-medium text-white">{program.name}</TableCell>
                  <TableCell className="text-white/80">{program.description.substring(0, 50)}...</TableCell>
                  <TableCell className="text-white/80">{program._count.lessons}</TableCell>
                  <TableCell>
                    {program.isActive ? (
                      <span className="text-[#22c55e] flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Активна
                      </span>
                    ) : (
                      <span className="text-[#ef4444] flex items-center">
                        <XCircle className="w-4 h-4 mr-1" /> Неактивна
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/kruzhok/programs/${program.id}`}>
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-[#00a3ff]">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/kruzhok/programs/${program.id}/lessons`}>
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-[#22c55e]">
                          <BookOpen className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#ef4444] hover:text-[#dc2626]"
                        onClick={() => handleDelete(program.id, program.name)}
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
