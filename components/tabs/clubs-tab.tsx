"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Plus, Calendar, MapPin, Users, Check, X, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type Club = {
  id: string
  name: string
  description?: string
  location?: string
  mentors?: Array<{ user: { id: string; fullName?: string; email: string } }>
  classes?: Array<{
    id: string
    title: string
    description?: string
    location?: string
    enrollments?: Array<{ user: { id: string; fullName: string; email: string } }>
    scheduleItems?: Array<{ id: string; dayOfWeek: number; startTime: string; endTime: string; location?: string }>
    sessions?: Array<{ id: string; date: string }>
  }>
}

export default function ClubsTab() {
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState<Club[]>([])
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [desc, setDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [mentorEmail, setMentorEmail] = useState<Record<string, string>>({})
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null)
  const [newClass, setNewClass] = useState<Record<string, { title: string; description?: string; location?: string }>>({})
  const [enrollEmail, setEnrollEmail] = useState<Record<string, string>>({})
  const [schedForm, setSchedForm] = useState<Record<string, { dayOfWeek: number; startTime: string; endTime: string; location?: string }>>({})
  const [genRange, setGenRange] = useState<Record<string, { from: string; to: string }>>({})
  const [sessions, setSessions] = useState<Record<string, Array<{ id: string; date: string }>>>({})
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, Record<string, { status: string; feedback?: string }>>>({})
  const [loadingSessions, setLoadingSessions] = useState<Record<string, boolean>>({})
  const [resources, setResources] = useState<Record<string, Array<{ id: string; title: string; description?: string; url: string }>>>({})
  const [resForm, setResForm] = useState<Record<string, { title: string; url: string; description?: string }>>({})
  const [assignments, setAssignments] = useState<Record<string, Array<{ id: string; title: string; description?: string; dueAt?: string }>>>({})
  const [assignForm, setAssignForm] = useState<Record<string, { title: string; description?: string; dueAt?: string }>>({})
  const [subs, setSubs] = useState<Record<string, Array<{ id: string; student: { id: string; fullName?: string; email: string }; grade?: number; feedback?: string; submittedAt: string }>>>({})
  const [mySub, setMySub] = useState<Record<string, { answerText?: string; attachmentUrl?: string }>>({})
  const [gradeForm, setGradeForm] = useState<Record<string, { grade?: number; feedback?: string }>>({})

  const load = async () => {
    setLoading(true)
    try {
      const list = await apiFetch<Club[]>("/api/clubs/mine")
      setClubs(list)
    } catch {
      setClubs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createClub = async () => {
    if (!name.trim()) return
    try {
      setCreating(true)
      await apiFetch<Club>("/api/clubs", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined, location: location.trim() || undefined })
      })
      setName("")
      setLocation("")
      setDesc("")
      await load()
      toast({ title: "Кружок создан" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось создать", variant: "destructive" as any })
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up space-y-6">
      <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Plus className="w-5 h-5" />
          <div className="font-semibold">Создать кружок</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Название" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
          <input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Локация" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
          <input value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Описание (необязательно)" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
        </div>
        <div className="mt-3">
          <button onClick={createClub} disabled={creating || !name.trim()} className="rounded-full bg-[#00a3ff] hover:bg-[#0088cc] disabled:opacity-60 text-black font-medium px-5 py-2">Создать</button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#1b1b22] border border-[#2a2a35] text-white/80">
          <Calendar className="w-4 h-4" />
          <span>Мои кружки</span>
        </div>
        {loading && <div className="text-white/60">Загрузка...</div>}
        {!loading && clubs.length === 0 && (
          <div className="text-white/60">Кружков пока нет</div>
        )}
        {!loading && clubs.map((c) => (
          <div key={c.id} className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white space-y-2">
            <div className="text-lg font-semibold">{c.name}</div>
            {c.location && (
              <div className="text-white/70 text-sm inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</div>
            )}
            {c.description && (
              <div className="text-white/70 text-sm">{c.description}</div>
            )}
            
            <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3">
              <div className="text-sm font-medium mb-2">Менторы</div>
              <div className="flex gap-2">
                <input value={mentorEmail[c.id]||""} onChange={(e)=>setMentorEmail(prev=>({...prev,[c.id]:e.target.value}))} placeholder="email@example.com" className="flex-1 bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm" />
                <button onClick={async()=>{
                  const email=(mentorEmail[c.id]||"").trim(); if(!email) return
                  await apiFetch(`/api/clubs/${c.id}/mentors-by-email`,{ method:"POST", body: JSON.stringify({ email })})
                  setMentorEmail(prev=>({...prev,[c.id]:""}))
                  await load()
                }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Добавить</button>
              </div>
              <div className="text-white/70 text-xs mt-2 space-y-1">
                {(!(c.mentors||[]).length) && <div>Нет менторов</div>}
                {(c.mentors||[]).map(m => (
                  <div key={m.user.id}>{m.user.fullName || m.user.email}</div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {(c.classes || []).map((cl) => {
                const isOpen = expandedClassId === cl.id
                const sched = schedForm[cl.id] || { dayOfWeek: 1, startTime: "15:00", endTime: "16:00", location: cl.location || "" }
                const range = genRange[cl.id] || { from: new Date().toISOString().slice(0,10), to: new Date(Date.now()+7*86400000).toISOString().slice(0,10) }
                const classSessions = sessions[cl.id] || []
                const enrolled = (cl.enrollments || []).map(e => e.user)
                return (
                  <div key={cl.id} className="border border-[#2a2a35] rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{cl.title}</div>
                        {cl.location && <div className="text-white/60 text-xs inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{cl.location}</div>}
                        <div className="text-white/60 text-xs inline-flex items-center gap-1 mt-1"><Users className="w-3 h-3" />Участников: {(cl.enrollments||[]).length}</div>
                        <div className="text-white/60 text-xs inline-flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />Расписание: {(cl.scheduleItems||[]).length}</div>
                      </div>
                      <button onClick={()=>{
                        setExpandedClassId(isOpen ? null : cl.id)
                        if (!isOpen) {
                          void (async ()=>{
                            setLoadingSessions((p)=>({...p, [cl.id]: true}))
                            try {
                              const from = new Date().toISOString().slice(0,10)
                              const to = new Date(Date.now()+14*86400000).toISOString().slice(0,10)
                              const list = await apiFetch<any[]>(`/api/clubs/classes/${cl.id}/sessions?from=${from}&to=${to}`)
                              setSessions((prev)=>({...prev, [cl.id]: list}))
                              const draftEntries: Record<string, Record<string, { status: string; feedback?: string }>> = {}
                              for (const s of list) {
                                const key = `${cl.id}:${s.id}`
                                if (Array.isArray(s.attendances)) {
                                  const m: Record<string, { status: string; feedback?: string }> = {}
                                  for (const a of s.attendances) {
                                    if (a?.studentId && a?.status) m[a.studentId] = { status: String(a.status), feedback: a.feedback || "" }
                                  }
                                  draftEntries[key] = m
                                }
                              }
                              if (Object.keys(draftEntries).length) setAttendanceDraft(prev=>({ ...draftEntries, ...prev }))
                            } catch { setSessions((prev)=>({...prev, [cl.id]: []})) }
                            finally { setLoadingSessions((p)=>({...p, [cl.id]: false})) }
                          })()
                          void (async ()=>{
                            try {
                              const [resList, asgList] = await Promise.all([
                                apiFetch<any[]>(`/api/clubs/classes/${cl.id}/resources`),
                                apiFetch<any[]>(`/api/clubs/classes/${cl.id}/assignments`),
                              ])
                              setResources((prev)=>({ ...prev, [cl.id]: resList }))
                              setAssignments((prev)=>({ ...prev, [cl.id]: asgList }))
                            } catch {}
                          })()
                        }
                      }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">{isOpen?"Скрыть":"Управление"}</button>
                    </div>
                    {isOpen && (
                      <div className="space-y-4">
                        
                        <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3">
                          <div className="text-sm font-medium mb-2">Добавить ученика по email</div>
                          <div className="flex gap-2">
                            <input value={enrollEmail[cl.id]||""} onChange={(e)=>setEnrollEmail(prev=>({...prev,[cl.id]:e.target.value}))} placeholder="email@example.com" className="flex-1 bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm" />
                            <button onClick={async()=>{
                              const email=(enrollEmail[cl.id]||"").trim(); if(!email) return
                              try {
                                await apiFetch(`/api/clubs/classes/${cl.id}/enroll-by-email`,{ method:"POST", body: JSON.stringify({ email })})
                                toast({ title: "Ученик добавлен" })
                              } catch (e:any) {
                                toast({ title: "Ошибка", description: e?.message||"Не удалось добавить", variant: "destructive" as any })
                              }
                              setEnrollEmail(prev=>({...prev,[cl.id]:""}))
                              await load()
                            }} className="text-xs rounded-full bg-[#00a3ff] hover:bg-[#0088cc] px-3 py-2 text-black font-medium">Добавить</button>
                          </div>

                        <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3 space-y-2">
                          <div className="text-sm font-medium mb-2">Материалы</div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm items-center">
                            <input placeholder="Название" value={(resForm[cl.id]?.title)||""} onChange={(e)=>setResForm(prev=>({ ...prev, [cl.id]: { ...(prev[cl.id]||{ title:"", url:"" }), title: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <input placeholder="URL" value={(resForm[cl.id]?.url)||""} onChange={(e)=>setResForm(prev=>({ ...prev, [cl.id]: { ...(prev[cl.id]||{ title:"", url:"" }), url: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <input placeholder="Описание (опц.)" value={(resForm[cl.id]?.description)||""} onChange={(e)=>setResForm(prev=>({ ...prev, [cl.id]: { ...(prev[cl.id]||{ title:"", url:"" }), description: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <button onClick={async()=>{ const payload=resForm[cl.id]; if(!payload?.title?.trim()||!payload?.url?.trim()) return; try { await apiFetch(`/api/clubs/classes/${cl.id}/resources`,{ method: 'POST', body: JSON.stringify({ title: payload.title.trim(), url: payload.url.trim(), description: payload.description?.trim()||undefined })}); toast({ title: "Материал добавлен" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось добавить", variant: "destructive" as any }) } setResForm(prev=>{ const n={...prev}; delete n[cl.id]; return n}); const list = await apiFetch<any[]>(`/api/clubs/classes/${cl.id}/resources`); setResources(prev=>({ ...prev, [cl.id]: list })); }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Добавить</button>
                          </div>
                          <div className="space-y-1">
                            {((resources[cl.id]||[]).length===0) && <div className="text-white/60 text-sm">Нет материалов</div>}
                            {(resources[cl.id]||[]).map(r => (
                              <div key={r.id} className="flex items-center justify-between text-sm">
                                <a href={r.url} target="_blank" rel="noreferrer" className="text-[#00a3ff] hover:underline">{r.title}</a>
                                <button onClick={async()=>{ try { await apiFetch(`/api/clubs/resources/${r.id}`, { method: 'DELETE' }); toast({ title: "Материал удалён" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось удалить", variant: "destructive" as any }) } const list = await apiFetch<any[]>(`/api/clubs/classes/${cl.id}/resources`); setResources(prev=>({ ...prev, [cl.id]: list })); }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Удалить</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3 space-y-2">
                          <div className="text-sm font-medium mb-2">Домашние задания</div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm items-center">
                            <input placeholder="Название" value={(assignForm[cl.id]?.title)||""} onChange={(e)=>setAssignForm(prev=>({ ...prev, [cl.id]: { ...(prev[cl.id]||{ title:"" }), title: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <input type="date" value={(assignForm[cl.id]?.dueAt)||""} onChange={(e)=>setAssignForm(prev=>({ ...prev, [cl.id]: { ...(prev[cl.id]||{ title:"" }), dueAt: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <input placeholder="Описание (опц.)" value={(assignForm[cl.id]?.description)||""} onChange={(e)=>setAssignForm(prev=>({ ...prev, [cl.id]: { ...(prev[cl.id]||{ title:"" }), description: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <button onClick={async()=>{ const payload=assignForm[cl.id]; if(!payload?.title?.trim()) return; try { await apiFetch(`/api/clubs/classes/${cl.id}/assignments`,{ method: 'POST', body: JSON.stringify({ title: payload.title.trim(), description: payload.description?.trim()||undefined, dueAt: payload.dueAt||undefined })}); toast({ title: "Задание создано" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось создать", variant: "destructive" as any }) } setAssignForm(prev=>{ const n={...prev}; delete n[cl.id]; return n}); const list = await apiFetch<any[]>(`/api/clubs/classes/${cl.id}/assignments`); setAssignments(prev=>({ ...prev, [cl.id]: list })); }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Создать</button>
                          </div>
                          <div className="space-y-1">
                            {((assignments[cl.id]||[]).length===0) && <div className="text-white/60 text-sm">Нет заданий</div>}
                            {(assignments[cl.id]||[]).map(a => (
                              <div key={a.id} className="border border-[#2a2a35] rounded-lg p-2 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div>{a.title}{a.dueAt?` — до ${new Date(a.dueAt).toLocaleDateString()}`:""}</div>
                                  <div className="flex gap-2">
                                    <button onClick={async()=>{ 
                                      try{ 
                                        const list = await apiFetch<any[]>(`/api/clubs/assignments/${a.id}/submissions`); 
                                        setSubs(prev=>({ ...prev, [a.id]: list })); 
                                        toast({ title: "Ответы загружены", description: "Ответы студентов успешно загружены" } as any)
                                      } catch(e:any){ 
                                        toast({ title: "Ошибка", description: e?.message||"Не удалось загрузить ответы", variant: "destructive" as any }) 
                                      } 
                                    }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Проверить</button>
                                    <button onClick={async()=>{ const mine = mySub[a.id]||{}; const payload={ answerText: (mine.answerText||"").trim()||undefined, attachmentUrl: (mine.attachmentUrl||"").trim()||undefined }; try{ await apiFetch(`/api/clubs/assignments/${a.id}/submissions`, { method: 'POST', body: JSON.stringify(payload) }); toast({ title: "Ответ отправлен" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось отправить", variant: "destructive" as any }) } }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Отправить ответ</button>
                                    <button onClick={async()=>{ try{ await apiFetch(`/api/clubs/assignments/${a.id}`, { method: 'DELETE' }); toast({ title: "Задание удалено" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось удалить", variant: "destructive" as any }) } const list = await apiFetch<any[]>(`/api/clubs/classes/${cl.id}/assignments`); setAssignments(prev=>({ ...prev, [cl.id]: list })); }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Удалить</button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <textarea placeholder="Мой ответ (текст)" value={mySub[a.id]?.answerText||""} onChange={(e)=>setMySub(prev=>({ ...prev, [a.id]: { ...(prev[a.id]||{}), answerText: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2 min-h-[60px]" />
                                  <input placeholder="Ссылка на файл (опц.)" value={mySub[a.id]?.attachmentUrl||""} onChange={(e)=>setMySub(prev=>({ ...prev, [a.id]: { ...(prev[a.id]||{}), attachmentUrl: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                                </div>
                                {(subs[a.id]?.length>0) && (
                                  <div className="space-y-1">
                                    <div className="text-white/80 text-sm">Ответы учеников</div>
                                    {subs[a.id].map(s => (
                                      <div key={s.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-xs">
                                        <div className="col-span-2">{s.student.fullName || s.student.email}</div>
                                        <input type="number" min={0} max={100} value={gradeForm[s.id]?.grade ?? (s.grade ?? "")} onChange={(e)=>setGradeForm(prev=>({ ...prev, [s.id]: { ...(prev[s.id]||{}), grade: e.target.value? Number(e.target.value): undefined } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                                        <input placeholder="Фидбек" value={gradeForm[s.id]?.feedback ?? (s.feedback ?? "")} onChange={(e)=>setGradeForm(prev=>({ ...prev, [s.id]: { ...(prev[s.id]||{}), feedback: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                                        <button onClick={async()=>{ const gf=gradeForm[s.id]||{}; try{ await apiFetch(`/api/clubs/submissions/${s.id}/grade`, { method: 'PATCH', body: JSON.stringify({ grade: gf.grade, feedback: gf.feedback }) }); toast({ title: "Оценка сохранена" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось сохранить оценку", variant: "destructive" as any }) } const list = await apiFetch<any[]>(`/api/clubs/assignments/${a.id}/submissions`); setSubs(prev=>({ ...prev, [a.id]: list })); }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Оценить</button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                          
                          <div className="mt-3">
                            <div className="text-sm font-medium mb-2">Участники</div>
                            {(enrolled.length===0) && <div className="text-white/60 text-sm">Пока нет</div>}
                            {enrolled.map(u=> (
                              <div key={u.id} className="flex items-center justify-between text-sm py-1">
                                <div>{u.fullName || u.email}</div>
                                <button onClick={async()=>{
                                  try { await apiFetch(`/api/clubs/classes/${cl.id}/enroll/${u.id}`, { method: 'DELETE' }); toast({ title: "Удалён из класса" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось удалить", variant: "destructive" as any }) }
                                  await load()
                                }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Убрать</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        
                        <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3">
                          <div className="text-sm font-medium mb-2">Добавить слот расписания</div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            <select value={sched.dayOfWeek} onChange={(e)=>setSchedForm(prev=>({...prev,[cl.id]:{...sched, dayOfWeek:Number(e.target.value)}}))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2">
                              <option value={1}>Пн</option>
                              <option value={2}>Вт</option>
                              <option value={3}>Ср</option>
                              <option value={4}>Чт</option>
                              <option value={5}>Пт</option>
                              <option value={6}>Сб</option>
                              <option value={0}>Вс</option>
                            </select>
                            <input type="time" value={sched.startTime} onChange={(e)=>setSchedForm(prev=>({...prev,[cl.id]:{...sched, startTime:e.target.value}}))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <input type="time" value={sched.endTime} onChange={(e)=>setSchedForm(prev=>({...prev,[cl.id]:{...sched, endTime:e.target.value}}))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <input placeholder="Локация (опц.)" value={sched.location||""} onChange={(e)=>setSchedForm(prev=>({...prev,[cl.id]:{...sched, location:e.target.value}}))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                            <button onClick={async()=>{
                              try { await apiFetch(`/api/clubs/classes/${cl.id}/schedule`,{ method:"POST", body: JSON.stringify({ ...sched }) }); toast({ title: "Слот добавлен" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось добавить", variant: "destructive" as any }) }
                              await load()
                            }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Добавить</button>
                          </div>
                          <div className="text-white/60 text-xs mt-2 space-y-1">
                            <div className="text-white/80">Имеющиеся слоты:</div>
                            {(!cl.scheduleItems || cl.scheduleItems.length===0) && <div>нет</div>}
                            {(cl.scheduleItems||[]).map(si=> (
                              <div key={si.id} className="flex items-center justify-between">
                                <div>{["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][si.dayOfWeek]} {si.startTime}-{si.endTime} {si.location?`/ ${si.location}`:""}</div>
                                <button onClick={async()=>{ try{ await apiFetch(`/api/clubs/schedule/${si.id}`, { method: 'DELETE' }); toast({ title: "Слот удалён" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось удалить", variant: "destructive" as any }) } await load() }} className="text-xs rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">Удалить</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        
                        <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3">
                          <div className="text-sm font-medium mb-2">Сгенерировать занятия</div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm items-center">
                            <div className="inline-flex items-center gap-2"><span>С</span><input type="date" value={range.from} onChange={(e)=>setGenRange(prev=>({...prev,[cl.id]:{...range, from:e.target.value}}))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" /></div>
                            <div className="inline-flex items-center gap-2"><span>По</span><input type="date" value={range.to} onChange={(e)=>setGenRange(prev=>({...prev,[cl.id]:{...range, to:e.target.value}}))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" /></div>
                            <button onClick={async()=>{
                              try { await apiFetch(`/api/clubs/classes/${cl.id}/sessions/generate`,{ method:"POST", body: JSON.stringify({ from: range.from, to: range.to }) }); toast({ title: "Занятия сгенерированы" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось сгенерировать", variant: "destructive" as any }) }
                              const list = await apiFetch<any[]>(`/api/clubs/classes/${cl.id}/sessions?from=${range.from}&to=${range.to}`)
                              setSessions((prev)=>({...prev, [cl.id]: list}))
                              const draftEntries: Record<string, Record<string, { status: string; feedback?: string }>> = {}
                              for (const s of list) {
                                const key = `${cl.id}:${s.id}`
                                if (Array.isArray(s.attendances)) {
                                  const m: Record<string, { status: string; feedback?: string }> = {}
                                  for (const a of s.attendances) {
                                    if (a?.studentId && a?.status) m[a.studentId] = { status: String(a.status), feedback: a.feedback || "" }
                                  }
                                  draftEntries[key] = m
                                }
                              }
                              if (Object.keys(draftEntries).length) setAttendanceDraft(prev=>({ ...draftEntries, ...prev }))
                            }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Сгенерировать</button>
                            <div className="text-white/60 text-xs inline-flex items-center gap-1"><Clock className="w-3 h-3" />Занятий: {classSessions.length}</div>
                          </div>
                        </div>

                        
                        <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3 space-y-2">
                          <div className="text-sm font-medium">Ближайшие занятия</div>
                          {loadingSessions[cl.id] && <div className="text-white/60 text-sm">Загрузка...</div>}
                          {!loadingSessions[cl.id] && classSessions.length === 0 && <div className="text-white/60 text-sm">Нет занятий</div>}
                          {!loadingSessions[cl.id] && classSessions.map((s) => {
                            const d = new Date(s.date)
                            const key = `${cl.id}:${s.id}`
                            const draft = attendanceDraft[key] || {}
                            return (
                              <div key={s.id} className="border border-[#2a2a35] rounded-lg p-3">
                                <div className="text-white/80 text-sm mb-2">{d.toLocaleString()}</div>
                                <div className="space-y-2">
                                  {enrolled.length === 0 && <div className="text-white/60 text-sm">Нет учеников</div>}
                                  {enrolled.map((u) => {
                                    const st = draft[u.id]?.status || "present"
                                    const fb = draft[u.id]?.feedback || ""
                                    return (
                                      <div key={u.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-sm">
                                        <div className="col-span-2">{u.fullName || u.email}</div>
                                        <select value={st} onChange={(e)=>setAttendanceDraft(prev=>({ ...prev, [key]: { ...draft, [u.id]: { status: e.target.value, feedback: fb } } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2">
                                          <option value="present">Пришёл</option>
                                          <option value="absent">Не пришёл</option>
                                          <option value="late">Опоздал</option>
                                          <option value="excused">Уважительная</option>
                                        </select>
                                        <input placeholder="Фидбек (опц.)" value={fb} onChange={(e)=>setAttendanceDraft(prev=>({ ...prev, [key]: { ...draft, [u.id]: { status: st, feedback: e.target.value } } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                                        <div className="flex gap-2">
                                          <button onClick={()=>{
                                            const d = attendanceDraft[key] || {}
                                            const next = { ...d, [u.id]: { status: "present", feedback: fb } }
                                            setAttendanceDraft(prev=>({ ...prev, [key]: next }))
                                          }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 flex items-center gap-1"><Check className="w-3 h-3"/>Пришёл</button>
                                          <button onClick={()=>{
                                            const d = attendanceDraft[key] || {}
                                            const next = { ...d, [u.id]: { status: "absent", feedback: fb } }
                                            setAttendanceDraft(prev=>({ ...prev, [key]: next }))
                                          }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 flex items-center gap-1"><X className="w-3 h-3"/>Нет</button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                {enrolled.length>0 && (
                                  <div className="mt-2">
                                    <button onClick={async()=>{
                                      const d = attendanceDraft[key] || {}
                                      const marks = Object.entries(d).map(([studentId, v])=>({ studentId, status: (v as any).status, feedback: (v as any).feedback || undefined }))
                                      if (marks.length === 0) return
                                      try { await apiFetch(`/api/clubs/sessions/${s.id}/attendance`, { method: "POST", body: JSON.stringify({ marks }) }); toast({ title: "Отметки отправлены" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось отправить", variant: "destructive" as any }) }
                                      setAttendanceDraft(prev=>{ const n = { ...prev }; delete n[key]; return n })
                                    }} className="rounded-full bg-[#00a3ff] hover:bg-[#0088cc] px-4 py-2 text-black font-medium">Отправить отметки</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        
                        <div className="bg-[#140f0f] border border-[#432424] rounded-xl p-3">
                          <div className="text-sm font-medium mb-2">Опасная зона</div>
                          <button onClick={async()=>{ try{ await apiFetch(`/clubs/classes/${cl.id}`, { method: 'DELETE' }); toast({ title: "Класс удалён" }) } catch(e:any){ toast({ title: "Ошибка", description: e?.message||"Не удалось удалить", variant: "destructive" as any }) } await load() }} className="text-xs rounded-full bg-[#a33] hover:bg-[#c44] px-3 py-2 text-white">Удалить класс</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl p-3">
              <div className="text-sm font-medium mb-2">Создать класс</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm items-center">
                <input placeholder="Название" value={(newClass[c.id]?.title)||""} onChange={(e)=>setNewClass(prev=>({ ...prev, [c.id]: { ...(prev[c.id]||{ title:"" }), title: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                <input placeholder="Локация (опц.)" value={(newClass[c.id]?.location)||""} onChange={(e)=>setNewClass(prev=>({ ...prev, [c.id]: { ...(prev[c.id]||{ title:"" }), location: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                <input placeholder="Описание (опц.)" value={(newClass[c.id]?.description)||""} onChange={(e)=>setNewClass(prev=>({ ...prev, [c.id]: { ...(prev[c.id]||{ title:"" }), description: e.target.value } }))} className="bg-[#0c0c10] border border-[#2a2a35] rounded-lg px-2 py-2" />
                <button onClick={async()=>{
                  const payload = newClass[c.id]
                  if (!payload?.title?.trim()) return
                  await apiFetch(`/clubs/${c.id}/classes`, { method: "POST", body: JSON.stringify({ title: payload.title.trim(), description: payload.description?.trim() || undefined, location: payload.location?.trim() || undefined }) })
                  setNewClass(prev=>{ const n={...prev}; delete n[c.id]; return n })
                  await load()
                }} className="rounded-full bg-[#2a2a35] hover:bg-[#333344] px-3 py-2">Создать</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
