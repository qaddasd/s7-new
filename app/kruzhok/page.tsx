"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import CreateKruzhok from "@/components/kruzhok/create-kruzhok"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, BookOpen } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

// --- Types (Simplified for client-side use) ---
interface Kruzhok {
  id: string
  name: string
  description: string
  accessCode?: string
  isPaid: boolean
  admin?: { fullName: string }
  _count?: { members: number }
}

interface KruzhokRequest {
  id: string
  kruzhokId: string
}

interface UserData {
  myKruzhoks: Kruzhok[]
  allKruzhoks: Kruzhok[]
  myRequests: KruzhokRequest[]
  canCreateKruzhok: boolean // New field to check subscription
}

// --- Components ---

const MyKruzhoksTab = ({ myKruzhoks }: { myKruzhoks: Kruzhok[] }) => (
  <div className="space-y-4">
    {myKruzhoks.length === 0 ? (
      <div className="text-white/60 p-4 border border-[#636370]/20 rounded-xl text-center">
        Сіз әлі ешқандай кружокқа қатыспайсыз.
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myKruzhoks.map((k) => (
          <Link href={`/kruzhok/${k.id}`} key={k.id}>
            <div className="bg-[#16161c] border border-[#00a3ff]/20 rounded-2xl p-4 hover:border-[#00a3ff] transition cursor-pointer h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold flex-shrink-0">
                  {k.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate">{k.name}</h3>
                  <p className="text-white/60 text-xs truncate">{k.admin?.fullName || "Админ жоқ"}</p>
                </div>
              </div>
              <p className="text-white/70 text-sm line-clamp-2 mb-3">{k.description}</p>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{k._count?.members || 0} қатысушы</span>
                <span className="text-[#22c55e] font-medium">Сіздің кружогыңыз</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
)

const AvailableKruzhoksTab = ({ allKruzhoks, myKruzhoks, myRequests, refetchData }: { allKruzhoks: Kruzhok[], myKruzhoks: Kruzhok[], myRequests: KruzhokRequest[], refetchData: () => void }) => {
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [enrollCode, setEnrollCode] = useState("")
  const [enrolling, setEnrolling] = useState(false)

  const handleEnrollByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollCode) return

    setEnrolling(true)
    try {
      // Assuming the API endpoint for enrollment is /api/kruzhok/enroll-by-code
      await apiFetch("/api/kruzhok/enroll-by-code", {
        method: "POST",
        body: JSON.stringify({ accessCode: enrollCode }),
      })
      toast({ title: "Сәтті", description: "Кружокқа қосылу сұранысы жіберілді немесе сіз қосылдыңыз." })
      setEnrollCode("")
      setShowEnrollForm(false)
      refetchData()
    } catch (error: any) {
      toast({
        title: "Қате",
        description: error.message || "Кружокқа қосылу мүмкін болмады.",
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enroll by Code Section */}
      <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Кружокқа қосылу</h2>
          <Button
            onClick={() => setShowEnrollForm(!showEnrollForm)}
            className="bg-[#00a3ff] text-black hover:bg-[#0088cc]"
          >
            {showEnrollForm ? "Жабу" : "Код енгізу"}
          </Button>
        </div>
        {showEnrollForm && (
          <form onSubmit={handleEnrollByCode} className="space-y-3">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Қолжетімділік коды</label>
              <Input
                type="text"
                placeholder="Кружок коды"
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                className="bg-[#1e1e26] border-[#636370]/20 text-white font-mono"
                disabled={enrolling}
              />
            </div>
            <Button
              type="submit"
              disabled={enrolling || !enrollCode}
              className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a] disabled:opacity-50"
            >
              {enrolling ? "Жіберілуде..." : "Сұраныс жіберу"}
            </Button>
          </form>
        )}
      </div>

      {/* Available Kruzhoks List */}
      <div>
        <h2 className="text-white text-lg font-bold mb-4">Қолжетімді кружоктар</h2>
        {allKruzhoks.length === 0 ? (
          <div className="text-white/60 p-4 border border-[#636370]/20 rounded-xl text-center">
            Қазіргі уақытта қолжетімді кружоктар жоқ.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allKruzhoks.map((k) => {
              const isEnrolled = myKruzhoks.some((m) => m.id === k.id)
              const hasPendingRequest = myRequests.some((r) => r.kruzhokId === k.id)
              return (
                <div
                  key={k.id}
                  className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 hover:border-[#00a3ff]/50 transition"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#00a3ff] text-black flex items-center justify-center font-semibold flex-shrink-0">
                      {k.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate">{k.name}</h3>
                      <p className="text-white/60 text-xs truncate">{k.admin?.fullName || "Админ жоқ"}</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2 mb-3">{k.description}</p>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                    <span>{k._count?.members || 0} қатысушы</span>
                    {k.isPaid && <span className="text-[#f59e0b]">Ақылы</span>}
                  </div>
                  {isEnrolled ? (
                    <Link href={`/kruzhok/${k.id}`}>
                      <Button className="w-full bg-[#22c55e] text-black text-xs font-medium hover:bg-[#16a34a]">
                        Кружокқа өту
                      </Button>
                    </Link>
                  ) : hasPendingRequest ? (
                    <div className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-medium px-2 py-1 rounded-full w-full text-center">
                      Сұраныс жіберілді
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // In the original code, this was used to pre-fill the code and show the form.
                        // Since the API call is now separate, we just show the form.
                        setShowEnrollForm(true)
                        setEnrollCode(k.accessCode || "")
                      }}
                      className="w-full bg-[#00a3ff] text-black text-xs font-medium px-2 py-1 rounded-full hover:bg-[#0088cc] transition"
                    >
                      Қосылу
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function KruzhokPage() {
  const { user } = useAuth()
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Assuming a new API endpoint that fetches all necessary data, including canCreateKruzhok
      const result = await apiFetch<UserData>("/api/kruzhok/all-user-data")
      setData(result)
    } catch (e: any) {
      console.error("Failed to fetch kruzhok data:", e)
      setError(e.message || "Кружок деректерін жүктеу қатесі.")
      toast({
        title: "Қате",
        description: e.message || "Кружок деректерін жүктеу мүмкін болмады.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleKruzhokCreated = () => {
    fetchData() // Refresh data after creation
  }

  const joinByCode = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      await apiFetch("/api/kruzhok/enroll-by-code", {
        method: "POST",
        body: JSON.stringify({ accessCode: joinCode.trim().toUpperCase() })
      })
      setJoinCode("")
      setShowJoin(false)
      toast({ title: "Сәтті", description: "Сұраныс жіберілді немесе сіз қосылдыңыз." })
      fetchData()
    } catch (e: any) {
      toast({ title: "Қате", description: e?.message || "Қосылу мүмкін болмады", variant: "destructive" as any })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-[#0a0a0e] text-white">
        <h1 className="text-3xl font-bold mb-6">Кружоктар</h1>
        <div className="text-white/70">Жүктелуде...</div>
      </main>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-[#0a0a0e] text-white">
        <h1 className="text-3xl font-bold mb-6">Кружоктар</h1>
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white/80">
          Раздел временно недоступен. Управление кружками выполняется администратором.
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-[#0a0a0e] text-white">
        <h1 className="text-3xl font-bold mb-6">Кружоктар</h1>
        <div className="text-red-400">{error}</div>
      </main>
    )
  }

  const myKruzhoks = data?.myKruzhoks || []
  const allKruzhoks = data?.allKruzhoks || []
  const myRequests = data?.myRequests || []
  const canCreateKruzhok = data?.canCreateKruzhok || false

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#0a0a0e] text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Кружоктар</h1>
        {/* "Создать кружок" button - only visible if user has permission */}
        {canCreateKruzhok && (
          <CreateKruzhok onKruzhokCreated={handleKruzhokCreated} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-2xl font-bold mb-2">Открыть кружок</div>
            <div className="text-white/70">Описание функции подписка</div>
          </div>
          <div className="mt-6">
            <CreateKruzhok onKruzhokCreated={handleKruzhokCreated} />
          </div>
        </div>

        {/* Joining by code hidden for now per request (admin-only management) */}
      </div>

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-fit md:grid-cols-3 bg-[#16161c] border border-[#636370]/20">
          <TabsTrigger value="my" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Менің кружоктарым
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Қолжетімді кружоктар
          </TabsTrigger>
          {/* Add a tab for creation if the user cannot create from the main button */}
          {!canCreateKruzhok && (
            <TabsTrigger value="create" className="flex items-center gap-2 text-[#00a3ff]">
              <Plus className="w-4 h-4" />
              Кружок құру
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="my">
            <MyKruzhoksTab myKruzhoks={myKruzhoks} />
          </TabsContent>
          <TabsContent value="available">
            <AvailableKruzhoksTab
              allKruzhoks={allKruzhoks}
              myKruzhoks={myKruzhoks}
              myRequests={myRequests}
              refetchData={fetchData}
            />
          </TabsContent>
          <TabsContent value="create">
            {/* If the user cannot create, show a message about subscription */}
            {!canCreateKruzhok ? (
              <div className="text-white/60 p-6 border border-[#f59e0b]/20 rounded-xl text-center space-y-4">
                <h2 className="text-xl font-bold text-[#f59e0b]">Кружок құру мүмкіндігі</h2>
                <p>Кружок құру үшін сізде арнайы подписка болуы қажет.</p>
                <Button className="bg-[#f59e0b] text-black hover:bg-[#d97706]">
                  Подписканы ресімдеу
                </Button>
              </div>
            ) : (
              <div className="text-white/60 p-6 border border-[#22c55e]/20 rounded-xl text-center">
                <p>Кружок құру батырмасы жоғарыда орналасқан.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}
