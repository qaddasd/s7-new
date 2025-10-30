"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TeamItem { id: string; name: string; description?: string; membersCount?: number }

function TeamRow({ id, name, membersCount, onDeleted }: { id: string; name: string; membersCount?: number; onDeleted: (id: string) => void }) {
  const confirm = useConfirm()
  const remove = async () => {
    const ok = await confirm({ 
      title: 'Удалить команду?', 
      description: 'Вы уверены, что хотите удалить эту команду? Все участники будут исключены, а данные команды будут безвозвратно удалены. Это действие невозможно отменить.',
      confirmText: 'Удалить', 
      cancelText: 'Отмена',
      variant: 'danger' 
    })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/teams/${id}`, { method: "DELETE" })
      toast({ title: "Команда удалена", description: "Команда успешно удалена." } as any)
      onDeleted(id)
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось удалить команду. Попробуйте позже.", variant: "destructive" as any })
    }
  }
  return (
    <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 text-white relative animate-slide-up">
      <div className="absolute top-4 right-4 text-white/70 flex items-center gap-2">
        <button onClick={remove} className="p-1 rounded hover:bg-[#2a2a35]" title="Удалить">
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>
        <ArrowUpRight className="w-6 h-6" />
      </div>
      <div className="flex items-center gap-3 mb-1">
        <div className="text-white text-lg font-medium">{name}</div>
        <span className="inline-block bg-[#00a3ff] text-black text-xs font-medium px-3 py-1 rounded-full">Участников: {membersCount ?? 0}</span>
      </div>
      <div className="mt-2">
        <Link href={`/admin/teams/${id}`} className="text-xs bg-[#2a2a35] text-white/80 rounded-full px-3 py-1 hover:bg-[#333344]">
          Управлять
        </Link>
      </div>
    </div>
  )
}

export default function AdminTeams() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [educationalInstitution, setEducationalInstitution] = useState("")
  const [mentorName, setMentorName] = useState("")
  const positionsList = ["Капитан", "Инженер", "Программист", "Дизайнер", "Маркетолог"]
  const [positionsWanted, setPositionsWanted] = useState<Record<string, boolean>>({})
  const [customPositions, setCustomPositions] = useState("")
  const competitionOptions = ["WRO", "Robofest", "FIRST LEGO League", "FIRST Tech Challenge"]
  const [competitions, setCompetitions] = useState<Record<string, boolean>>({})
  const [customCompetitions, setCustomCompetitions] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiFetch<any[]>("/api/admin/teams")
      .then((list) => setTeams((list || []).map((t) => ({ id: t.id, name: t.name, membersCount: (t as any)._count?.memberships || t.membersCount }))))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">Команды</h2>
      <div className="mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00a3ff] hover:bg-[#0088cc] text-black">Создать команду</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#16161c] border border-[#2a2a35] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Новая команда</DialogTitle>
              <DialogDescription className="text-white/70">Заполните данные команды. Эти поля совпадают с пользовательской формой.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Название" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
              <div className="grid grid-cols-1 gap-3">
                <Input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Город" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
                <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Телефон" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
                <Input value={educationalInstitution} onChange={(e)=>setEducationalInstitution(e.target.value)} placeholder="Учебное заведение" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
                <Input value={mentorName} onChange={(e)=>setMentorName(e.target.value)} placeholder="Имя ментора" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
              </div>
              <div>
                <div className="text-white/80 mb-2">Какие позиции нужны</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {positionsList.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPositionsWanted((s) => ({ ...s, [p]: !s[p] }))}
                      className={`text-xs font-medium px-3 py-1 rounded-full border ${positionsWanted[p] ? 'bg-[#00a3ff] text-white border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Input value={customPositions} onChange={(e)=>setCustomPositions(e.target.value)} placeholder="Другая должность (через запятую)" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
              </div>

              <div>
                <div className="text-white/80 mb-2">Соревнования команды</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {competitionOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCompetitions((s) => ({ ...s, [c]: !s[c] }))}
                      className={`text-xs font-medium px-3 py-1 rounded-full border ${competitions[c] ? 'bg-[#00a3ff] text-white border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <Input value={customCompetitions} onChange={(e)=>setCustomCompetitions(e.target.value)} placeholder="Другие (через запятую)" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
              </div>

              <Input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Описание (необязательно)" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
            </div>
            <DialogFooter>
              <Button
                onClick={async ()=>{
                  if (!name.trim()) { toast({ title: "Введите название" } as any); return }
                  setSubmitting(true)
                  try {
                    const selectedPositions = Object.keys(positionsWanted).filter((k) => positionsWanted[k])
                    const extraPositions = customPositions.split(',').map((s) => s.trim()).filter(Boolean)
                    const selectedCompetitions = [
                      ...Object.keys(competitions).filter((k) => competitions[k]),
                      ...customCompetitions.split(',').map((s) => s.trim()).filter(Boolean),
                    ]
                    const created = await apiFetch<any>("/api/admin/teams", {
                      method: "POST",
                      body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim() || undefined,
                        metadata: {
                          city: city || undefined,
                          phone: phone || undefined,
                          educationalInstitution: educationalInstitution || undefined,
                          mentorName: mentorName || undefined,
                          positionsWanted: [...selectedPositions, ...extraPositions],
                          competitions: selectedCompetitions,
                        },
                      })
                    })
                    setTeams((prev)=>[{ id: created.id, name: created.name, membersCount: 0 }, ...prev])
                    setName(""); setDescription(""); setCity(""); setPhone(""); setEducationalInstitution(""); setMentorName(""); setPositionsWanted({}); setCustomPositions(""); setCompetitions({}); setCustomCompetitions("")
                    setOpen(false)
                    toast({ title: "Команда создана" } as any)
                  } catch(e:any) {
                    toast({ title: "Ошибка", description: e?.message || "Не удалось создать", variant: "destructive" as any })
                  } finally { setSubmitting(false) }
                }}
                disabled={submitting}
              >
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-white/60">Загрузка...</div>
        ) : teams.length === 0 ? (
          <div className="text-white/60">Нет команд</div>
        ) : (
          teams.map((t) => (
            <TeamRow key={t.id} id={t.id} name={t.name} membersCount={t.membersCount} onDeleted={(id) => setTeams((prev) => prev.filter((x) => x.id !== id))} />
          ))
        )}
      </div>
    </main>
  )
}


