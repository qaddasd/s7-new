"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, User, ArrowRight, Image as ImageIcon, Video, FileText, Link as LinkIcon } from "lucide-react"
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
  }>
}

interface NewsResponse {
  data: NewsItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function NewsCard({ news }: { news: NewsItem }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
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

  return (
    <Link href={`/news/${news.id}`}>
      <div className="group bg-[#16161c] border border-[#2a2a35] rounded-2xl overflow-hidden hover:border-[#00a3ff]/50 transition-all duration-300 animate-fade-in cursor-pointer">
        {/* Cover Image */}
        {news.coverImageUrl && (
          <div className="relative h-64 overflow-hidden">
            <img 
              src={news.coverImageUrl} 
              alt={news.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16161c] to-transparent opacity-60" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(news.publishedAt || news.createdAt)}</span>
            </div>
            {news.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{news.author.fullName}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#00a3ff] transition-colors">
            {news.title}
          </h3>

          {/* Content preview */}
          <p className="text-white/70 text-sm mb-4 line-clamp-3">
            {truncateText(news.content, 200)}
          </p>

          {/* Attachments indicator */}
          {news.attachments && news.attachments.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              {news.attachments.slice(0, 3).map((att, idx) => {
                const Icon = getAttachmentIcon(att.type)
                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 bg-[#00a3ff]/10 text-[#00a3ff] text-xs rounded-full"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{att.type}</span>
                  </div>
                )
              })}
              {news.attachments.length > 3 && (
                <span className="text-white/40 text-xs">
                  +{news.attachments.length - 3} еще
                </span>
              )}
            </div>
          )}

          {/* Read more */}
          <div className="flex items-center gap-2 text-[#00a3ff] text-sm font-medium group-hover:gap-3 transition-all">
            <span>Читать далее</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadNews = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await apiFetch<NewsResponse>(`/api/news?page=${pageNum}&limit=9`)
      setNews(response.data)
      setPage(response.pagination.page)
      setTotalPages(response.pagination.totalPages)
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error?.message || "Не удалось загрузить новости", 
        variant: "destructive" as any 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

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
            <Link href="/news" className="text-[#00a3ff] font-medium text-sm">
              Новости
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page title */}
        <div className="mb-12">
          <h1 className="text-white text-4xl font-bold mb-4">Новости</h1>
          <p className="text-white/60 text-lg">
            Последние новости и обновления платформы S7
          </p>
        </div>

        {/* News grid */}
        {loading ? (
          <div className="text-white/60 text-center py-12">Загрузка...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">Новостей пока нет</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => loadNews(page - 1)}
                  disabled={page === 1}
                  className="px-6 py-3 bg-[#16161c] border border-[#2a2a35] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a35] transition-colors"
                >
                  Назад
                </button>
                <span className="text-white/60 px-6">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => loadNews(page + 1)}
                  disabled={page === totalPages}
                  className="px-6 py-3 bg-[#16161c] border border-[#2a2a35] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a35] transition-colors"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}
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
