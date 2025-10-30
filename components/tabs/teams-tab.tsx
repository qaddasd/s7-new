import { ArrowUpRight, Plus, MessageCircle, Phone, Mail, Users, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { toast } from "@/hooks/use-toast"
import { linkFor } from "@/lib/site-config"

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [educationalInstitution, setEducationalInstitution] = useState('')
  const [mentorName, setMentorName] = useState('')
  const positionsList = ["Капитан", "Инженер", "Программист", "Дизайнер", "Маркетолог"]
  const [positionsWanted, setPositionsWanted] = useState<Record<string, boolean>>({})
  const [customPositions, setCustomPositions] = useState('')
  const competitionOptions = ["WRO", "Robofest", "FIRST LEGO League", "FIRST Tech Challenge"]
  const [competitions, setCompetitions] = useState<Record<string, boolean>>({})
  const [customCompetitions, setCustomCompetitions] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) return

    setIsLoading(true)
    if (!user) {
      toast({ title: 'Войдите', description: 'Требуется авторизация' })
      setIsLoading(false)
      return
    }
    try {
      const selectedPositions = Object.keys(positionsWanted).filter((k) => positionsWanted[k])
      const extraPositions = customPositions.split(',').map((s) => s.trim()).filter(Boolean)
      const selectedCompetitions = [
        ...Object.keys(competitions).filter((k) => competitions[k]),
        ...customCompetitions.split(',').map((s) => s.trim()).filter(Boolean),
      ]
      await apiFetch('/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: teamName,
          description: description || undefined,
          city: city || undefined,
          phone: phone || undefined,
          educationalInstitution: educationalInstitution || undefined,
          mentorName: mentorName || undefined,
          positionsWanted: [...selectedPositions, ...extraPositions],
          competitions: selectedCompetitions,
        }),
      })
      onSuccess()
      setTeamName('')
      setDescription('')
      setCity('')
      setPhone('')
      setEducationalInstitution('')
      setMentorName('')
      setPositionsWanted({})
      setCustomPositions('')
      setCompetitions({})
      setCustomCompetitions('')
      onClose()
      toast({ title: 'Команда создана' })
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error?.message || 'Ошибка создания команды', variant: 'destructive' as any })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      <div className="w-[min(92vw,640px)] bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-white text-xl font-medium mb-4">Создать команду</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Название команды"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            required
          />
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              placeholder="Город"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Учебное заведение команды"
              value={educationalInstitution}
              onChange={(e) => setEducationalInstitution(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Имя ментора"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            />
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
            <input
              type="text"
              placeholder="Другая должность (через запятую)"
              value={customPositions}
              onChange={(e) => setCustomPositions(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            />
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
            <input
              type="text"
              placeholder="Другие (через запятую)"
              value={customCompetitions}
              onChange={(e) => setCustomCompetitions(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none"
            />
          </div>
          <div>
            <textarea
              placeholder="Описание (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none h-24 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#636370]/20 text-white py-3 rounded-lg hover:bg-[#636370]/30 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !teamName.trim()}
              className="flex-1 bg-[#00a3ff] text-white py-3 rounded-lg hover:bg-[#0088cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Создаем...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function TeamsTab() {
  const { user } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [teams, setTeams] = useState<Array<{ id: string; name: string; description?: string; membersCount: number; metadata?: any; captain?: { id: string; fullName?: string } }>>([])
  const [joinModal, setJoinModal] = useState<{ open: boolean; teamId?: string; teamName?: string }>({ open: false })
  const [tg, setTg] = useState("")
  const [wa, setWa] = useState("")
  const [manageModal, setManageModal] = useState<{ open: boolean; teamId?: string; teamName?: string }>({ open: false })
  const [manageMembers, setManageMembers] = useState<Array<{ id: string; role: string; status: string; joinedAt: string; user: { id: string; email?: string; fullName?: string; phone?: string; telegram?: string; whatsapp?: string } }>>([])
  const [manageLoading, setManageLoading] = useState(false)
  const [myMemberships, setMyMemberships] = useState<Record<string, { role: string; status: string }>>({})

  const handleTeamCreated = () => setRefreshKey(prev => prev + 1)

  useEffect(() => {
    apiFetch<Array<{ id: string; name: string; description?: string; membersCount: number; metadata?: any; captain?: { id: string; fullName?: string } }>>('/teams')
      .then(setTeams)
      .catch(() => setTeams([]))
  }, [refreshKey])

  useEffect(() => {
    if (!user) { setMyMemberships({}); return }
    apiFetch<Array<{ id: string; role: string; status: string; team: { id: string } }>>('/teams/mine')
      .then((list) => {
        const map: Record<string, { role: string; status: string }> = {}
        for (const m of (list || [])) map[m.team.id] = { role: m.role, status: m.status }
        setMyMemberships(map)
      })
      .catch(() => setMyMemberships({}))
  }, [user, refreshKey])

  const join = async (teamId: string, teamName: string) => {
    if (!user) { toast({ title: 'Войдите', description: 'Требуется авторизация' }); return }
    setJoinModal({ open: true, teamId, teamName })
    setTg("")
    setWa("")
  }

  const openManage = async (teamId: string, teamName: string) => {
    if (!user) { toast({ title: 'Войдите', description: 'Требуется авторизация' }); return }
    setManageModal({ open: true, teamId, teamName })
    setManageLoading(true)
    try {
      const list = await apiFetch<Array<{ id: string; role: string; status: string; joinedAt: string; user: { id: string; email?: string; fullName?: string; phone?: string; telegram?: string; whatsapp?: string } }>>(`/teams/${teamId}/members`)
      setManageMembers(list || [])
    } catch { setManageMembers([]) }
    finally { setManageLoading(false) }
  }

  const updateMember = async (membershipId: string, patch: Partial<{ role: string; status: string }>) => {
    if (!manageModal.teamId) return;
    
    try {
      await apiFetch(`/api/admin/teams/${manageModal.teamId}/members/${membershipId}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      })
      toast({ title: "Участник обновлен", description: "Информация об участнике успешно обновлена" } as any)
      
      // Reload members list
      try {
        const list = await apiFetch<Array<{ id: string; role: string; status: string; joinedAt: string; user: { id: string; email?: string; fullName?: string; phone?: string; telegram?: string; whatsapp?: string } }>>(`/teams/${manageModal.teamId}/members`)
        setManageMembers(list || [])
      } catch { 
        // Silent fail but log to console
        console.warn("Failed to reload members list")
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось обновить участника", variant: "destructive" as any })
    }
  }
  return (
    <main className="flex-1 p-8 overflow-y-auto animate-slide-up">
      
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-white text-xl font-medium">Команды</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium"
          >
            Создать команду
          </button>
        </div>
        {teams.length === 0 ? (
          <div className="text-white/70 bg-[#16161c] border border-[#636370]/20 rounded-2xl p-8">Пока нет команд</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {teams.map((t, idx) => (
              <div key={t.id} className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 hover:border-[#636370]/40 transition-all duration-300 group animate-slide-up" style={{ animationDelay: `${300 + idx*50}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white text-lg font-medium mb-2">{t.name}</h3>
                    <span className="inline-block bg-[#00a3ff] text-white text-xs font-medium px-3 py-1 rounded-full">Участников: {t.membersCount}</span>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-[#a0a0b0] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-[#a0a0b0] text-sm space-y-1 mb-4">
                  {t.description && <div>{t.description}</div>}
                  {t.metadata?.city && <div>Город: {t.metadata.city}</div>}
                  {t.metadata?.educationalInstitution && <div>Уч. заведение: {t.metadata.educationalInstitution}</div>}
                  {t.metadata?.phone && <div>Телефон: {t.metadata.phone}</div>}
                  {t.metadata?.mentorName && <div>Ментор: {t.metadata.mentorName}</div>}
                  {Array.isArray(t.metadata?.positionsWanted) && t.metadata.positionsWanted.length > 0 && (
                    <div>Нужные позиции: {t.metadata.positionsWanted.join(', ')}</div>
                  )}

      
      {manageModal.open && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] animate-fade-in">
          <div className="w-[min(92vw,760px)] bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-medium inline-flex items-center gap-2"><Users className="w-5 h-5"/> Участники — {manageModal.teamName}</div>
              <button onClick={()=>setManageModal({ open:false })} className="text-white/70 hover:text-white">Закрыть</button>
            </div>
            {manageLoading ? (
              <div className="text-white/70">Загрузка...</div>
            ) : manageMembers.length === 0 ? (
              <div className="text-white/60">Пока нет участников</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {manageMembers.map((m)=> (
                  <div key={m.id} className="bg-[#0e0e12] border border-[#2a2a35] rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-white font-medium">{m.user.fullName || m.user.email}</div>
                        <div className="text-xs text-white/60">{new Date(m.joinedAt).toLocaleString('ru-RU')}</div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/80">
                          {m.user.phone && (<span className="inline-flex items-center gap-1"><Phone className="w-4 h-4"/>{m.user.phone}</span>)}
                          {m.user.whatsapp && (<span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4"/>WA: {m.user.whatsapp}</span>)}
                          {m.user.telegram && (<span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4"/>TG: {m.user.telegram}</span>)}
                          {!m.user.phone && !m.user.whatsapp && !m.user.telegram && (<span className="text-white/50">контакты не указаны</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={(e)=>updateMember(m.id,{ role: e.target.value })}
                          className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-1 text-sm text-white/90"
                        >
                          {['captain','member','mentor'].map((r)=> (<option key={r} value={r}>{r}</option>))}
                        </select>
                        <select
                          value={m.status}
                          onChange={(e)=>updateMember(m.id,{ status: e.target.value })}
                          className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-1 text-sm text-white/90"
                        >
                          <option value="pending">Ожидание</option>
                          <option value="active">Активен</option>
                          <option value="rejected">Отклонён</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
                  {Array.isArray(t.metadata?.competitions) && t.metadata.competitions.length > 0 && (
                    <div>Соревнования: {t.metadata.competitions.join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {user && t.captain && t.captain.id === user.id ? (
                    <button onClick={() => openManage(t.id, t.name)} className="px-4 py-2 rounded-lg bg-[#2a2a35] hover:bg-[#333344] text-white/90 font-medium inline-flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Управлять
                    </button>
                  ) : myMemberships[t.id] ? (
                    <span className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full ${myMemberships[t.id].status === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : myMemberships[t.id].status === 'rejected' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                      {myMemberships[t.id].status === 'pending' ? 'На проверке' : myMemberships[t.id].status === 'active' ? 'Вы в команде' : 'Отклонено'}
                    </span>
                  ) : (
                    <button onClick={() => join(t.id, t.name)} className="px-4 py-2 rounded-lg bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium">Записаться</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      
      <section className="mb-12">
        <div className="border-t border-[#636370]/20 pt-8 animate-slide-up" style={{ animationDelay: "500ms" }}>
          <h3 className="text-white text-lg font-medium mb-4">Ищете напарника себе в команду? Тогда добавляй свою команду:</h3>
          <div className="flex justify-center">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-16 h-16 bg-[#00a3ff] rounded-full flex items-center justify-center hover:bg-[#0088cc] transition-colors duration-300"
            >
              <Plus className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </section>

      
      <CreateTeamModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTeamCreated}
      />

      
      {joinModal.open && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] animate-fade-in">
          <div className="w-[min(92vw,520px)] bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white shadow-xl animate-slide-up">
            <div className="text-lg font-medium mb-2">Запись в команду</div>
            {joinModal.teamName && <div className="text-white/70 text-sm mb-4">Команда: {joinModal.teamName}</div>}
            <div className="grid grid-cols-1 gap-3">
              <input value={tg} onChange={(e)=>setTg(e.target.value)} placeholder="Telegram @username" className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none" />
              <input value={wa} onChange={(e)=>setWa(e.target.value)} placeholder="WhatsApp номер" className="w-full bg-[#0e0e12] border border-[#636370]/20 rounded-lg px-4 py-3 text-white placeholder:text-[#a0a0b0] focus:border-[#00a3ff] focus:outline-none" />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={()=>setJoinModal({ open:false })} className="flex-1 bg-[#636370]/20 text-white py-3 rounded-lg hover:bg-[#636370]/30 transition-colors">Отмена</button>
              <button onClick={async()=>{
                if (!joinModal.teamId) return
                try {
                  const res = await apiFetch<{ status: string }>(`/teams/${joinModal.teamId}/join`, { method: 'POST', body: JSON.stringify({ telegram: tg.trim() || undefined, whatsapp: wa.trim() || undefined }) })
                  toast({ title: res.status === 'pending' ? 'Заявка отправлена' : 'Готово' })
                  setJoinModal({ open:false })
                } catch(e:any) {
                  toast({ title: 'Ошибка', description: e?.message || 'Не удалось отправить заявку', variant: 'destructive' as any })
                }
              }} className="flex-1 bg-[#00a3ff] text-black py-3 rounded-lg hover:bg-[#0088cc] transition-colors">Отправить</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
