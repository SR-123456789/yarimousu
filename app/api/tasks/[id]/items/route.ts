import { type NextRequest, NextResponse } from "next/server"
import { db, tasks } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listId = params.id
    const { title, description } = await request.json()

    // バリデーション
    if (!title) {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
    }

    // タスクを作成
    const [task] = await db
      .insert(tasks)
      .values({
        listId,
        title,
        description: description || "",
        status: "未着手",
        assignedTo: "",
        completed: false,
      })
      .returning()

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "タスクの作成中にエラーが発生しました" }, { status: 500 })
  }
}
