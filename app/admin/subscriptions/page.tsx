"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Check, X, FileText, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"

type SubscriptionRequest = {
  id: string
  user: {
    id: string
    fullName: string
    email: string
  }
  type: string
  amount: number
  currency: string
  paymentComment: string
  requestedAt: string
  status: string
}

type CertificateRequest = {
  id: string
  user: {
    id: string
    fullName: string
    email: string
  }
  kruzhok: {
    id: string
    title: string
  }
  totalXP: number
  thresholdXP: number
  taskDescription: string
  requestedAt: string
  status: string
  certificateUrl?: string
}

export default function SubscriptionsAdminPage() {
  const confirm = useConfirm()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<SubscriptionRequest[]>([])
  const [certificates, setCertificates] = useState<CertificateRequest[]>([])
  const [activeTab, setActiveTab] = useState<"subscriptions" | "certificates">("subscriptions")
  
  // For approve modal
  const [approveModal, setApproveModal] = useState<{ open: boolean; id?: string }>({ open: false })
  const [adminNotes, setAdminNotes] = useState("")
  
  // For reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id?: string }>({ open: false })
  const [rejectReason, setRejectReason] = useState("")
  
  // For certificate issue modal
  const [issueModal, setIssueModal] = useState<{ open: boolean; id?: string }>({ open: false })
  const [certificateUrl, setCertificateUrl] = useState("")
  const [certNotes, setCertNotes] = useState("")

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === "subscriptions") {
        const data = await apiFetch<{ subscriptions: SubscriptionRequest[] }>("/api/subscriptions/admin/pending")
        setSubscriptions(data.subscriptions || [])
      } else {
        // Load pending certificates
        const data = await apiFetch<CertificateRequest[]>("/api/certificates/pending")
        setCertificates(data || [])
      }
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось загрузить данные", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveSubscription = async () => {
    if (!approveModal.id) return
    
    try {
      await apiFetch(`/api/subscriptions/admin/${approveModal.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminNotes }),
      })
      
      toast({ title: "Подписка активирована" })
      setApproveModal({ open: false })
      setAdminNotes("")
      loadData()
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось активировать подписку", 
        variant: "destructive" 
      })
    }
  }

  const handleRejectSubscription = async () => {
    if (!rejectModal.id || !rejectReason.trim()) {
      toast({ title: "Ошибка", description: "Укажите причину отклонения", variant: "destructive" })
      return
    }
    
    try {
      await apiFetch(`/api/subscriptions/admin/${rejectModal.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNotes: rejectReason }),
      })
      
      toast({ title: "Запрос отклонён" })
      setRejectModal({ open: false })
      setRejectReason("")
      loadData()
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось отклонить запрос", 
        variant: "destructive" 
      })
    }
  }

  const handleIssueCertificate = async () => {
    if (!issueModal.id || !certificateUrl.trim()) {
      toast({ title: "Ошибка", description: "Укажите URL сертификата", variant: "destructive" })
      return
    }
    
    try {
      await apiFetch(`/api/certificates/${issueModal.id}/issue`, {
        method: "POST",
        body: JSON.stringify({ certificateUrl, adminNotes: certNotes }),
      })
      
      toast({ title: "Сертификат выдан" })
      setIssueModal({ open: false })
      setCertificateUrl("")
      setCertNotes("")
      loadData()
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось выдать сертификат", 
        variant: "destructive" 
      })
    }
  }

  const handleDenyCertificate = async (id: string) => {
    const ok = await confirm({
      title: "Отклонить запрос на сертификат?",
      description: "Пользователь будет уведомлён об отклонении",
      confirmText: "Отклонить",
      cancelText: "Отмена",
      variant: "danger",
    })
    
    if (!ok) return
    
    try {
      await apiFetch(`/api/certificates/${id}/deny`, {
        method: "POST",
        body: JSON.stringify({ adminNotes: "Запрос отклонён администратором" }),
      })
      
      toast({ title: "Запрос отклонён" })
      loadData()
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось отклонить запрос", 
        variant: "destructive" 
      })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-white text-2xl md:text-3xl font-bold">Подписки и сертификаты</h1>
        <p className="text-white/60 text-sm mt-1">Управление запросами на подписки и выдачей сертификатов</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "subscriptions"
              ? "bg-[#00a3ff] text-black"
              : "bg-[#16161c] text-white/80 hover:text-white"
          }`}
        >
          Подписки
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "certificates"
              ? "bg-[#00a3ff] text-black"
              : "bg-[#16161c] text-white/80 hover:text-white"
          }`}
        >
          Сертификаты
        </button>
      </div>

      {loading ? (
        <div className="text-white/60">Загрузка...</div>
      ) : (
        <>
          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-8 text-center text-white/60">
                  Нет ожидающих запросов
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-5 text-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-lg font-semibold">{sub.user.fullName}</div>
                        <div className="text-white/60 text-sm">{sub.user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#00a3ff] font-semibold">
                          {sub.amount} {sub.currency}
                        </div>
                        <div className="text-white/60 text-xs">
                          {new Date(sub.requestedAt).toLocaleString("ru-RU")}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <div className="text-xs text-white/60 mb-1">Тип</div>
                        <div className="text-sm">
                          {sub.type === "ONETIME_PURCHASE" ? "Разовая покупка" : "Ежемесячная подписка"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-1">Комментарий к оплате</div>
                        <div className="text-sm font-mono bg-[#0f0f14] px-2 py-1 rounded">
                          {sub.paymentComment}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setApproveModal({ open: true, id: sub.id })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Одобрить
                      </button>
                      <button
                        onClick={() => setRejectModal({ open: true, id: sub.id })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                      >
                        <X className="w-4 h-4" />
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "certificates" && (
            <div className="space-y-4">
              {certificates.length === 0 ? (
                <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-8 text-center text-white/60">
                  Нет ожидающих запросов на сертификаты
                </div>
              ) : (
                certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-5 text-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-lg font-semibold">{cert.user.fullName}</div>
                        <div className="text-white/60 text-sm">{cert.user.email}</div>
                        <div className="text-white/80 text-sm mt-1">
                          Кружок: <span className="font-medium">{cert.kruzhok.title}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#00a3ff] font-semibold">
                          {cert.totalXP} / {cert.thresholdXP} XP
                        </div>
                        <div className="text-white/60 text-xs">
                          {new Date(cert.requestedAt).toLocaleString("ru-RU")}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-white/60 mb-1">Задание</div>
                      <div className="text-sm bg-[#0f0f14] px-3 py-2 rounded-lg">
                        {cert.taskDescription}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setIssueModal({ open: true, id: cert.id })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        Выдать сертификат
                      </button>
                      <button
                        onClick={() => handleDenyCertificate(cert.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                      >
                        <X className="w-4 h-4" />
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Approve Subscription Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setApproveModal({ open: false })}>
          <div className="w-full max-w-md rounded-2xl bg-[#16161c] border border-[#2a2a35] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4">Одобрить подписку</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Заметки (необязательно)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Заметки администратора..."
                  className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 text-white resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setApproveModal({ open: false })}
                  className="px-4 py-2 rounded-lg bg-[#1b1b22] border border-[#2a2a35] text-white/90"
                >
                  Отмена
                </button>
                <button
                  onClick={handleApproveSubscription}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  Одобрить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Subscription Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRejectModal({ open: false })}>
          <div className="w-full max-w-md rounded-2xl bg-[#16161c] border border-[#2a2a35] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4">Отклонить запрос</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Причина отклонения *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Укажите причину отклонения..."
                  className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 text-white resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModal({ open: false })}
                  className="px-4 py-2 rounded-lg bg-[#1b1b22] border border-[#2a2a35] text-white/90"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRejectSubscription}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {issueModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIssueModal({ open: false })}>
          <div className="w-full max-w-md rounded-2xl bg-[#16161c] border border-[#2a2a35] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4">Выдать сертификат</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">URL сертификата *</label>
                <input
                  type="url"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  placeholder="https://example.com/certificate.pdf"
                  className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Заметки (необязательно)</label>
                <textarea
                  value={certNotes}
                  onChange={(e) => setCertNotes(e.target.value)}
                  placeholder="Заметки администратора..."
                  className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIssueModal({ open: false })}
                  className="px-4 py-2 rounded-lg bg-[#1b1b22] border border-[#2a2a35] text-white/90"
                >
                  Отмена
                </button>
                <button
                  onClick={handleIssueCertificate}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  Выдать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
