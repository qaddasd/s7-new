import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0e0e12] flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center text-white animate-slide-up">
        <div className="text-[64px] leading-none font-extrabold mb-2">404</div>
        <h1 className="text-2xl font-semibold mb-2">Страница не найдена</h1>
        <p className="text-white/70 mb-6">Мы не смогли найти то, что вы искали. Возможно, страница была перемещена или удалена.</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#00a3ff] hover:bg-[#0088cc] text-black font-medium px-5 py-2 transition-colors"
          >
            На главную
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-[#16161c] border border-[#2a2a35] hover:bg-[#1b1b22] text-white px-5 py-2 transition-colors"
          >
            В кабинет
          </Link>
        </div>
      </div>
    </main>
  )
}
