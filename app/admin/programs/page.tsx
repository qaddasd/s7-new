"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

type Program = { id: string; title: string; description?: string; isActive: boolean }
type Template = { id: string; programId: string; title: string; content?: string; orderIndex: number; presentationUrl?: string; scriptUrl?: string; quizJson?: any }

export default function AdminProgramsPage() {
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<Program[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Record<string, { title?: string; description?: string; isActive?: boolean }>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [templates, setTemplates] = useState<Record<string, Template[]>>({})
  const [tplNew, setTplNew] = useState<Record<string, { title: string; content?: string }>>({})
  const [tplEdit, setTplEdit] = useState<Record<string, Partial<Template>>>({})
  const [uploading, setUploading] = useState<Record<string, { pres?: boolean; script?: boolean }>>({})

  const load = async () => {
    setLoading(true)
    try {
      const list = await apiFetch<Program[]>("/api/programs")
      setPrograms(list)
    } catch {
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createProgram = async () => {
    if (!title.trim()) return
    try {
      setCreating(true)
      await apiFetch("/api/programs", { method: "POST", body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, isActive: true }) })
      setTitle("")
      setDescription("")
      await load()
    } finally { setCreating(false) }
  }

  const loadTemplates = async (programId: string) => {
    try {
      const list = await apiFetch<Template[]>(`/api/programs/${programId}/templates`)
      setTemplates(prev => ({ ...prev, [programId]: list }))
      setTplEdit(prev => {
        const next = { ...prev }
        for (const t of list) next[t.id] = { ...t }
        return next
      })
    } catch {
      setTemplates(prev => ({ ...prev, [programId]: [] }))
    }
  }

  const toggleExpand = async (pid: string) => {
    setExpanded(prev => ({ ...prev, [pid]: !prev[pid] }))
    if (!expanded[pid]) await loadTemplates(pid)
  }

  const createTemplate = async (pid: string) => {
    const payload = tplNew[pid]
    if (!payload?.title?.trim()) return
    await apiFetch(`/api/programs/${pid}/templates`, { method: "POST", body: JSON.stringify({ title: payload.title.trim(), content: payload.content?.trim() || undefined }) })
    setTplNew(prev => { const n = { ...prev }; delete n[pid]; return n })
    await loadTemplates(pid)
  }

  const saveTemplate = async (t: Template) => {
    const e = tplEdit[t.id] || {}
    await apiFetch(`/api/programs/templates/${t.id}`, { method: "PATCH", body: JSON.stringify({ title: (e.title||t.title)?.trim(), content: e.content ?? t.content, orderIndex: e.orderIndex ?? t.orderIndex, presentationUrl: e.presentationUrl ?? t.presentationUrl, scriptUrl: e.scriptUrl ?? t.scriptUrl, quizJson: e.quizJson ?? t.quizJson }) })
    await loadTemplates(t.programId)
  }

  const deleteTemplate = async (t: Template) => {
    if (!confirm("Удалить шаблон урока?")) return
    await apiFetch(`/api/programs/templates/${t.id}`, { method: "DELETE" })
    await loadTemplates(t.programId)
  }

  const uploadMedia = async (file: File): Promise<{ url: string } | null> => {
    const fd = new FormData()
    fd.append("file", file)
    const r = await fetch("/api/uploads/media", { method: "POST", body: fd, credentials: "include" })
    if (!r.ok) return null
    const data = await r.json()
    return { url: data.url as string }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 text-white">
      <h1 className="text-2xl font-bold">Программы</h1>

      <section className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4">
        <div className="font-semibold mb-2">Создать программу</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Название" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
          <input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Описание (опц.)" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
          <button onClick={createProgram} disabled={creating || !title.trim()} className="rounded-xl bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium px-4 py-2 disabled:opacity-60">Создать</button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-white/70">Всего: {programs.length}</div>
        {loading && <div className="text-white/60">Загрузка...</div>}
        {!loading && programs.length === 0 && (
          <div className="text-white/60">Нет программ</div>
        )}
        {!loading && programs.map(p => {
          const edit = editing[p.id] || { title: p.title, description: p.description, isActive: p.isActive }
          return (
            <div key={p.id} className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <input value={edit.title || ""} onChange={(e)=>setEditing(prev=>({ ...prev, [p.id]: { ...edit, title: e.target.value } }))} className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
                <input value={edit.description || ""} onChange={(e)=>setEditing(prev=>({ ...prev, [p.id]: { ...edit, description: e.target.value } }))} className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!edit.isActive} onChange={(e)=>setEditing(prev=>({ ...prev, [p.id]: { ...edit, isActive: e.target.checked } }))} /> Активна
                </label>
                <button onClick={async()=>{ await apiFetch(`/api/programs/${p.id}`, { method: "PATCH", body: JSON.stringify({ title: (edit.title||"").trim() || undefined, description: (edit.description||"").trim() || undefined, isActive: edit.isActive }) }); await load() }} className="rounded-xl bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 text-sm">Сохранить</button>
                <button onClick={async()=>{ if (!confirm("Удалить программу?")) return; await apiFetch(`/api/programs/${p.id}`, { method: "DELETE" }); await load() }} className="rounded-xl bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 text-sm">Удалить</button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Шаблоны уроков</div>
                  <button onClick={()=>toggleExpand(p.id)} className="text-sm rounded-xl bg-[#2a2a35] hover:bg-[#333344] px-3 py-1">{expanded[p.id]?"Скрыть":"Показать"}</button>
                </div>
                {expanded[p.id] && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input value={tplNew[p.id]?.title || ""} onChange={(e)=>setTplNew(prev=>({ ...prev, [p.id]: { ...(prev[p.id]||{ title:"" }), title: e.target.value } }))} placeholder="Название урока" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
                      <input value={tplNew[p.id]?.content || ""} onChange={(e)=>setTplNew(prev=>({ ...prev, [p.id]: { ...(prev[p.id]||{ title:"" }), content: e.target.value } }))} placeholder="Контент (опц.)" className="bg-[#0f0f14] border border-[#2a2a35] rounded-xl px-3 py-2" />
                      <button onClick={()=>createTemplate(p.id)} className="rounded-xl bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 text-sm">Добавить</button>
                    </div>

                    <div className="space-y-2">
                      {(templates[p.id]||[]).length===0 && <div className="text-white/60 text-sm">Нет шаблонов</div>}
                      {(templates[p.id]||[]).map(t => {
                        const e = tplEdit[t.id] || t
                        return (
                          <div key={t.id} className="border border-[#2a2a35] rounded-xl p-3 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm items-center">
                              <input value={e.title || ""} onChange={(ev)=>setTplEdit(prev=>({ ...prev, [t.id]: { ...e, title: ev.target.value } }))} className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2" />
                              <input type="number" value={typeof e.orderIndex==='number'?e.orderIndex: (t.orderIndex||0)} onChange={(ev)=>setTplEdit(prev=>({ ...prev, [t.id]: { ...e, orderIndex: Number(ev.target.value) } }))} className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2" />
                              <input value={e.presentationUrl || ""} onChange={(ev)=>setTplEdit(prev=>({ ...prev, [t.id]: { ...e, presentationUrl: ev.target.value } }))} placeholder="Презентация URL" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2" />
                              <input value={e.scriptUrl || ""} onChange={(ev)=>setTplEdit(prev=>({ ...prev, [t.id]: { ...e, scriptUrl: ev.target.value } }))} placeholder="Сценарий URL" className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2" />
                              <div className="flex items-center gap-2">
                                <label className="text-xs inline-flex items-center gap-2 bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2 cursor-pointer">
                                  <input type="file" className="hidden" onChange={async(ev)=>{ const f=ev.target.files?.[0]; if(!f) return; setUploading(prev=>({ ...prev, [t.id]: { ...(prev[t.id]||{}), pres: true } })); const r=await uploadMedia(f); setUploading(prev=>({ ...prev, [t.id]: { ...(prev[t.id]||{}), pres: false } })); if(r){ setTplEdit(prev=>({ ...prev, [t.id]: { ...(prev[t.id]||{}), presentationUrl: r.url } })); } }} />
                                  <span>{uploading[t.id]?.pres?"Загрузка...":"Загрузить презентацию"}</span>
                                </label>
                                <label className="text-xs inline-flex items-center gap-2 bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2 cursor-pointer">
                                  <input type="file" className="hidden" onChange={async(ev)=>{ const f=ev.target.files?.[0]; if(!f) return; setUploading(prev=>({ ...prev, [t.id]: { ...(prev[t.id]||{}), script: true } })); const r=await uploadMedia(f); setUploading(prev=>({ ...prev, [t.id]: { ...(prev[t.id]||{}), script: false } })); if(r){ setTplEdit(prev=>({ ...prev, [t.id]: { ...(prev[t.id]||{}), scriptUrl: r.url } })); } }} />
                                  <span>{uploading[t.id]?.script?"Загрузка...":"Загрузить сценарий"}</span>
                                </label>
                              </div>
                              <button onClick={()=>saveTemplate(t)} className="rounded-xl bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 text-sm">Сохранить</button>
                            </div>

                            <div>
                              <div className="text-xs text-white/60 mb-1">Квиз JSON (опционально)</div>
                              <textarea value={typeof e.quizJson==='string'? e.quizJson : (e.quizJson? JSON.stringify(e.quizJson):"")} onChange={(ev)=>setTplEdit(prev=>({ ...prev, [t.id]: { ...e, quizJson: ev.target.value } }))} className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-2 min-h-[80px] text-sm" />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button onClick={()=>deleteTemplate(t)} className="rounded-xl bg-[#2a2a35] hover:bg-[#333344] px-3 py-2 text-sm">Удалить</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}
