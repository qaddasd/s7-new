"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, CheckCircle, XCircle, Search } from "lucide-react"
import { useConfirm } from "@/components/ui/confirm"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Subscription {
  id: string
  user: {
    id: string
    email: string
    fullName: string
  }
  type: string
  startDate: string
  endDate: string
  isActive: boolean
}

const subscriptionTypes = [
  { value: "KRUZHOK_MENTOR", label: "Ментор кружка" },
  { value: "PRO_USER", label: "Pro қолданушы" },
]

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newSubscription, setNewSubscription] = useState({
    userId: "",
    type: "KRUZHOK_MENTOR",
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year from now
  })
  const confirm = useConfirm()

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<Subscription[]>(`/api/admin/subscriptions?search=${searchTerm}`)
      setSubscriptions(data || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список подписок",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch("/api/admin/subscriptions", {
        method: "POST",
        body: JSON.stringify(newSubscription),
      })
      toast({ title: "Успех", description: `Подписка ${newSubscription.type} успешно добавлена.` })
      setNewSubscription({
        userId: "",
        type: "KRUZHOK_MENTOR",
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      })
      fetchSubscriptions()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить подписку",
        variant: "destructive" as any,
      })
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Удалить подписку",
      message: `Вы уверены, что хотите удалить эту подписку?`,
      confirmText: "Удалить",
      cancelText: "Отмена",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await apiFetch(`/api/admin/subscriptions/${id}`, { method: "DELETE" })
      toast({ title: "Успех", description: `Подписка успешно удалена.` })
      fetchSubscriptions()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить подписку",
        variant: "destructive" as any,
      })
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Управление подписками</h1>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white mb-6">
        <CardHeader>
          <CardTitle className="text-white">Добавить новую подписку</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userId">ID Пользователя</Label>
                <Input
                  id="userId"
                  placeholder="ID Пользователя"
                  value={newSubscription.userId}
                  onChange={(e) => setNewSubscription({ ...newSubscription, userId: e.target.value })}
                  required
                  className="bg-[#1e1e26] border-[#636370]/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Тип подписки</Label>
                <Select
                  value={newSubscription.type}
                  onValueChange={(value) => setNewSubscription({ ...newSubscription, type: value })}
                >
                  <SelectTrigger id="type" className="bg-[#1e1e26] border-[#636370]/20 text-white">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e26] border-[#636370]/20 text-white">
                    {subscriptionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Дата окончания</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newSubscription.endDate}
                  onChange={(e) => setNewSubscription({ ...newSubscription, endDate: e.target.value })}
                  required
                  className="bg-[#1e1e26] border-[#636370]/20 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full bg-[#00a3ff] text-black hover:bg-[#0088cc]">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Список активных подписок</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Поиск по email или ФИО"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1e1e26] border-[#636370]/20 text-white"
            />
            <Button onClick={fetchSubscriptions} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
              <Search className="w-4 h-4 mr-2" />
              Поиск
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-[#636370]/20">
                <TableHead className="text-white/70">ФИО</TableHead>
                <TableHead className="text-white/70">Email</TableHead>
                <TableHead className="text-white/70">Тип</TableHead>
                <TableHead className="text-white/70">Дата окончания</TableHead>
                <TableHead className="text-white/70">Статус</TableHead>
                <TableHead className="text-white/70">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/70">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/70">
                    Подписки не найдены.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-[#636370]/20 hover:bg-[#1e1e26]">
                    <TableCell className="font-medium text-white">{sub.user.fullName}</TableCell>
                    <TableCell className="text-white/80">{sub.user.email}</TableCell>
                    <TableCell className="text-white/80">
                      {subscriptionTypes.find((t) => t.value === sub.type)?.label || sub.type}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {new Date(sub.endDate).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      {sub.isActive ? (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#ef4444] hover:text-[#dc2626]"
                        onClick={() => handleDelete(sub.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
