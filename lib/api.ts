"use client"

const ACCESS_TOKEN_KEY = "s7.accessToken"
const REFRESH_TOKEN_KEY = "s7.refreshToken"

export type Tokens = { accessToken: string; refreshToken: string }

export function getTokens(): Tokens | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (accessToken && refreshToken) return { accessToken, refreshToken }
    const cookieMap = getCookieMap()
    const ca = cookieMap[ACCESS_TOKEN_KEY]
    const cr = cookieMap[REFRESH_TOKEN_KEY]
    if (ca && cr) return { accessToken: ca, refreshToken: cr }
    return null
  } catch {
    return null
  }
}

export function setTokens(t: Tokens) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, t.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, t.refreshToken)
    setCookie(ACCESS_TOKEN_KEY, t.accessToken, 30)
    setCookie(REFRESH_TOKEN_KEY, t.refreshToken, 30)
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    deleteCookie(ACCESS_TOKEN_KEY)
    deleteCookie(REFRESH_TOKEN_KEY)
  } catch {}
}

function getCookieMap(): Record<string, string> {
  try {
    return document.cookie
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean)
      .reduce((acc: Record<string, string>, pair) => {
        const idx = pair.indexOf("=")
        if (idx === -1) return acc
        const k = decodeURIComponent(pair.slice(0, idx))
        const val = decodeURIComponent(pair.slice(idx + 1))
        acc[k] = val
        return acc
      }, {})
  } catch {
    return {}
  }
}

function setCookie(name: string, value: string, days: number) {
  try {
    const d = new Date()
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = `expires=${d.toUTCString()}`
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`
  } catch {}
}

function deleteCookie(name: string) {
  try {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  } catch {}
}

async function refreshTokens(currentRefresh: string): Promise<Tokens | null> {
  try {
    let res = await fetch("/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: currentRefresh }),
    })
    if (!res.ok) {
      res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      })
      if (!res.ok) return null
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string }
    setTokens(data)
    return data
  } catch {
    return null
  }
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const tokens = getTokens()
  const headers = new Headers(init.headers || {})
  if (!headers.has("content-type") && init.body) headers.set("content-type", "application/json")
  if (tokens?.accessToken) headers.set("authorization", `Bearer ${tokens.accessToken}`)
  if (!headers.has("cache-control")) headers.set("cache-control", "no-cache")

  const doFetch = async (): Promise<Response> => fetch(path, { ...init, headers, cache: "no-store" })

  let res = await doFetch()
  if (res.status === 401 && tokens?.refreshToken) {
    const newTokens = await refreshTokens(tokens.refreshToken)
    if (newTokens) {
      headers.set("authorization", `Bearer ${newTokens.accessToken}`)
      res = await doFetch()
    }
  }
  
  // Добавляем более детальную обработку ошибок с понятными сообщениями для пользователя
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    let msg = text
    try {
      const j = JSON.parse(text)
      msg = j.error || j.message || j.reason || text
    } catch {
      // Если не JSON, используем текст ошибки
      msg = text || `HTTP ${res.status}: ${res.statusText}`
    }
    
    // Для ошибок 5xx добавляем более понятное сообщение
    if (res.status >= 500) {
      msg = "Сервер временно недоступен. Пожалуйста, попробуйте позже."
    }
    
    // Для ошибок 404 добавляем понятное сообщение
    if (res.status === 404) {
      msg = "Запрашиваемый ресурс не найден."
    }
    
    // Для ошибок 403 добавляем понятное сообщение
    if (res.status === 403) {
      msg = "У вас недостаточно прав для выполнения этого действия."
    }
    
    // Для ошибок 401 добавляем понятное сообщение
    if (res.status === 401) {
      msg = "Ваша сессия истекла. Пожалуйста, войдите в систему снова."
    }
    
    // Для ошибок 400 добавляем понятное сообщение
    if (res.status === 400) {
      msg = msg || "Некорректные данные. Проверьте введённую информацию."
    }
    
    // Для ошибок сети
    if (res.status === 0) {
      msg = "Проблемы с подключением к серверу. Проверьте ваше интернет-соединение."
    }
    
    throw new Error(msg || `Ошибка сервера (${res.status})`)
  }
  return (await res.json()) as T
}
