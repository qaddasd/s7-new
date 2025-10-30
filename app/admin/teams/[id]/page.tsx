"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface MemberRow {
  id: string
  role: string
  status: string
  joinedAt: string
  user: { id: string; email: string; fullName?: string; profile?: { phone?: string | null; socialLinks?: any } | null }
}

export default function TeamMembersAdminPage() {
  const params = useParams() as { id: string }
  const teamId = params.id
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    apiFetch<MemberRow[]>(`/api/admin/teams/${teamId}/members`)
      .then((list) => setMembers(list || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (teamId) load()
  }, [teamId])

  const updateMember = async (membershipId: string, updates: Partial<{ role: string; status: string }>) => {
    try {
      const updated = await apiFetch<MemberRow>(`/api/admin/teams/${teamId}/members/${membershipId}`, { method: "PUT", body: JSON.stringify(updates) })
      setMembers((prev) => prev.map((m) => (m.id === membershipId ? { ...m, ...updates } as any : m)))
      toast({ title: "Сохранено" })
      return updated
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось обновить", variant: "destructive" as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h1 className="text-white text-2xl font-bold mb-6">Участники команды</h1>

      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
        {loading ? (
          <div className="text-white/70">Загрузка...</div>
        ) : members.length === 0 ? (
          <div className="text-white/60">Нет участников</div>
        ) : (
          <div className="divide-y divide-[#2a2a35]">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold">
                    {(m.user.fullName || m.user.email || "?").charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{m.user.fullName || m.user.email}</div>
                    <div className="text-white/60 text-xs">{new Date(m.joinedAt).toLocaleString("ru-RU")}</div>
                    {(m.user.profile?.phone || m.user.profile?.socialLinks) && (
                      <div className="text-white/70 text-xs mt-1 space-x-2">
                        {m.user.profile?.socialLinks?.telegram && (
                          <span>Telegram: {(m.user.profile?.socialLinks?.telegram as string)}</span>
                        )}
                        {m.user.profile?.socialLinks?.whatsapp && (
                          <span>WhatsApp: {(m.user.profile?.socialLinks?.whatsapp as string)}</span>
                        )}
                        {m.user.profile?.phone && (
                          <span>Тел: {(m.user.profile?.phone as string)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={m.role}
                    onChange={(e) => updateMember(m.id, { role: e.target.value })}
                    className="bg-[#0f0f14] border border-[#2a2a35] text-white/90 text-xs rounded-lg px-3 py-2"
                  >
                    <option value="captain">Капитан</option>
                    <option value="member">Участник</option>
                    <option value="mentor">Ментор</option>
                  </select>
                  <select
                    value={m.status}
                    onChange={(e) => updateMember(m.id, { status: e.target.value })}
                    className="bg-[#0f0f14] border border-[#2a2a35] text-white/90 text-xs rounded-lg px-3 py-2"
                  >
                    <option value="active">Активен</option>
                    <option value="pending">Ожидание</option>
                    <option value="rejected">Отклонен</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
