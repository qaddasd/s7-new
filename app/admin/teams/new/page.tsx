"use client"
import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

export default function Page() {
  const router = useRouter()
  const search = useSearchParams()
  const editId = search.get("edit")
  const [title, setTitle] = useState("")
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
  const isEdit = Boolean(editId)
  const confirm = useConfirm()

  useEffect(() => {
    if (!editId) return
    apiFetch<any[]>("/api/admin/teams")
      .then((list) => {
        const t = (list || []).find((x) => x.id === editId)
        if (t) {
          setTitle(t.name || "")
          setDescription(t.description || "")
          const meta = t.metadata || {}
          if (meta.city) setCity(String(meta.city))
          if (meta.phone) setPhone(String(meta.phone))
          if (meta.educationalInstitution) setEducationalInstitution(String(meta.educationalInstitution))
          if (meta.mentorName) setMentorName(String(meta.mentorName))
          if (Array.isArray(meta.positionsWanted)) {
            const map: Record<string, boolean> = {}
            meta.positionsWanted.forEach((p: string) => { map[p] = true })
            setPositionsWanted(map)
          }
          if (Array.isArray(meta.competitions)) {
            const map: Record<string, boolean> = {}
            meta.competitions.forEach((c: string) => { map[c] = true })
            setCompetitions(map)
          }
        }
      })
      .catch(() => {})
  }, [editId])

  useEffect(() => {
    if (editId) return
    try {
      const raw = localStorage.getItem('s7_admin_team_draft')
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.title) setTitle(d.title)
      if (d.description) setDescription(d.description)
      if (d.city) setCity(d.city)
      if (d.phone) setPhone(d.phone)
      if (d.educationalInstitution) setEducationalInstitution(d.educationalInstitution)
      if (d.mentorName) setMentorName(d.mentorName)
      if (d.positionsWanted && typeof d.positionsWanted === 'object') setPositionsWanted(d.positionsWanted)
      if (d.customPositions) setCustomPositions(d.customPositions)
      if (d.competitions && typeof d.competitions === 'object') setCompetitions(d.competitions)
      if (d.customCompetitions) setCustomCompetitions(d.customCompetitions)
    } catch {}
  }, [editId])

  const saveTeam = async () => {
    if (!title.trim()) return
    try {
      const ok = await confirm({ title: isEdit ? 'Сохранить изменения?' : 'Создать команду?', confirmText: isEdit ? 'Сохранить' : 'Создать', cancelText: 'Отмена' })
      if (!ok) return
      const selectedPositions = Object.keys(positionsWanted).filter((k) => positionsWanted[k])
      const extraPositions = customPositions.split(',').map((s) => s.trim()).filter(Boolean)
      const selectedCompetitions = [
        ...Object.keys(competitions).filter((k) => competitions[k]),
        ...customCompetitions.split(',').map((s) => s.trim()).filter(Boolean),
      ]
      const metadata: any = {}
      if (city.trim()) metadata.city = city.trim()
      if (phone.trim()) metadata.phone = phone.trim()
      if (educationalInstitution.trim()) metadata.educationalInstitution = educationalInstitution.trim()
      if (mentorName.trim()) metadata.mentorName = mentorName.trim()
      if ([...selectedPositions, ...extraPositions].length) metadata.positionsWanted = [...selectedPositions, ...extraPositions]
      if (selectedCompetitions.length) metadata.competitions = selectedCompetitions
      if (isEdit) {
        await apiFetch(`/api/admin/teams/${editId}`, { method: "PUT", body: JSON.stringify({ name: title.trim(), description: description.trim() || undefined, city, phone, educationalInstitution, mentorName, metadata }) })
      } else {
        await apiFetch(`/api/admin/teams`, { method: "POST", body: JSON.stringify({ name: title.trim(), description: description.trim() || undefined, city, phone, educationalInstitution, mentorName, metadata }) })
      }
      toast({ title: isEdit ? "Сохранено" : "Создано" })
      try { localStorage.removeItem('s7_admin_team_draft') } catch {}
      router.push("/admin/teams")
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось сохранить", variant: "destructive" as any })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <h2 className="text-white text-xl font-medium mb-6">{isEdit ? "Редактировать команду" : "Добавить команду"}</h2>

      <div className="max-w-3xl space-y-5">
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название команды"
            className="w-full bg-transparent outline-none"
          />
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Город" className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white outline-none" />
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Телефон" className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white outline-none" />
          <input value={educationalInstitution} onChange={(e)=>setEducationalInstitution(e.target.value)} placeholder="Учебное заведение команды" className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white outline-none md:col-span-2" />
          <input value={mentorName} onChange={(e)=>setMentorName(e.target.value)} placeholder="Имя ментора" className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white outline-none md:col-span-2" />
        </div>

        
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-4 text-white">
          <div className="text-white/80 mb-2">Какие позиции нужны</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {positionsList.map((p) => (
              <button key={p} type="button" onClick={() => setPositionsWanted((s)=>({ ...s, [p]: !s[p] }))} className={`text-xs font-medium px-3 py-1 rounded-full border ${positionsWanted[p] ? 'bg-[#00a3ff] text-white border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}>
                {p}
              </button>
            ))}
          </div>
          <input value={customPositions} onChange={(e)=>setCustomPositions(e.target.value)} placeholder="Другая должность (через запятую)" className="w-full bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white outline-none" />
        </div>

        
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-4 text-white">
          <div className="text-white/80 mb-2">Соревнования команды</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {competitionOptions.map((c) => (
              <button key={c} type="button" onClick={() => setCompetitions((s)=>({ ...s, [c]: !s[c] }))} className={`text-xs font-medium px-3 py-1 rounded-full border ${competitions[c] ? 'bg-[#00a3ff] text-white border-[#00a3ff]' : 'bg-transparent text-white/80 border-[#2a2a35]'}`}>
                {c}
              </button>
            ))}
          </div>
          <input value={customCompetitions} onChange={(e)=>setCustomCompetitions(e.target.value)} placeholder="Другие (через запятую)" className="w-full bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white outline-none" />
        </div>

        
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl px-4 py-3 text-white">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
            className="w-full bg-transparent outline-none min-h-28"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem('s7_admin_team_draft', JSON.stringify({ title, description, city, phone, educationalInstitution, mentorName, positionsWanted, customPositions, competitions, customCompetitions })) } catch {}
              toast({ title: 'Черновик сохранён' })
            }}
            className="rounded-2xl bg-[#2a2a35] hover:bg-[#333344] text-white font-medium py-4 transition-colors"
          >
            Сохранить черновик
          </button>
          <button
            onClick={saveTeam}
            className="rounded-2xl bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium py-4 flex items-center justify-between px-4 transition-colors"
          >
            <span>{isEdit ? "Сохранить" : "Добавить"}</span>
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  )
}
