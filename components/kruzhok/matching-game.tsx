"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Trophy, Shuffle } from "lucide-react"

interface MatchingGameProps {
  game: {
    id: string
    title: string
    description?: string
    difficulty: string
    timeLimit?: number
    showHints: boolean
    pointsPerMatch: number
    penaltyPerMistake: number
    pairs: Array<{
      id: string
      leftItem: string
      rightItem: string
      leftType: string
      rightType: string
      orderIndex: number
    }>
  }
  onComplete: (result: {
    score: number
    correctMatches: number
    mistakes: number
    timeSpent: number
    answers: any[]
  }) => void
}

export function MatchingGame({ game, onComplete }: MatchingGameProps) {
  const [leftItems, setLeftItems] = useState<typeof game.pairs>([])
  const [rightItems, setRightItems] = useState<typeof game.pairs>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matches, setMatches] = useState<Map<string, string>>(new Map())
  const [correctMatches, setCorrectMatches] = useState<Set<string>>(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [score, setScore] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime] = useState(Date.now())
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Араластыру
    const shuffledRight = [...game.pairs].sort(() => Math.random() - 0.5)
    setLeftItems(game.pairs)
    setRightItems(shuffledRight)

    if (game.timeLimit && game.timeLimit > 0) {
      setTimeLeft(game.timeLimit)
    }
  }, [])

  useEffect(() => {
    if (timeLeft === null || isComplete) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isComplete])

  const handleLeftClick = (pairId: string) => {
    if (correctMatches.has(pairId)) return
    setSelectedLeft(pairId)

    if (selectedRight) {
      checkMatch(pairId, selectedRight)
    }
  }

  const handleRightClick = (pairId: string) => {
    if (correctMatches.has(pairId)) return
    setSelectedRight(pairId)

    if (selectedLeft) {
      checkMatch(selectedLeft, pairId)
    }
  }

  const checkMatch = (leftId: string, rightId: string) => {
    const isCorrect = leftId === rightId

    if (isCorrect) {
      setMatches((prev) => new Map(prev).set(leftId, rightId))
      setCorrectMatches((prev) => new Set(prev).add(leftId))
      setScore((prev) => prev + game.pointsPerMatch)

      // Барлығы дұрыс болса
      if (correctMatches.size + 1 === game.pairs.length) {
        setTimeout(() => handleComplete(), 500)
      }
    } else {
      setMistakes((prev) => prev + 1)
      setScore((prev) => Math.max(0, prev - game.penaltyPerMistake))
    }

    setSelectedLeft(null)
    setSelectedRight(null)
  }

  const handleComplete = () => {
    setIsComplete(true)
    const finalTimeSpent = (Date.now() - startTime) / 1000

    const answers = Array.from(matches.entries()).map(([leftId, rightId]) => ({
      leftId,
      rightId,
      isCorrect: leftId === rightId,
    }))

    onComplete({
      score,
      correctMatches: correctMatches.size,
      mistakes,
      timeSpent: finalTimeSpent,
      answers,
    })
  }

  const shuffleRight = () => {
    const unmatched = rightItems.filter((item) => !correctMatches.has(item.id))
    const matched = rightItems.filter((item) => correctMatches.has(item.id))
    const shuffled = [...unmatched].sort(() => Math.random() - 0.5)
    setRightItems([...matched, ...shuffled])
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500"
      case "MEDIUM":
        return "bg-yellow-500"
      case "HARD":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "Оңай"
      case "MEDIUM":
        return "Орташа"
      case "HARD":
        return "Қиын"
      default:
        return difficulty
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Үстіңгі панель */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{game.title}</h2>
            {game.description && <p className="text-gray-600">{game.description}</p>}
          </div>
          <div className="flex items-center gap-4">
            <Badge className={getDifficultyColor(game.difficulty)}>
              {getDifficultyText(game.difficulty)}
            </Badge>
            {timeLeft !== null && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className={`font-mono font-bold text-xl ${timeLeft <= 10 ? "text-red-500" : ""}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-xl">{score}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <span>
              Дұрыс: <span className="font-bold text-green-600">{correctMatches.size}</span> /{" "}
              {game.pairs.length}
            </span>
            <span>
              Қателер: <span className="font-bold text-red-600">{mistakes}</span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={shuffleRight}>
            <Shuffle className="w-4 h-4 mr-2" />
            Араластыру
          </Button>
        </div>
      </div>

      {/* Ойын аймағы */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Сол жақ */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-4 text-center">Сұрақтар</h3>
          {leftItems.map((pair, index) => {
            const isMatched = correctMatches.has(pair.id)
            const isSelected = selectedLeft === pair.id

            return (
              <button
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                disabled={isMatched}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isMatched
                    ? "border-green-500 bg-green-50 opacity-75"
                    : isSelected
                    ? "border-blue-500 bg-blue-50 scale-105"
                    : "border-gray-300 hover:border-blue-300 hover:scale-102"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="flex-1 font-medium">{pair.leftItem}</span>
                  {isMatched && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Оң жақ */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-4 text-center">Жауаптар</h3>
          {rightItems.map((pair) => {
            const isMatched = correctMatches.has(pair.id)
            const isSelected = selectedRight === pair.id

            return (
              <button
                key={pair.id}
                onClick={() => handleRightClick(pair.id)}
                disabled={isMatched}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isMatched
                    ? "border-green-500 bg-green-50 opacity-75"
                    : isSelected
                    ? "border-purple-500 bg-purple-50 scale-105"
                    : "border-gray-300 hover:border-purple-300 hover:scale-102"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-medium">{pair.rightItem}</span>
                  {isMatched && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Нұсқаулық */}
      {!isComplete && correctMatches.size === 0 && (
        <Card className="mt-6 border-blue-500">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              👆 Сол жақтан сұрақ таңдап, оң жақтан сәйкес жауапты таңдаңыз
            </p>
          </CardContent>
        </Card>
      )}

      {/* Аяқтау батырмасы */}
      {correctMatches.size === game.pairs.length && !isComplete && (
        <div className="mt-6 text-center">
          <Button onClick={handleComplete} size="lg" className="px-12">
            Аяқтау
          </Button>
        </div>
      )}
    </div>
  )
}
