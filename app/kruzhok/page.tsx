"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Kruzhok {
  id: string
  name: string
  description?: string
  maxCapacity: number
  isActive: boolean
  isPaid: boolean
  accessCode?: string
  subscriptionStatus: string
  admin?: { id: string; fullName: string }
  _count?: { members: number }
}

interface EnrollmentRequest {
  id: string
  kruzhokId: string
  enrollmentStatus: string
  enrolledAt: string
  kruzhok: {
    id: string
    name: string
    description?: string
  }
}

export default function UserKruzhokPage() {
  const [allKruzhoks, setAllKruzhoks] = useState<Kruzhok[]>([])
  const [myKruzhoks, setMyKruzhoks] = useState<Kruzhok[]>([])
  const [myRequests, setMyRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [enrollCode, setEnrollCode] = useState("")
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allData, myData, requestsData] = await Promise.all([
        apiFetch<Kruzhok[]>("/api/kruzhok"),
        apiFetch<Kruzhok[]>("/api/kruzhok/my-clubs"),
        apiFetch<EnrollmentRequest[]>("/api/kruzhok/my-requests"),
      ])
      setAllKruzhoks(allData || [])
      setMyKruzhoks(myData || [])
      setMyRequests(requestsData || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить кружки",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите код доступа",
        variant: "destructive" as any,
      })
      return
    }

    try {
      setEnrolling(true)
      const result = await apiFetch("/api/kruzhok/enroll-by-code", {
        method: "POST",
        body: JSON.stringify({ accessCode: enrollCode }),
      })
      setMyRequests([...myRequests, result])
      setEnrollCode("")
      setShowEnrollForm(false)
      toast({
        title: "Успешно",
        description: "Заявка отправлена. Ожидание одобрения владельца кружка.",
      })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error?.message || "Не удалось отправить заявку",
        variant: "destructive" as any,
      })
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h1 className="text-white text-2xl font-bold mb-6">Мои кружки</h1>

      {/* My Enrolled Clubs */}
      {myKruzhoks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white text-lg font-bold mb-4">Мои кружки ({myKruzhoks.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myKruzhoks.map((k) => (
              <Link key={k.id} href={`/kruzhok/${k.id}`}>
                <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 hover:border-[#00a3ff]/50 transition cursor-pointer h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold flex-shrink-0">
                      {k.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate">{k.name}</h3>
                      <p className="text-white/60 text-xs truncate">{k.admin?.fullName}</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2 mb-3">{k.description}</p>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{k._count?.members || 0} участников</span>
                    {k.isPaid && <span className="text-[#22c55e]">Платный</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Enrollment Requests */}
      {myRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white text-lg font-bold mb-4">Заявки на рассмотрении ({myRequests.length})</h2>
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
            <div className="divide-y divide-[#2a2a35]">
              {myRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{req.kruzhok.name}</div>
                    <div className="text-white/60 text-sm">{req.kruzhok.description}</div>
                    <div className="text-white/40 text-xs mt-1">
                      Отправлена: {new Date(req.enrolledAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <div className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-medium px-2 py-1 rounded-full">
                    Ожидание
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enroll by Code */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Присоединиться к кружку</h2>
          <Button
            onClick={() => setShowEnrollForm(!showEnrollForm)}
            className="bg-[#00a3ff] text-black hover:bg-[#0088cc]"
          >
            {showEnrollForm ? "Отмена" : "Ввести код"}
          </Button>
        </div>

        {showEnrollForm && (
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 mb-4">
            <form onSubmit={handleEnrollByCode} className="space-y-3">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Код доступа</label>
                <Input
                  type="text"
                  placeholder="Введите код доступа кружка"
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                  className="bg-[#1e1e26] border-[#636370]/20 text-white font-mono"
                  disabled={enrolling}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={enrolling}
                  className="bg-[#22c55e] text-black hover:bg-[#16a34a] disabled:opacity-50"
                >
                  {enrolling ? "Отправка..." : "Отправить заявку"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowEnrollForm(false)}
                  className="bg-[#636370] text-white hover:bg-[#4a4a52]"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Available Clubs */}
      <div>
        <h2 className="text-white text-lg font-bold mb-4">Доступные кружки</h2>
        {loading ? (
          <div className="text-white/70">Загрузка...</div>
        ) : allKruzhoks.length === 0 ? (
          <div className="text-white/60">Нет доступных кружков</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allKruzhoks.map((k) => {
              const isEnrolled = myKruzhoks.some((m) => m.id === k.id)
              const hasPendingRequest = myRequests.some((r) => r.kruzhokId === k.id)

              return (
                <div
                  key={k.id}
                  className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 hover:border-[#00a3ff]/50 transition"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold flex-shrink-0">
                      {k.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate">{k.name}</h3>
                      <p className="text-white/60 text-xs truncate">{k.admin?.fullName}</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2 mb-3">{k.description}</p>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                    <span>{k._count?.members || 0} участников</span>
                    {k.isPaid && <span className="text-[#22c55e]">Платный</span>}
                  </div>

                  {isEnrolled ? (
                    <div className="bg-[#22c55e]/20 text-[#22c55e] text-xs font-medium px-2 py-1 rounded-full w-full text-center">
                      Вы участник
                    </div>
                  ) : hasPendingRequest ? (
                    <div className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-medium px-2 py-1 rounded-full w-full text-center">
                      Заявка отправлена
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEnrollCode(k.accessCode || "")
                        setShowEnrollForm(true)
                      }}
                      className="w-full bg-[#00a3ff] text-black text-xs font-medium px-2 py-1 rounded-full hover:bg-[#0088cc] transition"
                    >
                      Присоединиться
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
