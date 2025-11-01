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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, CheckCircle, XCircle, User, BookOpen } from "lucide-react"
import { useConfirm } from "@/components/ui/confirm"
import Link from "next/link"

interface Kruzhok {
  id: string
  name: string
  description: string
  maxCapacity: number
  isActive: boolean
  isPaid: boolean
  adminId: string
  admin: { fullName: string }
  _count: { members: number }
  subscriptionStatus: string
}

interface Member {
  id: string
  userId: string
  user: { id: string; fullName: string; email: string }
  enrollmentStatus: string
}

export default function AdminKruzhokDetailPage({ params }: { params: { id: string } }) {
  const kruzhokId = params.id
  const [kruzhok, setKruzhok] = useState<Kruzhok | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberLoading, setMemberLoading] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const confirm = useConfirm()

  useEffect(() => {
    fetchData()
  }, [kruzhokId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [kruzhokData, membersData] = await Promise.all([
        apiFetch<Kruzhok>(`/api/admin/kruzhok/${kruzhokId}`),
        apiFetch<Member[]>(`/api/admin/kruzhok/${kruzhokId}/members`),
      ])
      setKruzhok(kruzhokData)
      setMembers(membersData || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные кружка",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kruzhok) return

    setIsSubmitting(true)
    try {
      const updatedKruzhok = await apiFetch<Kruzhok>(`/api/admin/kruzhok/${kruzhokId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: kruzhok.name,
          description: kruzhok.description,
          maxCapacity: kruzhok.maxCapacity,
          isActive: kruzhok.isActive,
        }),
      })
      setKruzhok(updatedKruzhok)
      toast({ title: "Успех", description: "Данные кружка обновлены." })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные кружка",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setMemberLoading(true)
    try {
      // Assuming a backend endpoint to enroll a user by email/ID
      const result = await apiFetch(`/api/admin/kruzhok/${kruzhokId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ userIdentifier: newMemberEmail }), // Assuming userIdentifier can be email or ID
      })
      toast({ title: "Успех", description: `Пользователь ${newMemberEmail} успешно добавлен.` })
      setNewMemberEmail("")
      fetchData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить пользователя",
        variant: "destructive" as any,
      })
    } finally {
      setMemberLoading(false)
    }
  }

  const handleUnenroll = async (userId: string, userName: string) => {
    const ok = await confirm({
      title: "Исключить участника",
      message: `Вы уверены, что хотите исключить участника "${userName}"?`,
      confirmText: "Исключить",
      cancelText: "Отмена",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await apiFetch(`/api/admin/kruzhok/${kruzhokId}/unenroll/${userId}`, { method: "DELETE" })
      toast({ title: "Успех", description: `Участник "${userName}" исключен.` })
      fetchData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось исключить участника",
        variant: "destructive" as any,
      })
    }
  }

  if (loading) {
    return <div className="p-6 text-white/70">Загрузка...</div>
  }

  if (!kruzhok) {
    return <div className="p-6 text-white/70">Кружок не найден.</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Управление кружком: {kruzhok.name}</h1>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-[#16161c] border-[#636370]/20">
          <TabsTrigger value="details" className="text-white/70 data-[state=active]:bg-[#00a3ff] data-[state=active]:text-black">Детали</TabsTrigger>
          <TabsTrigger value="members" className="text-white/70 data-[state=active]:bg-[#00a3ff] data-[state=active]:text-black">Участники ({members.length})</TabsTrigger>
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
                    value={kruzhok.name}
                    onChange={(e) => setKruzhok({ ...kruzhok, name: e.target.value })}
                    className="bg-[#1e1e26] border-[#636370]/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={kruzhok.description}
                    onChange={(e) => setKruzhok({ ...kruzhok, description: e.target.value })}
                    className="bg-[#1e1e26] border-[#636370]/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Макс. вместимость</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={kruzhok.maxCapacity}
                    onChange={(e) => setKruzhok({ ...kruzhok, maxCapacity: parseInt(e.target.value) })}
                    className="bg-[#1e1e26] border-[#636370]/20 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={kruzhok.isActive}
                    onCheckedChange={(checked) => setKruzhok({ ...kruzhok, isActive: checked as boolean })}
                    className="border-[#636370]/20 data-[state=checked]:bg-[#00a3ff] data-[state=checked]:text-black"
                  />
                  <Label htmlFor="isActive">Активен</Label>
                </div>
                <Button type="submit" disabled={isSubmitting} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
                  {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card className="bg-[#16161c] border-[#636370]/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Участники</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnroll} className="flex space-x-2 mb-4">
                <Input
                  type="text"
                  placeholder="Email или ID пользователя для добавления"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1 bg-[#1e1e26] border-[#636370]/20 text-white"
                />
                <Button type="submit" disabled={memberLoading} className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </form>

              <Table>
                <TableHeader>
                  <TableRow className="border-[#636370]/20">
                    <TableHead className="text-white/70">Имя</TableHead>
                    <TableHead className="text-white/70">Email</TableHead>
                    <TableHead className="text-white/70">Статус</TableHead>
                    <TableHead className="text-white/70">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="border-[#636370]/20 hover:bg-[#1e1e26]">
                      <TableCell className="font-medium text-white">{member.user.fullName}</TableCell>
                      <TableCell className="text-white/80">{member.user.email}</TableCell>
                      <TableCell>
                        {member.enrollmentStatus === "APPROVED" ? (
                          <span className="text-[#22c55e] flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" /> Участник
                          </span>
                        ) : (
                          <span className="text-[#f59e0b] flex items-center">
                            <XCircle className="w-4 h-4 mr-1" /> Заявка
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#ef4444] hover:text-[#dc2626]"
                          onClick={() => handleUnenroll(member.userId, member.user.fullName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-4">
          <Card className="bg-[#16161c] border-[#636370]/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Уроки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white/70">
                <Link href={`/admin/kruzhok/${kruzhokId}/lessons`}>
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
