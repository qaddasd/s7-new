"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Image, Video, FileText, Link as LinkIcon, Save } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

type AttachmentType = "photo" | "video" | "presentation" | "document" | "link"

interface Attachment {
  type: AttachmentType
  url: string
  title?: string
  description?: string
  orderIndex: number
}

const attachmentTypes: Array<{ value: AttachmentType; label: string; icon: any }> = [
  { value: "photo", label: "Фото", icon: Image },
  { value: "video", label: "Видео", icon: Video },
  { value: "presentation", label: "Презентация", icon: FileText },
  { value: "document", label: "Документ", icon: FileText },
  { value: "link", label: "Ссылка", icon: LinkIcon },
]

export default function NewNewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [published, setPublished] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // New attachment form
  const [showAttachmentForm, setShowAttachmentForm] = useState(false)
  const [newAttachment, setNewAttachment] = useState<Attachment>({
    type: "photo",
    url: "",
    title: "",
    description: "",
    orderIndex: 0,
  })

  const handleAddAttachment = () => {
    if (!newAttachment.url) {
      toast({ title: "Ошибка", description: "URL обязателен", variant: "destructive" as any })
      return
    }

    setAttachments([...attachments, { ...newAttachment, orderIndex: attachments.length }])
    setNewAttachment({
      type: "photo",
      url: "",
      title: "",
      description: "",
      orderIndex: 0,
    })
    setShowAttachmentForm(false)
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({ title: "Ошибка", description: "Заголовок обязателен", variant: "destructive" as any })
      return
    }

    if (!content.trim()) {
      toast({ title: "Ошибка", description: "Содержание обязательно", variant: "destructive" as any })
      return
    }

    try {
      setLoading(true)
      
      await apiFetch("/api/news", {
        method: "POST",
        body: JSON.stringify({
          title,
          content,
          coverImageUrl: coverImageUrl || undefined,
          published,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      toast({ title: published ? "Новость опубликована" : "Черновик сохранен" })
      router.push("/admin/news")
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error?.message || "Не удалось создать новость", 
        variant: "destructive" as any 
      })
    } finally {
      setLoading(false)
    }
  }

  const getAttachmentIcon = (type: AttachmentType) => {
    const item = attachmentTypes.find(t => t.value === type)
    return item?.icon || FileText
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/news"
          className="p-2 rounded-lg hover:bg-[#16161c] text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-white text-2xl font-semibold">Создать новость</h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Заголовок <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-[#16161c] border border-[#2a2a35] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00a3ff] transition-colors"
            placeholder="Введите заголовок новости"
            required
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Обложка (URL изображения)
          </label>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="w-full px-4 py-3 bg-[#16161c] border border-[#2a2a35] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00a3ff] transition-colors"
            placeholder="https://example.com/image.jpg"
          />
          {coverImageUrl && (
            <div className="mt-3">
              <img 
                src={coverImageUrl} 
                alt="Preview" 
                className="w-full max-w-md h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Содержание <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-[#16161c] border border-[#2a2a35] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00a3ff] transition-colors resize-none"
            placeholder="Введите содержание новости..."
            required
          />
          <p className="text-white/40 text-xs mt-2">
            Поддерживается обычный текст. Для форматирования используйте вложения.
          </p>
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-white text-sm font-medium">
              Вложения
            </label>
            <button
              type="button"
              onClick={() => setShowAttachmentForm(!showAttachmentForm)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#16161c] hover:bg-[#2a2a35] border border-[#2a2a35] text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить вложение
            </button>
          </div>

          {/* Attachment form */}
          {showAttachmentForm && (
            <div className="bg-[#16161c] border border-[#2a2a35] rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="block text-white text-xs font-medium mb-2">Тип</label>
                <select
                  value={newAttachment.type}
                  onChange={(e) => setNewAttachment({ ...newAttachment, type: e.target.value as AttachmentType })}
                  className="w-full px-3 py-2 bg-[#0b0b10] border border-[#2a2a35] rounded-lg text-white text-sm focus:outline-none focus:border-[#00a3ff]"
                >
                  {attachmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white text-xs font-medium mb-2">URL <span className="text-red-400">*</span></label>
                <input
                  type="url"
                  value={newAttachment.url}
                  onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0b0b10] border border-[#2a2a35] rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00a3ff]"
                  placeholder="https://example.com/file.pdf"
                />
              </div>

              <div>
                <label className="block text-white text-xs font-medium mb-2">Название</label>
                <input
                  type="text"
                  value={newAttachment.title}
                  onChange={(e) => setNewAttachment({ ...newAttachment, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0b0b10] border border-[#2a2a35] rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00a3ff]"
                  placeholder="Название файла"
                />
              </div>

              <div>
                <label className="block text-white text-xs font-medium mb-2">Описание</label>
                <input
                  type="text"
                  value={newAttachment.description}
                  onChange={(e) => setNewAttachment({ ...newAttachment, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0b0b10] border border-[#2a2a35] rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00a3ff]"
                  placeholder="Краткое описание"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="flex-1 px-4 py-2 bg-[#00a3ff] hover:bg-[#0090e0] text-white text-sm rounded-lg transition-colors"
                >
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={() => setShowAttachmentForm(false)}
                  className="px-4 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] text-white text-sm rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((att, index) => {
                const Icon = getAttachmentIcon(att.type)
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#16161c] border border-[#2a2a35] rounded-lg"
                  >
                    <Icon className="w-5 h-5 text-[#00a3ff]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">
                        {att.title || att.url}
                      </div>
                      {att.description && (
                        <div className="text-white/60 text-xs truncate">
                          {att.description}
                        </div>
                      )}
                      <div className="text-white/40 text-xs truncate">
                        {att.url}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Publish toggle */}
        <div className="flex items-center gap-3 p-4 bg-[#16161c] border border-[#2a2a35] rounded-lg">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-5 h-5 rounded bg-[#0b0b10] border-[#2a2a35] text-[#00a3ff] focus:ring-[#00a3ff] focus:ring-offset-0"
          />
          <label htmlFor="published" className="text-white text-sm cursor-pointer">
            Опубликовать сразу
          </label>
        </div>

        {/* Submit buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#00a3ff] hover:bg-[#0090e0] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? "Сохранение..." : published ? "Опубликовать" : "Сохранить черновик"}
          </button>
          <Link
            href="/admin/news"
            className="px-6 py-3 bg-[#16161c] hover:bg-[#2a2a35] border border-[#2a2a35] text-white rounded-lg transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </main>
  )
}
