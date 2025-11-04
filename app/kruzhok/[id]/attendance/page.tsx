"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

interface StudentRow {
  id: string
  fullName: string
}

export default function KruzhokAttendancePage() {
  const params = useParams()
  const kruzhokId = params.id as string

  const [students, setStudents] = useState<StudentRow[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [checks, setChecks] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newStudent, setNewStudent] = useState("")
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().slice(0,10))

  const ruDate = useMemo(() => {
    const now = new Date()
    const d = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(now).split(" ")
    return { day: d[0], month: d[1], year: d[2] }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    apiFetch<{ students: StudentRow[]; dates: string[]; marks: Record<string, Record<string, boolean>> }>(`/api/kruzhok/${kruzhokId}/attendance`)
      .then((data) => {
        if (!alive) return
        setStudents(data.students || [])
        setDates(data.dates || [])
        setChecks(data.marks || {})
      })
      .catch((e) => { if (alive) setError(e?.message || "Не удалось загрузить журнал") })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [kruzhokId])

  const toggle = async (sid: string, date: string) => {
    try {
      const iso = new Date(date).toISOString().slice(0,10)
      const res = await apiFetch<{ present: boolean }>(`/api/kruzhok/${kruzhokId}/attendance/toggle`, {
        method: "POST",
        body: JSON.stringify({ studentId: sid, date: iso })
      })
      setChecks((prev) => ({
        ...prev,
        [sid]: { ...(prev[sid] || {}), [iso]: Boolean(res.present) },
      }))
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось изменить отметку", variant: "destructive" as any })
    }
  }

  const addStudent = async () => {
    const name = newStudent.trim()
    if (!name) return
    try {
      const created = await apiFetch<StudentRow>(`/api/kruzhok/${kruzhokId}/students`, { method: "POST", body: JSON.stringify({ fullName: name }) })
      setStudents((prev) => [...prev, created])
      setNewStudent("")
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось добавить ученика", variant: "destructive" as any })
    }
  }

  const addDate = async () => {
    const d = newDate.trim()
    if (!d) return
    try {
      const created = await apiFetch<{ id: string; date: string }>(`/api/kruzhok/${kruzhokId}/sessions`, { method: "POST", body: JSON.stringify({ date: d }) })
      const iso = new Date(created.date).toISOString().slice(0,10)
      setDates((prev) => (prev.includes(iso) ? prev : [...prev, iso]).sort())
      toast({ title: "Дата добавлена" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось добавить дату", variant: "destructive" as any })
    }
  }

  const save = async () => {
    toast({ title: "Сохранено" })
  }

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-white/80">Загрузка журнала...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-red-400">{error}</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-3xl font-bold text-white mb-1">Журнал посещаемости</div>
          <div className="text-white/60">Кружок {kruzhokId}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{ruDate.day} {ruDate.month}</div>
          <div className="text-white/50">{ruDate.year}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 bg-[#16161c] border border-[#2a2a35] rounded-2xl p-3">
          <Input value={newStudent} onChange={(e) => setNewStudent(e.target.value)} placeholder="ФИО ученика" className="bg-[#0f0f14] border-[#2a2a35] text-white" />
          <Button onClick={addStudent} className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">Добавить ученика</Button>
        </div>
        <div className="flex items-center gap-2 bg-[#16161c] border border-[#2a2a35] rounded-2xl p-3">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-[#0f0f14] border-[#2a2a35] text-white" />
          <Button onClick={addDate} className="bg-[#00a3ff] text-black hover:bg-[#0088cc]">Добавить дату</Button>
        </div>
        <div className="ml-auto">
          <Button onClick={save} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">Сохранить</Button>
        </div>
      </div>

      <div className="overflow-auto bg-[#16161c] border border-[#2a2a35] rounded-2xl">
        <table className="min-w-full text-white">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[#16161c] px-4 py-3 text-left border-b border-[#2a2a35]">ФИО</th>
              {dates.map((d) => (
                <th key={d} className="px-4 py-3 text-center border-b border-[#2a2a35] whitespace-nowrap">{new Date(d).toLocaleDateString("ru-RU")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-[#2a2a35]">
                <td className="sticky left-0 bg-[#16161c] px-4 py-3 border-r border-[#2a2a35] whitespace-nowrap">{s.fullName}</td>
                {dates.map((d) => (
                  <td key={d} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#00a3ff]"
                      checked={Boolean(checks[s.id]?.[d])}
                      onChange={() => toggle(s.id, d)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
