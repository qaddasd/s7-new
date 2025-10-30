"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/otp-input"

interface RegisterVerificationProps {
  email: string
  onVerified: (data: any) => void
  onBack: () => void
}

export function RegisterVerification({ email, onVerified, onBack }: RegisterVerificationProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({ 
        title: "Неверный код", 
        description: "Код должен содержать 6 символов", 
        variant: "destructive" as any 
      })
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch<any>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code })
      })
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      toast({ 
        title: "Успешно", 
        description: "Регистрация завершена успешно!" 
      })
      
      onVerified(data)
    } catch (e: any) {
      toast({ 
        title: "Ошибка", 
        description: e?.message || "Неверный код подтверждения", 
        variant: "destructive" as any 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResending(true)
    try {
      const response = await apiFetch<any>("/auth/send-verification", {
        method: "POST",
        body: JSON.stringify({ email })
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      toast({ 
        title: "Код отправлен", 
        description: "Новый код подтверждения отправлен на вашу почту" 
      })
    } catch (e: any) {
      toast({ 
        title: "Ошибка", 
        description: e?.message || "Не удалось отправить код", 
        variant: "destructive" as any 
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-white text-2xl font-medium mb-2">Подтверждение почты</h2>
        <p className="text-[#a7a7a7] text-sm">
          Мы отправили код подтверждения на <span className="text-white">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            containerClassName="flex gap-2"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-12 w-12" />
              <InputOTPSlot index={1} className="h-12 w-12" />
              <InputOTPSlot index={2} className="h-12 w-12" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} className="h-12 w-12" />
              <InputOTPSlot index={4} className="h-12 w-12" />
              <InputOTPSlot index={5} className="h-12 w-12" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full bg-[#0f0f0f] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#2a2a2a] text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-102 active:scale-95"
        >
          {loading ? "Проверка..." : "Подтвердить"}
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleResendCode}
            disabled={resending}
            variant="outline"
            className="flex-1 border-[#1f1f1f] text-[#a7a7a7] hover:bg-[#141414] hover:border-[#2a2a2a] hover:text-white"
          >
            {resending ? "Отправка..." : "Отправить заново"}
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 border-[#1f1f1f] text-[#a7a7a7] hover:bg-[#141414] hover:border-[#2a2a2a] hover:text-white"
          >
            Назад
          </Button>
        </div>
      </div>
    </div>
  )
}