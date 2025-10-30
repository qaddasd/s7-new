"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Edit, Eye, Trash2, Plus, CheckCircle, XCircle } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm"
import { useRouter } from "next/navigation"

interface NewsItem {
  id: string
  title: string
  content: string
  coverImageUrl?: string
  published: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
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

function NewsCard({ 
  news, 
  onEdit, 
  onDelete, 
  onTogglePublish 
}: { 
  news: NewsItem
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string, published: boolean) => void
}) {
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

  return (
    <div className="bg-[#16161c] border border-[#2a2a35] rounded-2xl p-6 text-white animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{news.title}</h3>
          <p className="text-white/60 text-sm">
            {truncateText(news.content, 150)}
          </p>
        </div>
        {news.coverImageUrl && (
          <div className="ml-4 w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={news.coverImageUrl} 
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
        <span>Создано: {formatDate(news.createdAt)}</span>
        {news.author && <span>Автор: {news.author.fullName}</span>}
        {news.attachments && news.attachments.length > 0 && (
          <span>{news.attachments.length} вложений</span>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-4">
        {news.published ? (
          <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Опубликовано
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1 rounded-full">
            <XCircle className="w-3 h-3" />
            Черновик
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(news.id)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00a3ff] hover:bg-[#0090e0] text-white text-sm rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
          Редактировать
        </button>
        
        <button
          onClick={() => onTogglePublish(news.id, !news.published)}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
            news.published 
              ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' 
              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
          }`}
        >
          {news.published ? (
            <>
              <XCircle className="w-4 h-4" />
              Снять с публикации
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Опубликовать
            </>
          )}
        </button>

        <button
          onClick={() => onDelete(news.id)}
          className="ml-auto p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const confirm = useConfirm()
  const router = useRouter()

  const loadNews = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await apiFetch<NewsResponse>(`/api/news/admin/all?page=${pageNum}&limit=10`)
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

  const handleEdit = (id: string) => {
    router.push(`/admin/news/${id}`)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ 
      title: 'Удалить новость?', 
      description: 'Это действие нельзя отменить',
      confirmText: 'Удалить', 
      cancelText: 'Отмена', 
      variant: 'danger' 
    })
    if (!ok) return

    try {
      await apiFetch(`/api/news/${id}`, { method: "DELETE" })
      setNews((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Новость удалена" })
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error?.message || "Не удалось удалить новость", 
        variant: "destructive" as any 
      })
    }
  }

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      const response = await apiFetch<NewsItem>(`/api/news/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ published }),
      })
      
      setNews((prev) => prev.map((item) => 
        item.id === id ? response : item
      ))
      
      toast({ 
        title: published ? "Новость опубликована" : "Новость снята с публикации" 
      })
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error?.message || "Не удалось изменить статус", 
        variant: "destructive" as any 
      })
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-semibold">Новости</h2>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00a3ff] hover:bg-[#0090e0] text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить новость
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-white/60">Загрузка...</div>
      ) : news.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/60 mb-4">Новостей пока нет</p>
          <Link
            href="/admin/news/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00a3ff] hover:bg-[#0090e0] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Создать первую новость
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 max-w-5xl">
            {news.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => loadNews(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-[#16161c] border border-[#2a2a35] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a35] transition-colors"
              >
                Назад
              </button>
              <span className="text-white/60 px-4">
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => loadNews(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#16161c] border border-[#2a2a35] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a35] transition-colors"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
