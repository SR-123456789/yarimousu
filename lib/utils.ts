import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"
// import { cookies } from "next/headers"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 匿名ユーザーIDの取得または生成
export async function getOrCreateAnonymousId() {
  // const cookieStore = await cookies()
  // const anonymousId = cookieStore.get("anonymousId")

  // if (anonymousId) {
  //   return anonymousId.value
  // }

  const newAnonymousId = uuidv4()
  // cookieStore.set("anonymousId", newAnonymousId, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   maxAge: 60 * 60 * 24 * 365, // 1年
  //   path: "/",
  // })

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

// タスクにpriorityが設定されていない場合のフォールバック処理
export function ensureTaskPriority<T extends { priority?: number | null }>(task: T): T & { priority: number } {
  return {
    ...task,
    priority: task.priority ?? 1
  }
}

// タスク配列の全てにpriorityフォールバックを適用
export function ensureTasksPriority<T extends { priority?: number | null }>(tasks: T[]): (T & { priority: number })[] {
  return tasks.map(ensureTaskPriority)
}
