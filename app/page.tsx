"use client"
import SocialPanel from "@/components/social-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"
import { toast } from "@/hooks/use-toast"
import { EmailVerification } from "@/components/auth/email-verification"
import { RegisterVerification } from "@/components/auth/register-verification"

export default function LoginPage() {
  const router = useRouter()
  const { login, register, updateProfile } = useAuth()
  const { user, loading } = useAuth() as any
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [institution, setInstitution] = useState("")
  const [age, setAge] = useState("")
  const [primaryRole, setPrimaryRole] = useState("")
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false)
  const [requiresRegisterVerification, setRequiresRegisterVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard")
    }
  }, [user, loading, router])

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка входа")
      }
      
      if (data.requiresEmailVerification) {
        setRequiresEmailVerification(true)
        setVerificationEmail(data.email)
      } else {
        // Direct login (for dev mode)
        await login(email.trim(), password)
        toast({ title: "Вход выполнен", description: "Добро пожаловать!" })
        router.push("/dashboard")
      }
    } catch (e: any) {
      toast({ title: "Ошибка входа", description: e?.message || "Проверьте почту и пароль", variant: "destructive" as any })
    }
  }

  const handleRegister = async () => {
    try {
      if (!name.trim() || !age.trim() || !institution.trim() || !primaryRole.trim()) {
        toast({ title: "Заполните все поля", description: "Полное имя, Возраст, Учебное заведение и Роль обязательны", variant: "destructive" as any })
        return
      }
      const ageNum = parseInt(age.trim(), 10)
      if (isNaN(ageNum) || ageNum <= 0) {
        toast({ title: "Некорректный возраст", description: "Введите целое число", variant: "destructive" as any })
        return
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password,
          fullName: name.trim(),
          age: ageNum,
          educationalInstitution: institution.trim(),
          primaryRole: primaryRole.trim()
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации")
      }
      
      if (data.requiresEmailVerification) {
        setRequiresRegisterVerification(true)
        setVerificationEmail(data.email)
      } else {
        // Direct registration (shouldn't happen with email verification)
        await register(email.trim(), password)
        await updateProfile({ fullName: name.trim(), institution: institution.trim(), age: ageNum, primaryRole: primaryRole.trim() })
        toast({ title: "Регистрация успешна", description: "Заполните профиль в разделе Профиль" })
        router.push("/dashboard")
      }
    } catch (e: any) {
      toast({ title: "Ошибка регистрации", description: e?.message || "Попробуйте другой e-mail", variant: "destructive" as any })
    }
  }

  const handleLoginVerificationSuccess = async (data: any) => {
    // Set tokens and user data
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)
    
    // Redirect to dashboard
    router.push("/dashboard")
    router.refresh()
  }

  const handleRegisterVerificationSuccess = async (data: any) => {
    // Set tokens and user data
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)
    
    // Redirect to dashboard
    router.push("/dashboard")
    router.refresh()
  }

  const handleBackToLogin = () => {
    setRequiresEmailVerification(false)
    setRequiresRegisterVerification(false)
    setVerificationEmail("")
  }

  if (requiresEmailVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative bg-dots-pattern">
        <div className="mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <Image src="/logo-s7.png" alt="S7 Robotics Logo" width={80} height={80} className="mx-auto" />
        </div>

        <div
          className="w-full max-w-sm bg-[#0b0b0b] border border-dashed border-[#1f1f1f] rounded-2xl p-7 backdrop-blur-[1px] transition-all duration-500 ease-in-out hover:bg-[#141414] hover:border-[#2a2a2a] animate-slide-up"
          style={{ animationDelay: "400ms" }}
        >
          <EmailVerification 
            email={verificationEmail} 
            onVerified={handleLoginVerificationSuccess}
            onBack={handleBackToLogin}
          />
        </div>

        <SocialPanel />
        <div className="flex items-center space-x-2 mt-8 animate-slide-up" style={{ animationDelay: "1400ms" }}>
          <i className="bi bi-exclamation-circle w-5 h-5 text-white"></i>
          <span className="text-[#a7a7a7] text-sm">Пользовательские соглашения</span>
        </div>
        <div className="absolute bottom-6 right-6 text-right animate-slide-up" style={{ animationDelay: "1600ms" }}>
          <div className="text-white font-medium">Обновление</div>
          <div className="text-white text-2xl font-bold">1.0</div>
          <div className="text-[#a7a7a7] text-sm">Новые плюшки</div>
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

  if (requiresRegisterVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative bg-dots-pattern">
        <div className="mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <Image src="/logo-s7.png" alt="S7 Robotics Logo" width={80} height={80} className="mx-auto" />
        </div>

        <div
          className="w-full max-w-sm bg-[#0b0b0b] border border-dashed border-[#1f1f1f] rounded-2xl p-7 backdrop-blur-[1px] transition-all duration-500 ease-in-out hover:bg-[#141414] hover:border-[#2a2a2a] animate-slide-up"
          style={{ animationDelay: "400ms" }}
        >
          <RegisterVerification 
            email={verificationEmail} 
            onVerified={handleRegisterVerificationSuccess}
            onBack={handleBackToLogin}
          />
        </div>

        <SocialPanel />
        <div className="flex items-center space-x-2 mt-8 animate-slide-up" style={{ animationDelay: "1400ms" }}>
          <i className="bi bi-exclamation-circle w-5 h-5 text-white"></i>
          <span className="text-[#a7a7a7] text-sm">Пользовательские соглашения</span>
        </div>
        <div className="absolute bottom-6 right-6 text-right animate-slide-up" style={{ animationDelay: "1600ms" }}>
          <div className="text-white font-medium">Обновление</div>
          <div className="text-white text-2xl font-bold">1.0</div>
          <div className="text-[#a7a7a7] text-sm">Новые плюшки</div>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative bg-dots-pattern">
      <div className={`${isLogin ? "mb-12" : "mb-16"} animate-slide-up`} style={{ animationDelay: "200ms" }}>
        <Image src="/logo-s7.png" alt="S7 Robotics Logo" width={80} height={80} className="mx-auto" />
      </div>

      <div
        className={`w-full max-w-sm bg-[#0b0b0b] border border-dashed border-[#1f1f1f] rounded-2xl ${isLogin ? "p-6" : "p-7"} backdrop-blur-[1px] transition-all duration-500 ease-in-out hover:bg-[#141414] hover:border-[#2a2a2a] animate-slide-up`}
        style={{ animationDelay: "400ms" }}
      >
        <h1 className={`text-white text-3xl font-medium text-center ${isLogin ? "mb-6" : "mb-7"} transition-all duration-300 tracking-tight`}>
          {isLogin ? "Вход" : "Регистрация"}
        </h1>

        <div>
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${!isLogin ? "max-h-[500px] opacity-100 translate-y-0 mb-6" : "max-h-0 opacity-0 -translate-y-4 mb-0"}`}>
            <div className="space-y-6">
              <div className="relative animate-slide-up" style={{ animationDelay: "600ms" }}>
                <Input
                  type="text"
                  placeholder="Полное имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
                />
                <i className="bi bi-person absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#a7a7a7] transition-colors duration-300"></i>
              </div>
              <div className="relative animate-slide-up" style={{ animationDelay: "650ms" }}>
                <Input
                  type="number"
                  placeholder="Возраст"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-transparent h-auto py-3 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
                />
                <i className="bi bi-calendar absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#a7a7a7] transition-colors duration-300"></i>
              </div>
              <div className="relative animate-slide-up" style={{ animationDelay: "700ms" }}>
                <Input
                  type="text"
                  placeholder="Учебное заведение"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="bg-transparent h-auto py-3 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
                />
                <i className="bi bi-building absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#a7a7a7] transition-colors duration-300"></i>
              </div>
              <div className="relative animate-slide-up" style={{ animationDelay: "750ms" }}>
                <Input
                  type="text"
                  placeholder="Роль (Студент, Учитель, Разработчик...)"
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value)}
                  className="bg-transparent h-auto py-3 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
                />
                <i className="bi bi-person-badge absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#a7a7a7] transition-colors duration-300"></i>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="relative animate-slide-up" style={{ animationDelay: "700ms" }}>
              <Input
                type="email"
                placeholder="Почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent h-auto py-2.5 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
              />
              <i className="bi bi-envelope absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#a7a7a7] transition-colors duration-300"></i>
            </div>
            <div className="relative animate-slide-up" style={{ animationDelay: "800ms" }}>
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent h-auto py-3 border-0 border-b border-[#1f1f1f] rounded-none px-0 pb-3 text-white placeholder:text-[#a7a7a7] focus:border-[#2a2a2a] focus:ring-0 focus-visible:ring-0 transition-all duration-300 hover:border-[#2a2a2a]"
              />
              <i className="bi bi-lock absolute right-0 top-1/2 -translate-y-1/2 text-lg text-[#a7a7a7] transition-colors duration-300"></i>
            </div>
          </div>
        </div>
        <Button
          onClick={isLogin ? handleLogin : handleRegister}
          className={`w-full bg-[#0f0f0f] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#2a2a2a] text-white font-medium py-3 rounded-full ${isLogin ? "mt-8" : "mt-8"} transition-all duration-300 transform hover:scale-102 active:scale-95 animate-slide-up`}
          style={{ animationDelay: "900ms" }}
        >
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </Button>

        {isLogin && (
          <div className="text-center mt-3 animate-slide-up" style={{ animationDelay: "1000ms" }}>
            <button
              onClick={() => router.push(`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`)}
              className="text-[#a7a7a7] text-sm hover:text-white transition-all duration-300"
            >
              Забыли пароль?
            </button>
          </div>
        )}

        <div className="text-center mt-6 animate-slide-up" style={{ animationDelay: "1000ms" }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#a7a7a7] text-sm hover:text-white transition-all duration-300 transform hover:scale-101"
          >
            {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Войти"}
          </button>
        </div>
      </div>

      <SocialPanel />
      <div className="flex items-center space-x-2 mt-8 animate-slide-up" style={{ animationDelay: "1400ms" }}>
        <i className="bi bi-exclamation-circle w-5 h-5 text-white"></i>
        <span className="text-[#a7a7a7] text-sm">Пользовательские соглашения</span>
      </div>
      <div className="absolute bottom-6 right-6 text-right animate-slide-up" style={{ animationDelay: "1600ms" }}>
        <div className="text-white font-medium">Обновление</div>
        <div className="text-white text-2xl font-bold">1.0</div>
        <div className="text-[#a7a7a7] text-sm">Новые плюшки</div>
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