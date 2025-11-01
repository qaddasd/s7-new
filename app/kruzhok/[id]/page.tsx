"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AttendanceRecord {
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  recordedAt: string
  sessionDate: string
  sessionTopic?: string
  kruzhokName: string
  kruzhokId: string
}

export default function KruzhokDetailPage() {
  const params = useParams()
  const kruzhokId = params.id as string

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  })

  useEffect(() => {
    fetchAttendance()
  }, [kruzhokId])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<AttendanceRecord[]>("/api/kruzhok/my-attendance")
      
      // Filter for this specific kruzhok
      const kruzhokAttendance = (data || []).filter((a) => a.kruzhokId === kruzhokId)
      setAttendance(kruzhokAttendance)

      // Calculate stats
      const stats = {
        total: kruzhokAttendance.length,
        present: kruzhokAttendance.filter((a) => a.status === "present").length,
        absent: kruzhokAttendance.filter((a) => a.status === "absent").length,
        late: kruzhokAttendance.filter((a) => a.status === "late").length,
        excused: kruzhokAttendance.filter((a) => a.status === "excused").length,
      }
      setStats(stats)
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные посещаемости",
        variant: "destructive" as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-[#22c55e]/20 text-[#22c55e]"
      case "absent":
        return "bg-[#ef4444]/20 text-[#ef4444]"
      case "late":
        return "bg-[#f59e0b]/20 text-[#f59e0b]"
      case "excused":
        return "bg-[#8b5cf6]/20 text-[#8b5cf6]"
      default:
        return "bg-[#636370]/20 text-[#636370]"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Присутствовал"
      case "absent":
        return "Отсутствовал"
      case "late":
        return "Опоздал"
      case "excused":
        return "Уважительная причина"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
        <div className="text-white/70">Загрузка...</div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/kruzhok">
          <Button className="bg-[#636370] text-white hover:bg-[#4a4a52]">← Назад</Button>
        </Link>
        <h1 className="text-white text-2xl font-bold">
          {attendance.length > 0 ? attendance[0].kruzhokName : "Кружок"}
        </h1>
      </div>

      {attendance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
            <div className="text-white/60 text-sm mb-1">Всего</div>
            <div className="text-white text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
            <div className="text-[#22c55e] text-sm mb-1">Присутствовал</div>
            <div className="text-white text-2xl font-bold">{stats.present}</div>
          </div>
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
            <div className="text-[#ef4444] text-sm mb-1">Отсутствовал</div>
            <div className="text-white text-2xl font-bold">{stats.absent}</div>
          </div>
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
            <div className="text-[#f59e0b] text-sm mb-1">Опоздал</div>
            <div className="text-white text-2xl font-bold">{stats.late}</div>
          </div>
          <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
            <div className="text-[#8b5cf6] text-sm mb-1">Уважит. причина</div>
            <div className="text-white text-2xl font-bold">{stats.excused}</div>
          </div>
        </div>
      )}

      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
        <h2 className="text-white font-bold text-lg mb-4">История посещаемости</h2>

        {attendance.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            Нет записей о посещаемости
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a35]">
            {attendance.map((record, index) => (
              <div key={index} className="py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {new Date(record.sessionDate).toLocaleDateString("ru-RU", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {record.sessionTopic && (
                    <div className="text-white/60 text-sm">Тема: {record.sessionTopic}</div>
                  )}
                  {record.notes && (
                    <div className="text-white/60 text-sm">Примечание: {record.notes}</div>
                  )}
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(
                    record.status
                  )}`}
                >
                  {getStatusLabel(record.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
