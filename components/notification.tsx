"use client"
import { CheckCircle, XCircle, X } from "lucide-react"
import { useEffect, useState } from "react"

interface NotificationProps {
  type: "success" | "error"
  message: string
  isVisible: boolean
  onClose: () => void
}

export default function Notification({ type, message, isVisible, onClose }: NotificationProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${
        isVisible ? "translate-y-0 opacity-100 animate-slide-in-bottom" : "translate-y-[-100px] opacity-0"
      }`}
    >
      <div
        className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
          type === "success"
            ? "bg-green-500/90 border-green-400/50 text-white shadow-green-500/20"
            : "bg-red-500/90 border-red-400/50 text-white shadow-red-500/20"
        }`}
      >
        <div className="transition-transform duration-200">
          {type === "success" ? (
            <CheckCircle className="w-5 h-5 drop-shadow-sm" />
          ) : (
            <XCircle className="w-5 h-5 drop-shadow-sm" />
          )}
        </div>
        <span className="font-medium drop-shadow-sm">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
