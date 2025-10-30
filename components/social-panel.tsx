export default function SocialPanel() {
  const items = [
    { href: 'https://t.me/s7robotics', label: 'Telegram', icon: 'bi-telegram' },
    { href: 'https://wa.me/77760457776', label: 'WhatsApp', icon: 'bi-whatsapp' },
    { href: 'https://www.instagram.com/s7.robotics?igsh=OGkyaW41enI0ZzQz', label: 'Instagram', icon: 'bi-instagram' },
  ]

  return (
    <div className="flex space-x-6 mt-16 animate-slide-up" style={{ animationDelay: "1200ms" }}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.href.startsWith('http') ? '_blank' : undefined}
          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          aria-label={item.label}
          className="group w-12 h-12 rounded-full bg-[#16161c] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-[#1f1f25] transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        >
          <i className={`bi ${item.icon} text-xl opacity-80 group-hover:opacity-100 group-hover:text-[#00a3ff] transition-colors`}></i>
          <span className="sr-only">{item.label}</span>
        </a>
      ))}
    </div>
  )
}
