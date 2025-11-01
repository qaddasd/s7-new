"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GraduationCap, Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react"
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

export default function AdminKruzhokPage() {
  const [kruzhoks, setKruzhoks] = useState<Kruzhok[]>([])
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()

  useEffect(() => {
    fetchKruzhoks()
  }, [])

  const fetchKruzhoks = async () => {
    try {
      setLoading(true)
      // Assuming there is an admin API route for fetching all kruzhoks
      const data = await apiFetch<Kruzhok[]>("/api/admin/kruzhok")
      setKruzhoks(data || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список кружков",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Удалить кружок",
      message: `Вы уверены, что хотите удалить кружок "${name}"? Это действие необратимо.`,
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await apiFetch(`/api/admin/kruzhok/${id}`, { method: "DELETE" })
      toast({ title: "Успех", description: `Кружок "${name}" успешно удален.` })
      fetchKruzhoks()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить кружок",
        variant: "destructive" as any,
      })
    }
  }

  const handleConfirmPayment = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Подтвердить оплату",
      message: `Вы уверены, что хотите подтвердить оплату для кружка "${name}"?`,
      confirmText: "Подтвердить",
      cancelText: "Отмена",
    })
    if (!ok) return

    try {
      await apiFetch(`/api/admin/kruzhok/${id}/confirm-payment`, { method: "POST" })
      toast({ title: "Успех", description: `Оплата для кружка "${name}" подтверждена.` })
      fetchKruzhoks()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось подтвердить оплату",
        variant: "destructive" as any,
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold mb-6">Управление кружками</h1>
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
        <h1 className="text-white text-2xl font-bold">Управление кружками</h1>
        <Link href="/admin/kruzhok/programs">
          <Button variant="outline" className="bg-[#16161c] text-white border-[#636370]/20 hover:bg-[#1e1e26]">
            <BookOpen className="w-4 h-4 mr-2" />
            Программы
          </Button>
        </Link>
        <Link href="/admin/kruzhok/new">
          <Button className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">
            <Plus className="w-4 h-4 mr-2" />
            Создать кружок
          </Button>
        </Link>
      </div>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Список кружков ({kruzhoks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#636370]/20">
                <TableHead className="text-white/70">Название</TableHead>
                <TableHead className="text-white/70">Админ</TableHead>
                <TableHead className="text-white/70">Участники</TableHead>
                <TableHead className="text-white/70">Статус</TableHead>
                <TableHead className="text-white/70">Оплата</TableHead>
                <TableHead className="text-white/70">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kruzhoks.map((kruzhok) => (
                <TableRow key={kruzhok.id} className="border-[#636370]/20 hover:bg-[#1e1e26]">
                  <TableCell className="font-medium text-white">{kruzhok.name}</TableCell>
                  <TableCell className="text-white/80">{kruzhok.admin.fullName}</TableCell>
                  <TableCell className="text-white/80">{kruzhok._count.members} / {kruzhok.maxCapacity || "∞"}</TableCell>
                  <TableCell>
                    {kruzhok.isActive ? (
                      <span className="text-[#22c55e] flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Активен
                      </span>
                    ) : (
                      <span className="text-[#ef4444] flex items-center">
                        <XCircle className="w-4 h-4 mr-1" /> Неактивен
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {kruzhok.isPaid ? (
                      kruzhok.subscriptionStatus === "PENDING_PAYMENT" ? (
                        <span className="text-[#f59e0b]">Ожидает оплаты</span>
                      ) : (
                        <span className="text-[#22c55e]">Оплачен</span>
                      )
                    ) : (
                      <span className="text-white/70">Бесплатный</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/kruzhok/${kruzhok.id}`}>
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-[#00a3ff]">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      {kruzhok.isPaid && kruzhok.subscriptionStatus === "PENDING_PAYMENT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#f59e0b] hover:text-[#eab308]"
                          onClick={() => handleConfirmPayment(kruzhok.id, kruzhok.name)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#ef4444] hover:text-[#dc2626]"
                        onClick={() => handleDelete(kruzhok.id, kruzhok.name)}
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
