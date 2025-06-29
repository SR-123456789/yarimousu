import { type NextRequest, NextResponse } from "next/server"
import { db, comments } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: taskId } = await params

    // コメントを取得
    const commentList = await db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(comments.createdAt)

    return NextResponse.json({ comments: commentList })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "コメントの取得中にエラーが発生しました" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: taskId } = await params
    const { content, userName } = await request.json()

    // バリデーション
    if (!content) {
      return NextResponse.json({ error: "コメント内容は必須です" }, { status: 400 })
    }

    // コメントを作成
    const [comment] = await db
      .insert(comments)
      .values({
        taskId,
        userName: userName || "匿名",
        content,
      })
      .returning()

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "コメントの作成中にエラーが発生しました" }, { status: 500 })
  }
}
