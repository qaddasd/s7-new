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

export default function AdminNewKruzhokProgramPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const newProgram = await apiFetch("/api/admin/kruzhok/programs", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          isActive,
        }),
      })
      toast({ title: "Успех", description: `Программа "${name}" успешно создана.` })
      router.push(`/admin/kruzhok/programs/${newProgram.id}`)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать программу",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-white text-2xl font-bold mb-6">Создать новую программу кружка</h1>

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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                className="border-[#636370]/20 data-[state=checked]:bg-[#00a3ff] data-[state=checked]:text-black"
              />
              <Label htmlFor="isActive">Активна</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {isSubmitting ? "Создание..." : "Создать программу"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
