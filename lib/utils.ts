import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 匿名ユーザーIDの取得または生成
export function getOrCreateAnonymousId() {
  const cookieStore = cookies()
  const anonymousId = cookieStore.get("anonymousId")

  if (anonymousId) {
    return anonymousId.value
  }

  const newAnonymousId = uuidv4()
  cookieStore.set("anonymousId", newAnonymousId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1年
    path: "/",
  })

  return newAnonymousId
}

// クライアント側で匿名ユーザーIDを取得
export async function getClientAnonymousId() {
  const cookies = document.cookie.split(";")
  const anonymousIdCookie = cookies.find((cookie) => cookie.trim().startsWith("anonymousId="))

  if (anonymousIdCookie) {
    return anonymousIdCookie.split("=")[1]
  }

  // サーバーサイドAPIを呼び出して新しいIDを生成
  const response = await fetch("/api/anonymous-id", {
    method: "POST",
  })

  if (response.ok) {
    const data = await response.json()
    return data.anonymousId
  }

  return null
}

// URLからQRコードを生成するための関数
export function generateQRCodeUrl(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
}
