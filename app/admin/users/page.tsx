"use client"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { useConfirm } from "@/components/ui/confirm"
import { toast } from "@/hooks/use-toast"

type Role = "USER" | "ADMIN"
interface User { id: string; email: string; fullName?: string; role: Role; xp?: number; banned?: boolean; bannedReason?: string }

export default function Page() {
  const confirm = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  // awarding functionality removed: admin cannot directly "Выдать" achievements/courses from this list UI

  useEffect(() => {
    apiFetch<User[]>("/api/admin/users")
      .then((list) => setUsers(list))
      .catch(() => setUsers([]))
  }, [])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      
      <div className="flex items-center justify-between mb-6 gap-4 max-w-5xl">
        <h2 className="text-white text-xl font-medium">Пользователи</h2>
        <input
          placeholder="Поиск"
          className="w-60 rounded-full bg-[#16161c] border border-[#2a2a35] px-4 py-2 text-white/80 outline-none focus:border-[#00a3ff]"
        />
      </div>

      <div className="space-y-3 max-w-3xl">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-full bg-[#16161c] border border-[#2a2a35] px-2 py-2 text-white">
            <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 flex-1 hover:opacity-90">
              <span className="inline-flex items-center justify-center rounded-full bg-[#1b1b22] border border-[#2a2a35] w-10 h-8 text-sm text-white/80">
                {u.id.slice(-2)}
              </span>
              <span className="text-white font-medium">{u.fullName || u.email}</span>
              <span className="text-xs rounded-full bg-[#00a3ff] text-black px-2 py-0.5">XP: {u.xp ?? 0}</span>
              {u.banned && (
                <span className="text-xs rounded-full bg-[#ef4444]/20 text-[#ef4444] px-2 py-0.5">Забанен</span>
              )}
            </Link>
            <div className="flex items-center gap-2 pl-3">
              {!u.banned ? (
                <button
                  onClick={async()=>{
                    const res = await confirm({ preset: 'ban' }) as any
                    if (!res || res.ok !== true) return
                    const reason = String(res.reason || '').trim()
                    await apiFetch(`/api/admin/users/${u.id}/ban`, { method: 'POST', body: JSON.stringify({ reason: reason || undefined }) })
                    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,banned:true,bannedReason:reason||undefined}:x))
                  }}
                  className="rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs px-3 py-1"
                >
                  Бан
                </button>
              ) : (
                <button
                  onClick={async()=>{
                    const ok = await confirm({ title: 'Снять бан с пользователя?', confirmText: 'Разбанить', cancelText: 'Отмена' })
                    if (!ok) return
                    await apiFetch(`/api/admin/users/${u.id}/unban`, { method: 'POST' })
                    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,banned:false,bannedReason:undefined}:x))
                  }}
                  className="rounded-full bg-[#2a2a35] hover:bg-[#333344] text-white text-xs px-3 py-1"
                >
                  Разбанить
                </button>
              )}
              {/* "Выдать" removed */}
              <ArrowUpRight className="w-5 h-5 text-[#a0a0b0]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
