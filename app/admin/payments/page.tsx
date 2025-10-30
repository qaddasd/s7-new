"use client"
import { useEffect, useState } from "react"
import { Check, X, RefreshCw } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

type ServerPurchase = {
  id: string
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  payerFullName?: string
  senderCode?: string
  transactionId?: string
  paymentMethod: string
  user: { id: string; email: string; fullName?: string }
  course: { id: string; title: string }
}

export default function Page() {
  const [purchases, setPurchases] = useState<ServerPurchase[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await apiFetch<ServerPurchase[]>("/api/admin/purchases")
      setPurchases(list || [])
    } catch {
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  const approve = async (id: string) => {
    try {
      await apiFetch(`/api/admin/purchases/${id}/approve`, { method: "POST" })
      toast({ title: "Подтверждено" } as any)
      refresh()
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось подтвердить", variant: "destructive" as any })
    }
  }

  const reject = async (id: string) => {
    try {
      await apiFetch(`/api/admin/purchases/${id}/reject`, { method: "POST" })
      toast({ title: "Отклонено" } as any)
      refresh()
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось отклонить", variant: "destructive" as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-medium">Платежи</h2>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[#16161c] border border-[#2a2a35] text-white/80 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Обновить
        </button>
      </div>

      <div className="space-y-3 max-w-4xl">
        {loading && <div className="text-white/60">Загрузка...</div>}
        {!loading && purchases.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl bg-[#16161c] border border-[#2a2a35] px-4 py-3 text-white">
            <div>
              <div className="font-medium">{p.payerFullName || p.user.fullName || p.user.email}</div>
              <div className="text-white/70 text-sm">{p.course.title} • {Number(p.amount).toLocaleString()} ₸ • {new Date(p.createdAt).toLocaleString("ru-RU")}</div>
              {(p.senderCode || p.transactionId) && (
                <div className="text-white/40 text-xs">Код: {p.senderCode || '—'} • Транзакция: {p.transactionId || '—'}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {p.status === "pending" ? (
                <>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ 
                        title: 'Одобрить платеж?', 
                        description: 'Вы уверены, что хотите одобрить этот платеж? Это действие подтвердит оплату и предоставит пользователю доступ к курсу.',
                        confirmText: 'Одобрить', 
                        cancelText: 'Отмена'
                      })
                      if (!ok) return
                      try {
                        await apiFetch(`/api/admin/purchases/${p.id}/approve`, { method: "POST" })
                        toast({ title: 'Платеж одобрен', description: 'Платеж успешно одобрен. Пользователь получил доступ к курсу.' } as any)
                        setPurchases((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "approved" } : x)))
                      } catch (e: any) {
                        toast({ title: 'Ошибка', description: e?.message || 'Не удалось одобрить платеж. Попробуйте позже.', variant: 'destructive' as any })
                      }
                    }}
                    className="text-xs bg-[#22c55e] text-black rounded-full px-3 py-1 hover:bg-[#16a34a]"
                  >
                    Одобрить
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ 
                        title: 'Отклонить платеж?', 
                        description: 'Вы уверены, что хотите отклонить этот платеж? Пользователь не получит доступ к курсу.',
                        confirmText: 'Отклонить', 
                        cancelText: 'Отмена',
                        variant: 'danger'
                      })
                      if (!ok) return
                      try {
                        await apiFetch(`/api/admin/purchases/${p.id}/reject`, { method: "POST" })
                        toast({ title: 'Платеж отклонен', description: 'Платеж успешно отклонен.' } as any)
                        setPurchases((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "rejected" } : x)))
                      } catch (e: any) {
                        toast({ title: 'Ошибка', description: e?.message || 'Не удалось отклонить платеж. Попробуйте позже.', variant: 'destructive' as any })
                      }
                    }}
                    className="text-xs bg-[#ef4444] text-white rounded-full px-3 py-1 hover:bg-[#dc2626]"
                  >
                    Отклонить
                  </button>
                </>
              ) : (
                <div className={`rounded-full px-3 py-1 text-sm ${p.status === 'approved' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                  {p.status === 'approved' ? 'Подтверждён' : 'Отклонён'}
                </div>
              )}
            </div>
          </div>
        ))}
        {!loading && purchases.length === 0 && (
          <div className="text-white/70">Платежей пока нет</div>
        )}
      </div>
    </main>
  )
}
