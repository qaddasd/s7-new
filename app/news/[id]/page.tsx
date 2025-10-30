"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Image as ImageIcon, Video, FileText, Link as LinkIcon, ExternalLink } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface NewsItem {
  id: string
  title: string
  content: string
  coverImageUrl?: string
  published: boolean
  publishedAt?: string
  createdAt: string
  author?: {
    id: string
    fullName: string
    email: string
  }
  attachments?: Array<{
    id: string
    type: string
    url: string
    title?: string
    description?: string
    orderIndex: number
  }>
}

export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const newsId = params.id as string

  const [news, setNews] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true)
        const response = await apiFetch<NewsItem>(`/api/news/${newsId}`)
        setNews(response)
      } catch (error: any) {
        toast({ 
          title: "Ошибка", 
          description: error?.message || "Не удалось загрузить новость", 
          variant: "destructive" as any 
        })
        router.push("/news")
      } finally {
        setLoading(false)
      }
    }

    if (newsId) {
      loadNews()
    }
  }, [newsId, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "photo": return ImageIcon
      case "video": return Video
      case "presentation": return FileText
      case "document": return FileText
      case "link": return LinkIcon
      default: return FileText
    }
  }

  const getAttachmentColor = (type: string) => {
    switch (type) {
      case "photo": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "video": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "presentation": return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "document": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "link": return "bg-green-500/10 text-green-400 border-green-500/20"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center">
        <div className="text-white/60">Загрузка...</div>
      </div>
    )
  }

  if (!news) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0b0b10]">
      {/* Header */}
      <header className="border-b border-[#2a2a35] bg-[#0b0b10]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white text-xl font-bold hover:text-[#00a3ff] transition-colors">
            S7 Platform
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors text-sm">
              Главная
            </Link>
            <Link href="/news" className="text-white/70 hover:text-white transition-colors text-sm">
              Новости
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back button */}
        <Link 
          href="/news"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к новостям</span>
        </Link>

        {/* Article */}
        <article className="animate-fade-in">
          {/* Cover image */}
          {news.coverImageUrl && (
            <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
              <img 
                src={news.coverImageUrl} 
                alt={news.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-transparent to-transparent" />
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-6 text-sm text-white/50 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(news.publishedAt || news.createdAt)}</span>
            </div>
            {news.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{news.author.fullName}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            {news.title}
          </h1>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <div className="text-white/80 leading-relaxed whitespace-pre-wrap">
              {news.content}
            </div>
          </div>

          {/* Attachments */}
          {news.attachments && news.attachments.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-white mb-6">Вложения</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.attachments.map((att) => {
                  const Icon = getAttachmentIcon(att.type)
                  const colorClass = getAttachmentColor(att.type)
                  
                  return (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-start gap-4 p-4 border rounded-xl hover:scale-[1.02] transition-all ${colorClass}`}
                    >
                      <div className="flex-shrink-0 p-3 rounded-lg bg-white/5">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1 group-hover:underline">
                              {att.title || `${att.type.charAt(0).toUpperCase() + att.type.slice(1)}`}
                            </h3>
                            {att.description && (
                              <p className="text-sm opacity-80 mb-2">
                                {att.description}
                              </p>
                            )}
                            <p className="text-xs opacity-60 truncate">
                              {att.url}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </article>

        {/* Back to news button */}
        <div className="mt-12 pt-8 border-t border-[#2a2a35]">
          <Link 
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00a3ff] hover:bg-[#0090e0] text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться к новостям</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a35] mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-white/40 text-sm">
          © 2024 S7 Platform. Все права защищены.
        </div>
      </footer>
    </div>
  )
}
