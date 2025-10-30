import { ArrowUpRight, Search } from "lucide-react"
import type { CourseDetails } from "@/components/tabs/course-details-tab"
import { useEffect, useRef, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export default function CoursesTab({
  onOpenCourse,
}: {
  onOpenCourse?: (course: CourseDetails) => void
}) {
  const [continueCourses, setContinueCourses] = useState<CourseDetails[]>([])
  const [recommended, setRecommended] = useState<CourseDetails[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all")
  const [loadingContinue, setLoadingContinue] = useState(true)
  const [loadingRecommended, setLoadingRecommended] = useState(true)
  const MIN_PRICE = 0
  const MAX_PRICE = 1_000_000
  const [priceRange, setPriceRange] = useState<number[]>([MIN_PRICE, MAX_PRICE])
  const [page, setPage] = useState(1)
  const pageSize = 9
  const reqIdRef = useRef(0)

  useEffect(() => {
    setLoadingContinue(true)
    apiFetch<any[]>("/courses/continue")
      .then((list) => {
        const mapped: CourseDetails[] = (list || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          difficulty: c.difficulty || "",
          author: c.author?.fullName || "",
          price: Number(c.price || 0),
          modules: (c.modules || []).map((m: any) => ({ id: m.id, title: m.title, lessons: m.lessons || [] })),
        }))
        setContinueCourses(mapped)
      })
      .catch(() => setContinueCourses([]))
      .finally(() => setLoadingContinue(false))
  }, [])

  const loadRecommended = () => {
    const currentReq = ++reqIdRef.current
    setLoadingRecommended(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (filter !== "all") params.set("filter", filter)
    if (Array.isArray(priceRange) && priceRange.length === 2) {
      params.set("minPrice", String(priceRange[0] || 0))
      params.set("maxPrice", String(priceRange[1] || 0))
    }
    apiFetch<any[]>(`/courses${params.toString() ? `?${params.toString()}` : ""}`)
      .then((list) => {
        if (currentReq !== reqIdRef.current) return
        const mapped: CourseDetails[] = (list || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          difficulty: c.difficulty || "",
          author: c.author?.fullName || "",
          price: Number(c.price || 0),
          modules: (c.modules || []).map((m: any) => ({ id: m.id, title: m.title, lessons: m.lessons || [] })),
        }))
        const [minP, maxP] = priceRange
        const filteredByPrice = mapped.filter((c) => {
          const p = Number(c.price || 0)
          return p >= (minP ?? 0) && p <= (maxP ?? Number.MAX_SAFE_INTEGER)
        })
        setRecommended(filteredByPrice)
        setPage(1)
      })
      .catch(() => { if (currentReq === reqIdRef.current) setRecommended([]) })
      .finally(() => { if (currentReq === reqIdRef.current) setLoadingRecommended(false) })
  }

  useEffect(() => {
    loadRecommended()
  }, [filter])

  useEffect(() => {
    loadRecommended()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadRecommended(), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => loadRecommended(), 200)
    return () => clearTimeout(t)
  }, [priceRange])

  return (
    <main className="flex-1 p-8 overflow-y-auto animate-slide-up">
      
      <section className="mb-12">
        <h2 className="text-white text-xl font-medium mb-6">Продолжить</h2>
        {loadingContinue ? (
          <div className="text-white/70">Загрузка...</div>
        ) : continueCourses.length === 0 ? (
          <div className="text-white/60 text-sm">Нет курсов для продолжения</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {continueCourses.map((c, i) => (
              <div
                key={c.id}
                onClick={() => onOpenCourse?.(c)}
                role="link"
                tabIndex={0}
                className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 hover:border-[#636370]/40 transition-all duration-300 cursor-pointer group hover:scale-102 animate-slide-up"
                style={{ animationDelay: `${200 + i * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white text-lg font-medium mb-2">{c.title}</h3>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-[#a0a0b0] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-[#a0a0b0] text-sm space-y-1">
                  <div>Автор: {c.author}</div>
                  <div>Уроков: {(c.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}</div>
                  <div>Стоимость: {c.price && c.price > 0 ? `${c.price.toLocaleString()}₸` : "0₸"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-medium">Рекомендованные курсы</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0b0] w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск"
              className="w-full bg-[#16161c] border border-[#636370]/20 rounded-lg pl-9 pr-3 py-2 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-[#00a3ff]"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "Все" },
            { id: "free", label: "Бесплатные" },
            { id: "paid", label: "Платные" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f.id ? "bg-[#00a3ff] text-white" : "bg-[#16161c] text-[#a0a0b0] hover:text-white hover:bg-[#636370]/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-4 mb-6 max-w-md">
          <div className="text-white text-sm font-medium mb-2">Price Range</div>
          <div className="text-white/60 text-xs mb-3">Укажите бюджет ({priceRange[0].toLocaleString()}₸ – {priceRange[1].toLocaleString()}₸)</div>
          <div className="px-1 space-y-3">
            <Slider
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={1000}
              defaultValue={priceRange}
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as number[])}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={priceRange[0]}
                min={MIN_PRICE}
                max={priceRange[1]}
                step={1000}
                onChange={(e)=>{
                  const n = Math.max(MIN_PRICE, Math.min(Number(e.target.value||0), priceRange[1]))
                  setPriceRange([n, priceRange[1]])
                }}
                className="bg-[#0f0f14] border-[#2a2a35] text-white"
              />
              <Input
                type="number"
                value={priceRange[1]}
                min={priceRange[0]}
                max={MAX_PRICE}
                step={1000}
                onChange={(e)=>{
                  const n = Math.min(MAX_PRICE, Math.max(Number(e.target.value||0), priceRange[0]))
                  setPriceRange([priceRange[0], n])
                }}
                className="bg-[#0f0f14] border-[#2a2a35] text-white"
              />
            </div>
          </div>
        </div>

        {loadingRecommended ? (
          <div className="text-white/70">Загрузка...</div>
        ) : recommended.length === 0 ? (
          <div className="text-center text-white/70 bg-[#16161c] border border-[#636370]/20 rounded-2xl p-10">Курсы не найдены</div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.slice((page-1)*pageSize, page*pageSize).map((c, i) => (
              <div
                key={c.id}
                onClick={() => onOpenCourse?.(c)}
                role="link"
                tabIndex={0}
                className="bg-[#16161c] border border-[#636370]/20 rounded-2xl p-6 hover:border-[#636370]/40 transition-all duration-300 cursor-pointer group hover:scale-102 animate-slide-up"
                style={{ animationDelay: `${200 + i * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white text-lg font-medium mb-2">{c.title}</h3>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-[#a0a0b0] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-[#a0a0b0] text-sm space-y-1">
                  <div>Автор: {c.author}</div>
                  <div>Уроков: {(c.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}</div>
                  <div>Стоимость: {c.price && c.price > 0 ? `${c.price.toLocaleString()}₸` : "0₸"}</div>
                </div>
              </div>
            ))}
          </div>
          {Math.ceil(recommended.length / pageSize) > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e)=>{e.preventDefault(); setPage((p)=>Math.max(1,p-1))}} />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(recommended.length / pageSize) }).map((_, idx) => {
                    const p = idx + 1
                    const isEdge = p === 1 || p === Math.ceil(recommended.length / pageSize)
                    const isNear = Math.abs(p - page) <= 1
                    if (!isEdge && !isNear) {
                      if (p === 2 || p === Math.ceil(recommended.length / pageSize) - 1) {
                        return (
                          <PaginationItem key={`el-${p}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    }
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink href="#" isActive={p===page} onClick={(e)=>{e.preventDefault(); setPage(p)}}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e)=>{e.preventDefault(); setPage((p)=>Math.min(Math.ceil(recommended.length/pageSize), p+1))}} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          </>
        )}
      </section>
    </main>
  )
}
