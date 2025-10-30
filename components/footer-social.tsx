export default function FooterSocial() {
  const items = [
    { href: 'https://t.me/s7robotics', label: 'Telegram', icon: 'bi-telegram' },
    { href: 'https://wa.me/77760457776', label: 'WhatsApp', icon: 'bi-whatsapp' },
    { href: 'https://www.instagram.com/s7.robotics?igsh=OGkyaW41enI0ZzQz', label: 'Instagram', icon: 'bi-instagram' },
  ]

  return (
    <div className="fixed right-6 bottom-6 z-30">
      <div className="grid grid-cols-3 gap-3 bg-transparent p-1 rounded-2xl">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            aria-label={item.label}
            className="group w-12 h-12 rounded-xl border border-[#1f1f1f] bg-[#0b0b0b] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-[#141414] hover:border-[#2a2a2a] transition"
          >
            <i className={`bi ${item.icon} text-xl opacity-80 group-hover:opacity-100`}></i>
            <span className="sr-only">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
