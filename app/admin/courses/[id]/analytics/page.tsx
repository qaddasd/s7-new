"use client"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"

interface Summary {
  totalPurchases: number
  approvedPurchases: number
  pendingPurchases: number
  enrollmentsCount: number
  activeEnrollments: number
  completedEnrollments: number
  revenue: any
}

interface QuestionAgg {
  id: string
  text: string
  totalAnswers: number
  correct: number
  wrong: number
}

interface AnswerRow {
  questionId: string
  question: string
  selectedIndex: number
  isCorrect: boolean
  createdAt: string
  user: { id: string; email: string; fullName?: string }
}

export default function CourseAnalyticsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const courseId = useMemo(() => String(params.id), [params.id])

  const [summary, setSummary] = useState<Summary | null>(null)
  const [qAgg, setQAgg] = useState<QuestionAgg[]>([])
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [questionFilter, setQuestionFilter] = useState<string>("")

  const load = () => {
    setLoading(true)
    Promise.all([
      apiFetch<Summary>(`/courses/${courseId}/analytics`).catch(() => null),
      apiFetch<QuestionAgg[]>(`/courses/${courseId}/questions/analytics`).catch(() => []),
      apiFetch<AnswerRow[]>(`/courses/${courseId}/questions/answers`).catch(() => []),
    ])
      .then(([s, qa, ans]) => {
        setSummary(s)
        setQAgg(qa || [])
        setAnswers(ans || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [courseId])

  useEffect(() => {
    if (!questionFilter) { load(); return }
    setLoading(true)
    Promise.all([
      apiFetch<Summary>(`/courses/${courseId}/analytics`).catch(() => null),
      apiFetch<QuestionAgg[]>(`/courses/${courseId}/questions/analytics`).catch(() => []),
      apiFetch<AnswerRow[]>(`/courses/${courseId}/questions/answers?questionId=${encodeURIComponent(questionFilter)}`).catch(() => []),
    ])
      .then(([s, qa, ans]) => {
        setSummary(s)
        setQAgg(qa || [])
        setAnswers(ans || [])
      })
      .finally(() => setLoading(false))
  }, [questionFilter])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-white text-xl font-medium">Аналитика курса</h2>
        <button onClick={() => router.push('/admin/courses')} className="text-white/70 hover:text-white">Назад</button>
      </div>

      {loading && <div className="text-white/60">Загрузка...</div>}

      {!loading && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
              <div className="text-white/60 text-xs">Покупок всего</div>
              <div className="text-2xl font-semibold">{summary?.totalPurchases ?? 0}</div>
            </div>
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
              <div className="text-white/60 text-xs">Подтверждено</div>
              <div className="text-2xl font-semibold text-[#22c55e]">{summary?.approvedPurchases ?? 0}</div>
            </div>
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
              <div className="text-white/60 text-xs">Доход</div>
              <div className="text-2xl font-semibold text-[#00a3ff]">{Number(summary?.revenue || 0).toLocaleString()} ₸</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
              <div className="text-white/60 text-xs">Записей</div>
              <div className="text-2xl font-semibold">{summary?.enrollmentsCount ?? 0}</div>
            </div>
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
              <div className="text-white/60 text-xs">Активных</div>
              <div className="text-2xl font-semibold">{summary?.activeEnrollments ?? 0}</div>
            </div>
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
              <div className="text-white/60 text-xs">Завершили</div>
              <div className="text-2xl font-semibold">{summary?.completedEnrollments ?? 0}</div>
            </div>
          </div>

          
          <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Вопросы</div>
              <select value={questionFilter} onChange={(e) => setQuestionFilter(e.target.value)} className="bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-1 text-sm">
                <option value="">Все</option>
                {qAgg.map((q) => (
                  <option key={q.id} value={q.id}>{q.text.slice(0, 64)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {qAgg.map((q) => (
                <div key={q.id} className="rounded-lg border border-[#2a2a35] p-3">
                  <div className="text-sm mb-1">{q.text}</div>
                  <div className="text-xs text-white/60">Ответов: {q.totalAnswers}</div>
                  <div className="text-xs text-[#22c55e]">Верно: {q.correct}</div>
                  <div className="text-xs text-[#ef4444]">Неверно: {q.wrong}</div>
                </div>
              ))}
            </div>
          </div>

          
          <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-4 text-white">
            <div className="font-medium mb-2">Ответы пользователей</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-white/60">
                  <tr>
                    <th className="text-left py-2 pr-4">Пользователь</th>
                    <th className="text-left py-2 pr-4">Вопрос</th>
                    <th className="text-left py-2 pr-4">Индекс</th>
                    <th className="text-left py-2 pr-4">Верно</th>
                    <th className="text-left py-2 pr-4">Когда</th>
                  </tr>
                </thead>
                <tbody>
                  {(answers || []).map((a, idx) => (
                    <tr key={idx} className="border-t border-[#2a2a35]">
                      <td className="py-2 pr-4">{a.user?.fullName || a.user?.email || a.user?.id}</td>
                      <td className="py-2 pr-4">{a.question.slice(0, 80)}</td>
                      <td className="py-2 pr-4">{a.selectedIndex}</td>
                      <td className="py-2 pr-4">{a.isCorrect ? 'Да' : 'Нет'}</td>
                      <td className="py-2 pr-4">{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
