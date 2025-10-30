"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

interface Club { 
  id: string; 
  name: string; 
  description?: string; 
  status: "pending" | "approved" | "rejected";
  user: { id: string; email: string; fullName?: string }
}

export default function AdminClubsPage() {
  const confirm = useConfirm()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Club[]>("/api/admin/clubs")
      .then((list) => setClubs(list || []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false))
  }, [])

  const approveClub = async (id: string) => {
    const ok = await confirm({ 
      title: 'Одобрить заявку?', 
      description: 'Вы уверены, что хотите одобрить эту заявку? Пользователь получит доступ к клубу.',
      confirmText: 'Одобрить', 
      cancelText: 'Отмена'
    })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/clubs/${id}/approve`, { method: "POST" })
      toast({ title: 'Заявка одобрена', description: 'Заявка успешно одобрена. Пользователь получил доступ к клубу.' } as any)
      setClubs(prev => prev.map(x => x.id === id ? { ...x, status: "approved" } : x))
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось одобрить заявку. Попробуйте позже.', variant: 'destructive' as any })
    }
  }

  const rejectClub = async (id: string) => {
    const ok = await confirm({ 
      title: 'Отклонить заявку?', 
      description: 'Вы уверены, что хотите отклонить эту заявку? Пользователь не получит доступ к клубу.',
      confirmText: 'Отклонить', 
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/clubs/${id}/reject`, { method: "POST" })
      toast({ title: 'Заявка отклонена', description: 'Заявка успешно отклонена.' } as any)
      setClubs(prev => prev.map(x => x.id === id ? { ...x, status: "rejected" } : x))
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось отклонить заявку. Попробуйте позже.', variant: 'destructive' as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h1 className="text-white text-2xl font-bold mb-6">Заявки в клубы</h1>

      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
        {loading ? (
          <div className="text-white/70">Загрузка...</div>
        ) : clubs.length === 0 ? (
          <div className="text-white/60">Нет заявок</div>
        ) : (
          <div className="divide-y divide-[#2a2a35]">
            {clubs.map((c) => (
              <div key={c.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold">
                    {(c.user.fullName || c.user.email || "?").charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{c.user.fullName || c.user.email}</div>
                    <div className="text-white/60 text-sm">{c.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.status === "pending" ? (
                    <>
                      <button
                        onClick={() => approveClub(c.id)}
                        className="text-xs bg-[#22c55e] text-black rounded-full px-3 py-1 hover:bg-[#16a34a]"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => rejectClub(c.id)}
                        className="text-xs bg-[#ef4444] text-white rounded-full px-3 py-1 hover:bg-[#dc2626]"
                      >
                        Отклонить
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs rounded-full px-3 py-1 ${
                      c.status === "approved" 
                        ? "bg-[#22c55e]/20 text-[#22c55e]" 
                        : "bg-[#ef4444]/20 text-[#ef4444]"
                    }`}>
                      {c.status === "approved" ? "Одобрено" : "Отклонено"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}