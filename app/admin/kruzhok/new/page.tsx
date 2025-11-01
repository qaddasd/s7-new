"use client"
import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function AdminNewKruzhokPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [maxCapacity, setMaxCapacity] = useState(0)
  const [adminId, setAdminId] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const newKruzhok = await apiFetch("/api/admin/kruzhok", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          maxCapacity: maxCapacity > 0 ? maxCapacity : undefined,
          adminId: adminId || undefined,
          isPaid,
        }),
      })
      toast({ title: "Успех", description: `Кружок "${name}" успешно создан.` })
      router.push(`/admin/kruzhok/${newKruzhok.id}`)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать кружок",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Создать новый кружок</h1>

      <Card className="bg-[#16161c] border-[#636370]/20 text-white">
        <CardHeader>
          <CardTitle className="text-white">Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Макс. вместимость (0 - без лимита)</Label>
              <Input
                id="maxCapacity"
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminId">ID Владельца (оставьте пустым для себя)</Label>
              <Input
                id="adminId"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="bg-[#1e1e26] border-[#636370]/20 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPaid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(checked as boolean)}
                className="border-[#636370]/20 data-[state=checked]:bg-[#00a3ff] data-[state=checked]:text-black"
              />
              <Label htmlFor="isPaid">Платный кружок (требует подтверждения оплаты)</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {isSubmitting ? "Создание..." : "Создать кружок"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
