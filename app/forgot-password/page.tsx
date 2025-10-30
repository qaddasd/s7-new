"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/otp-input"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"request" | "code" | "reset">("request")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend button
  useState(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  })

  const handleRequestReset = async () => {
    if (!email) {
      toast({ 
        title: "Ошибка", 
        description: "Пожалуйста, введите email", 
        variant: "destructive" as any 
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка запроса сброса пароля")
      }
      
      toast({ 
        title: "Код отправлен", 
        description: "Проверьте вашу почту для получения кода сброса пароля" 
      })
      
      setStep("code")
      setCountdown(60) // 1 minute cooldown
    } catch (e: any) {
      toast({ 
        title: "Ошибка", 
        description: e?.message || "Не удалось отправить код сброса пароля", 
        variant: "destructive" as any 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({ 
        title: "Неверный код", 
        description: "Код должен содержать 6 символов", 
        variant: "destructive" as any 
      })
      return
    }

    setStep("reset")
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
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
        description: "Пароли не совпадают", 
        variant: "destructive" as any 
      })
      return
    }

    if (newPassword.length < 8) {
      toast({ 
        title: "Ошибка", 
        description: "Пароль должен содержать минимум 8 символов", 
        variant: "destructive" as any 
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, newPassword })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка сброса пароля")
      }
      
      toast({ 
        title: "Успешно", 
        description: "Пароль успешно изменен" 
      })
      
      router.push("/login")
    } catch (e: any) {
      toast({ 
        title: "Ошибка", 
        description: e?.message || "Не удалось сбросить пароль", 
        variant: "destructive" as any 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative bg-dots-pattern">
      <div className="mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <Image src="/logo-s7.png" alt="S7 Robotics Logo" width={80} height={80} className="mx-auto" />
      </div>

      <div
        className="w-full max-w-sm bg-[#0b0b0b] border border-dashed border-[#1f1f1f] rounded-2xl p-7 backdrop-blur-[1px] transition-all duration-500 ease-in-out hover:bg-[#141414] hover:border-[#2a2a2a] animate-slide-up"
        style={{ animationDelay: "400ms" }}
      >
        <h1 className="text-white text-3xl font-medium text-center mb-7 transition-all duration-300 tracking-tight">
          Сброс пароля
        </h1>

        {step === "request" && (
          <div className="space-y-6">
            <div>
              <label className="block text-[#a7a7a7] text-sm mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
              />
            </div>

            <Button
              onClick={handleRequestReset}
              disabled={loading}
              className="w-full bg-[#0f0f0f] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#2a2a2a] text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-102 active:scale-95"
            >
              {loading ? "Отправка..." : "Отправить код"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="text-[#a7a7a7] text-sm hover:text-white transition-all duration-300"
              >
                Назад к входу
              </button>
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-[#a7a7a7] text-sm">
                Мы отправили код сброса пароля на <span className="text-white">{email}</span>
              </p>
            </div>

            <div>
              <label className="block text-[#a7a7a7] text-sm mb-2">Код подтверждения</label>
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
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={code.length !== 6}
              className="w-full bg-[#0f0f0f] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#2a2a2a] text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-102 active:scale-95"
            >
              Подтвердить код
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleRequestReset}
                disabled={countdown > 0 || loading}
                variant="outline"
                className="flex-1 border-[#1f1f1f] text-[#a7a7a7] hover:bg-[#141414] hover:border-[#2a2a2a] hover:text-white"
              >
                {countdown > 0 ? `Отправить заново (${countdown})` : "Отправить заново"}
              </Button>
              <Button
                onClick={() => setStep("request")}
                variant="outline"
                className="flex-1 border-[#1f1f1f] text-[#a7a7a7] hover:bg-[#141414] hover:border-[#2a2a2a] hover:text-white"
              >
                Назад
              </Button>
            </div>
          </div>
        )}

        {step === "reset" && (
          <div className="space-y-6">
            <div>
              <label className="block text-[#a7a7a7] text-sm mb-2">Новый пароль</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новый пароль"
                className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
              />
            </div>

            <div>
              <label className="block text-[#a7a7a7] text-sm mb-2">Подтвердите пароль</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
              />
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-[#0f0f0f] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#2a2a2a] text-white font-medium py-3 rounded-full transition-all duration-300 transform hover:scale-102 active:scale-95"
            >
              {loading ? "Сброс..." : "Сбросить пароль"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => setStep("code")}
                className="text-[#a7a7a7] text-sm hover:text-white transition-all duration-300"
              >
                Назад
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-slide-up"
        style={{ animationDelay: "1800ms" }}
      >
        <div className="text-[#636370] text-xs text-center">
          <div>Version 0.1</div>
          <div>Все права защищены ОПТ "S7 Robotics"</div>
        </div>
      </div>
    </div>
  )
}