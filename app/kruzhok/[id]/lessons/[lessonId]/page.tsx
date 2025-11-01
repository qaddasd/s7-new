"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuizPlayer } from "@/components/kruzhok/quiz-player"
import { MatchingGame } from "@/components/kruzhok/matching-game"
import {
  ArrowLeft,
  FileText,
  Video,
  Presentation,
  GamepadIcon,
  CheckCircle,
  QrCode,
} from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Lesson {
  id: string
  title: string
  description?: string
  type: string
  content?: string
  videoUrl?: string
  presentationUrl?: string
  showAccessCode: boolean
  kruzhok: {
    id: string
    name: string
    accessCode?: string
  }
  quizzes: Array<{
    id: string
    title: string
    description?: string
    timeLimit?: number
    showAnswersImmediately: boolean
    randomizeQuestions: boolean
    randomizeOptions: boolean
    pointsPerQuestion: number
    timeBonus: boolean
    questions: Array<{
      id: string
      questionText: string
      type: string
      options: any[]
      imageUrl?: string
      explanation?: string
      points: number
      timeLimit?: number
      orderIndex: number
    }>
  }>
  matchingGames: Array<{
    id: string
    title: string
    description?: string
    difficulty: string
    timeLimit?: number
    showHints: boolean
    pointsPerMatch: number
    penaltyPerMistake: number
    pairs: any[]
  }>
}

export default function LessonViewPage() {
  const params = useParams()
  const router = useRouter()
  const kruzhokId = params.id as string
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeQuizIndex, setActiveQuizIndex] = useState<number | null>(null)
  const [activeGameIndex, setActiveGameIndex] = useState<number | null>(null)
  const [quizResults, setQuizResults] = useState<Map<string, any>>(new Map())
  const [gameResults, setGameResults] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<Lesson>(`/api/kruzhok/${kruzhokId}/lessons/${lessonId}`)
      setLesson(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Қате",
        description: "Сабақты жүктеу мүмкін болмады",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuizComplete = async (quizId: string, result: any) => {
    setQuizResults((prev) => new Map(prev).set(quizId, result))
    setActiveQuizIndex(null)

    toast({
      title: "Квиз аяқталды!",
      description: `Сіз ${result.correctAnswers}/${result.totalQuestions} дұрыс жауап бердіңіз. Ұпай: ${result.score}`,
    })

    // Прогрессті сақтау
    try {
      await apiFetch(`/api/kruzhok/${kruzhokId}/lessons/${lessonId}/complete`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Failed to save progress:", error)
    }
  }

  const handleGameComplete = async (gameId: string, result: any) => {
    setGameResults((prev) => new Map(prev).set(gameId, result))
    setActiveGameIndex(null)

    toast({
      title: "Ойын аяқталды!",
      description: `Дұрыс: ${result.correctMatches}, Қателер: ${result.mistakes}. Ұпай: ${result.score}`,
    })

    // Прогрессті сақтау
    try {
      await apiFetch(`/api/kruzhok/${kruzhokId}/lessons/${lessonId}/complete`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Failed to save progress:", error)
    }
  }

  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Google Slides
    if (url.includes("docs.google.com/presentation")) {
      return url.replace("/edit", "/embed")
    }

    return url
  }

  if (loading || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Жүктелуде...</p>
        </div>
      </div>
    )
  }

  // Квиз ойнау режимі
  if (activeQuizIndex !== null) {
    return (
      <QuizPlayer
        quiz={lesson.quizzes[activeQuizIndex]}
        onComplete={(result) => handleQuizComplete(lesson.quizzes[activeQuizIndex].id, result)}
      />
    )
  }

  // Сәйкестендіру ойыны режимі
  if (activeGameIndex !== null) {
    return (
      <MatchingGame
        game={lesson.matchingGames[activeGameIndex]}
        onComplete={(result) => handleGameComplete(lesson.matchingGames[activeGameIndex].id, result)}
      />
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Үстіңгі панель */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Сабақтарға оралу
        </Button>
        {lesson.showAccessCode && lesson.kruzhok.accessCode && (
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gray-400" />
            <Badge className="text-lg py-2 px-4 font-mono">{lesson.kruzhok.accessCode}</Badge>
          </div>
        )}
      </div>

      {/* Тақырып */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
        {lesson.description && <p className="text-gray-600 text-lg">{lesson.description}</p>}
        <div className="flex gap-2 mt-4">
          <Badge variant="outline">{lesson.type}</Badge>
          {lesson.quizzes.length > 0 && (
            <Badge className="bg-purple-500">{lesson.quizzes.length} квиз</Badge>
          )}
          {lesson.matchingGames.length > 0 && (
            <Badge className="bg-orange-500">{lesson.matchingGames.length} ойын</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Мазмұн
          </TabsTrigger>
          {lesson.quizzes.length > 0 && (
            <TabsTrigger value="quizzes">
              <GamepadIcon className="w-4 h-4 mr-2" />
              Квиздер ({lesson.quizzes.length})
            </TabsTrigger>
          )}
          {lesson.matchingGames.length > 0 && (
            <TabsTrigger value="games">
              <GamepadIcon className="w-4 h-4 mr-2" />
              Сәйкестендіру ({lesson.matchingGames.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Видео */}
          {lesson.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Видео
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(lesson.videoUrl)}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Презентация */}
          {lesson.presentationUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Presentation className="w-5 h-5" />
                  Презентация
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(lesson.presentationUrl)}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Текст */}
          {lesson.content && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Материал
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          {lesson.quizzes.map((quiz, index) => {
            const result = quizResults.get(quiz.id)

            return (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{quiz.title}</CardTitle>
                      {quiz.description && <p className="text-gray-600 mt-2">{quiz.description}</p>}
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline">{quiz.questions.length} сұрақ</Badge>
                        {quiz.timeLimit && quiz.timeLimit > 0 && (
                          <Badge variant="outline">{quiz.timeLimit}s уақыт</Badge>
                        )}
                        {result && <Badge className="bg-green-500">Аяқталды</Badge>}
                      </div>
                    </div>
                    <Button onClick={() => setActiveQuizIndex(index)}>
                      {result ? "Қайта өту" : "Бастау"}
                    </Button>
                  </div>
                </CardHeader>
                {result && (
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
                        <p className="text-sm text-gray-600">Дұрыс</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{result.score}</p>
                        <p className="text-sm text-gray-600">Ұпай</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-600">{Math.round(result.timeSpent)}s</p>
                        <p className="text-sm text-gray-600">Уақыт</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          {lesson.matchingGames.map((game, index) => {
            const result = gameResults.get(game.id)

            return (
              <Card key={game.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{game.title}</CardTitle>
                      {game.description && <p className="text-gray-600 mt-2">{game.description}</p>}
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline">{game.pairs.length} жұп</Badge>
                        <Badge
                          className={
                            game.difficulty === "EASY"
                              ? "bg-green-500"
                              : game.difficulty === "MEDIUM"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }
                        >
                          {game.difficulty === "EASY"
                            ? "Оңай"
                            : game.difficulty === "MEDIUM"
                            ? "Орташа"
                            : "Қиын"}
                        </Badge>
                        {result && <Badge className="bg-green-500">Аяқталды</Badge>}
                      </div>
                    </div>
                    <Button onClick={() => setActiveGameIndex(index)}>
                      {result ? "Қайта ойнау" : "Бастау"}
                    </Button>
                  </div>
                </CardHeader>
                {result && (
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{result.correctMatches}</p>
                        <p className="text-sm text-gray-600">Дұрыс</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{result.mistakes}</p>
                        <p className="text-sm text-gray-600">Қателер</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{result.score}</p>
                        <p className="text-sm text-gray-600">Ұпай</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
