"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

interface ChangePasswordProps {
  onSuccess: () => void
}

export function ChangePassword({ onSuccess }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ 
        title: "Ошибка", 
        description: "Пожалуйста, заполните все поля", 
        variant: "destructive" as any 
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Ошибка", 
        description: "Новые пароли не совпадают", 
        variant: "destructive" as any 
      })
      return
    }

    if (newPassword.length < 8) {
      toast({ 
        title: "Ошибка", 
        description: "Новый пароль должен содержать минимум 8 символов", 
        variant: "destructive" as any 
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка изменения пароля")
      }
      
      toast({ 
        title: "Успешно", 
        description: "Пароль успешно изменен" 
      })
      
      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      onSuccess()
    } catch (e: any) {
      toast({ 
        title: "Ошибка", 
        description: e?.message || "Не удалось изменить пароль", 
        variant: "destructive" as any 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-white text-lg font-medium">Изменение пароля</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[#a7a7a7] text-sm mb-2">Текущий пароль</label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Введите текущий пароль"
            className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
          />
        </div>

        <div>
          <label className="block text-[#a7a7a7] text-sm mb-2">Новый пароль</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
            className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
          />
        </div>

        <div>
          <label className="block text-[#a7a7a7] text-sm mb-2">Подтвердите новый пароль</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите новый пароль"
            className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
          />
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={loading}
          className="w-full bg-[#0f0f0f] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#2a2a2a] text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-102 active:scale-95"
        >
          {loading ? "Изменение..." : "Изменить пароль"}
        </Button>
      </div>
    </div>
  )
}