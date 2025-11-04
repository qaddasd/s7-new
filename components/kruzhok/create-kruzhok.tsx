"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface Props {
  onKruzhokCreated?: () => void
}

export default function CreateKruzhok({ onKruzhokCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      setLoading(true)
      await apiFetch("/api/kruzhok", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })
      toast({ title: "Кружок создан" } as any)
      setName("")
      setDescription("")
      setOpen(false)
      onKruzhokCreated?.()
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось создать кружок", variant: "destructive" as any })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button onClick={() => setOpen(true)} className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">
        Открыть кружок
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-[#16161c] border border-[#2a2a35] p-5 text-white">
            <div className="text-lg font-semibold mb-4">Создать кружок</div>
            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название"
                className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2"
                disabled={loading}
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2"
                disabled={loading}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#1b1b22] border border-[#2a2a35] text-white/80"
                  disabled={loading}
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 rounded-full bg-[#22c55e] text-black hover:bg-[#16a34a] disabled:opacity-60"
                >
                  {loading ? "Создание..." : "Создать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
