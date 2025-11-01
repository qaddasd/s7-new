"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  PlayCircle,
  FileText,
  Presentation,
  GamepadIcon,
  Lock,
  CheckCircle,
  Clock,
  QrCode,
} from "lucide-react"

interface Lesson {
  id: string
  title: string
  orderIndex: number
  // New fields based on the new logic
  lessonTemplateId: string
  lessonTemplate: {
    mediaType: string
    contentUrl: string | null
    scenarioText: string | null
    quizId: string | null
  }
  // Existing fields
  progress?: {
    isCompleted: boolean
    completedAt?: string
  }
  // New fields for scheduling
  scheduledDate: string
  isAvailable: boolean
}

interface Kruzhok {
  id: string
  name: string
  description?: string
  accessCode?: string
  admin: {
    fullName: string
  }
}

export default function KruzhokLessonsPage() {
  const params = useParams()
  const router = useRouter()
  const kruzhokId = params.id as string

  const [kruzhok, setKruzhok] = useState<Kruzhok | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    fetchData()
  }, [kruzhokId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [kruzhokData, lessonsData] = await Promise.all([
        apiFetch<Kruzhok>(`/api/kruzhok/${kruzhokId}`),
        // New API endpoint to fetch scheduled lessons
        apiFetch<Lesson[]>(`/api/kruzhok/${kruzhokId}/scheduled-lessons`),
      ])
      setKruzhok(kruzhokData)
      setLessons(lessonsData || [])
      setIsMember(true) // Егер API қате қайтармаса, мүше деп есептейміз
    } catch (error: any) {
      console.error(error)
      if (error.message?.includes("Not a member")) {
        setIsMember(false)
        toast({
          title: "Қол жетімділік жоқ",
          description: "Сіз бұл кружоктың мүшесі емессіз",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Қате",
          description: "Деректерді жүктеу мүмкін болмады",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getLessonIcon = (mediaType: string) => {
    switch (mediaType) {
      case "video":
        return <PlayCircle className="w-6 h-6" />
      case "presentation":
      case "slide":
        return <Presentation className="w-6 h-6" />
      case "resource":
        return <FileText className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  const getCompletedCount = () => {
    return lessons.filter((l) => l.progress?.isCompleted).length
  }

  const getProgressPercentage = () => {
    if (lessons.length === 0) return 0
    return Math.round((getCompletedCount() / lessons.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Жүктелуде...</p>
        </div>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Қол жетімділік жоқ</h2>
            <p className="text-gray-600 mb-4">Сіз бұл кружоктың мүшесі емессіз</p>
            <Button onClick={() => router.push(`/kruzhok/${kruzhokId}`)}>Кружокка оралу</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Кружок ақпараты */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{kruzhok?.name}</CardTitle>
              {kruzhok?.description && <CardDescription className="mt-2">{kruzhok.description}</CardDescription>}
              <p className="text-sm text-gray-600 mt-2">Жетекші: {kruzhok?.admin.fullName}</p>
            </div>
            {kruzhok?.accessCode && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Қол жетімділік коды:</p>
                <div className="flex items-center gap-2">
                  <Badge className="text-lg py-2 px-4 font-mono">{kruzhok.accessCode}</Badge>
                  <QrCode className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Прогресс</span>
              <span className="font-semibold">
                {getCompletedCount()} / {lessons.length} сабақ
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-gray-600 text-right">{getProgressPercentage()}% аяқталды</p>
          </div>
        </CardContent>
      </Card>

      {/* Сабақтар тізімі */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Сабақтар</h2>

        {lessons.map((lesson, index) => {
	          const isLocked = !lesson.isAvailable
          const isCompleted = lesson.progress?.isCompleted

          return (
            <Card
              key={lesson.id}
              className={`transition-all hover:shadow-md ${isLocked ? "opacity-60" : "cursor-pointer"}`}
              onClick={() => !isLocked && router.push(`/kruzhok/${kruzhokId}/lessons/${lesson.id}`)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-100 text-green-600"
	                          : isLocked
	                          ? "bg-gray-100 text-gray-400"
	                          : "bg-blue-100 text-blue-600"
	                      }`}
	                    >
	                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : isLocked ? <Lock className="w-6 h-6" /> : getLessonIcon(lesson.lessonTemplate.mediaType)}
	                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
	                          <span className="text-sm font-semibold text-gray-500">Сабақ {lesson.orderIndex}</span>
                          {isCompleted && <Badge className="bg-green-500">Аяқталды</Badge>}
                        </div>
                        <CardTitle className="mt-1">{lesson.title}</CardTitle>
                        {lesson.description && (
	                          <CardDescription className="mt-2">{lesson.lessonTemplate.scenarioText?.substring(0, 100)}...</CardDescription>
                        )}
                      </div>

	                      <div className="flex flex-col items-end gap-2">
	                        <Badge variant="outline">{lesson.lessonTemplate.mediaType}</Badge>
	                        {lesson.lessonTemplate.quizId && (
	                          <Badge className="bg-purple-500 text-xs">Квиз</Badge>
	                        )}
	                        <span className="text-xs text-gray-500">
	                          {new Date(lesson.scheduledDate).toLocaleDateString("kk-KZ")}
	                        </span>
	                      </div>
                    </div>

                    {isCompleted && lesson.progress?.completedAt && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Аяқталды: {new Date(lesson.progress.completedAt).toLocaleDateString("kk-KZ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}

        {lessons.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Әзірге сабақтар жоқ</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
