"use client"
import { ArrowUpRight } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

type Role = "USER" | "ADMIN"
interface Course { id: string; title: string }
interface Overview {
  user: {
    id: string
    email: string
    fullName?: string
    role: Role
    enrollments: { course: { id: string; title: string } }[]
    teamMemberships: { id: string; status: string; role: string; team: { id: string; name: string } }[]
  }
  purchases: { id: string; amount: number; currency: string; status: string; createdAt: string; payerFullName?: string; senderCode?: string }[]
  registrations: { id: string; status: string; event: { id: string; title: string; date?: string } }[]
  achievements: { id: string; achievement: { title: string } }[]
  competitionSubmissions: { id: string; title: string; placement?: string }[]
}

export default function Page({ params }: { params: { id: string } }) {
  const [name, setName] = useState<string>("")
  const [role, setRole] = useState<Role | "">("")
  // Issuance UI removed: admin cannot directly grant achievements or enroll courses from this user details page.
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  useEffect(() => {
    apiFetch<{ id: string; email: string; role: Role; fullName?: string }[]>(`/api/admin/users`)
      .then((list) => {
        const found = list.find((x) => x.id === params.id)
        if (found) {
          setName(found.fullName || found.email || params.id)
          setRole(found.role)
        } else {
          setName(params.id)
        }
      })
      .catch(() => setName(params.id))
  }, [params.id])

  useEffect(() => {
    apiFetch<Overview>(`/api/admin/users/${params.id}/overview`)
      .then((o) => setOverview(o))
      .catch(() => setOverview(null))
      .finally(() => setLoadingOverview(false))
  }, [params.id])

  const approveReg = async (eventId: string, regId: string) => {
    try {
      await apiFetch(`/api/admin/events/${eventId}/registrations/${regId}/approve`, { method: "POST" })
      setOverview((prev) => prev ? { ...prev, registrations: prev.registrations.map(r => r.id === regId ? { ...r, status: "approved" } : r) } : prev)
      toast({ title: "Заявка одобрена" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось одобрить", variant: "destructive" as any })
    }
  }

  const rejectReg = async (eventId: string, regId: string) => {
    try {
      await apiFetch(`/api/admin/events/${eventId}/registrations/${regId}/reject`, { method: "POST" })
      setOverview((prev) => prev ? { ...prev, registrations: prev.registrations.map(r => r.id === regId ? { ...r, status: "rejected" } : r) } : prev)
      toast({ title: "Заявка отклонена" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось отклонить", variant: "destructive" as any })
    }
  }

  const promote = async () => {
    try {
      await apiFetch(`/api/admin/users/${params.id}/promote`, { method: "POST" })
      setRole("ADMIN")
      toast({ title: "Роль обновлена", description: "Пользователь назначен админом" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось назначить админом", variant: "destructive" as any })
    }
  }

  const demote = async () => {
    try {
      await apiFetch(`/api/admin/users/${params.id}/demote`, { method: "POST" })
      setRole("USER")
      toast({ title: "Роль обновлена", description: "Права администратора сняты" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось снять права", variant: "destructive" as any })
    }
  }

  // issueAchievement and issueCourse removed — granting is disabled from UI.

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="max-w-4xl space-y-4">
        
        <div className="flex items-center justify-between rounded-full bg-[#16161c] border border-[#2a2a35] px-2 py-2 text-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-[#1b1b22] border border-[#2a2a35] w-10 h-8 text-sm text-white/80">
              {params.id.slice(-2)}
            </span>
            <span className="font-medium">{name}</span>
          </div>
          <ArrowUpRight className="w-5 h-5 text-[#a0a0b0]" />
        </div>

        
        <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-3">
          <div className="text-white/90 font-medium">Информация</div>
          <div className="text-white/80 text-sm">Роль: <span className="font-semibold">{role || "—"}</span></div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={promote} className="rounded-lg bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium py-2">Назначить админом</button>
            <button onClick={demote} className="rounded-lg bg-[#2a2a35] hover:bg-[#333344] py-2">Снять админа</button>
          </div>
        </section>

        
        <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-4">
          <div className="text-white/90 font-medium">Достижения</div>
          <div className="text-sm text-white/60">Возможность напрямую выдать достижения удалена.</div>
        </section>

        
        <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-4">
          <div className="text-white/90 font-medium">Курсы</div>
          <div className="text-sm text-white/60">Прямое вручение курсов удалено из интерфейса.</div>
        </section>

        
        <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-4">
          <div className="text-white/90 font-medium">Мастер-классы</div>
          {loadingOverview ? (
            <div className="text-white/60">Загрузка...</div>
          ) : overview && overview.registrations.length > 0 ? (
            <div className="space-y-2 text-sm">
              {overview.registrations.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2">
                  <div>
                    <div className="text-white/90">{r.event.title}</div>
                    <div className="text-white/60 text-xs">{r.event.date ? new Date(r.event.date).toLocaleString('ru-RU') : ''}</div>
                    <div className="text-white/60 text-xs">Статус: {r.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveReg(r.event.id, r.id)} className="px-3 py-1 text-xs rounded bg-[#22c55e] text-black">Одобрить</button>
                    <button onClick={() => rejectReg(r.event.id, r.id)} className="px-3 py-1 text-xs rounded bg-[#ef4444] text-white">Отклонить</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/60">Нет заявок</div>
          )}
        </section>

        
        <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-4">
          <div className="text-white/90 font-medium">Платежи</div>
          {loadingOverview ? (
            <div className="text-white/60">Загрузка...</div>
          ) : overview && overview.purchases.length > 0 ? (
            <div className="divide-y divide-[#2a2a35] text-sm">
              {overview.purchases.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-white/90">{Number(p.amount).toLocaleString()} {p.currency}</div>
                    <div className="text-white/60 text-xs">{new Date(p.createdAt).toLocaleString('ru-RU')} · {p.status}</div>
                    <div className="text-white/60 text-xs">{p.payerFullName || '—'} · {p.senderCode || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/60">Нет платежей</div>
          )}
        </section>
      </div>

      
      {/* achievement issuance UI removed */}

      
      {/* course issuance UI removed */}
    </main>
  )
}
