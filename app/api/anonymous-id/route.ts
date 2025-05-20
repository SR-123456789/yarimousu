import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    let anonymousId = cookieStore.get("anonymousId")?.value

    if (!anonymousId) {
      anonymousId = uuidv4()
      cookieStore.set("anonymousId", anonymousId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365, // 1年
        path: "/",
      })
    }

    return NextResponse.json({ anonymousId })
  } catch (error) {
    console.error("Error generating anonymous ID:", error)
    return NextResponse.json({ error: "匿名IDの生成中にエラーが発生しました" }, { status: 500 })
  }
}
