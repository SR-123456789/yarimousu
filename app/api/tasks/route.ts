import { type NextRequest, NextResponse } from "next/server"
import { db, taskLists, tasks } from "@/lib/db"
import { getOrCreateAnonymousId } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { title, description, tasks: taskItems } = await request.json()

    // バリデーション
    if (!title || !taskItems || !Array.isArray(taskItems) || taskItems.length === 0) {
      return NextResponse.json({ error: "タイトルとタスクは必須です" }, { status: 400 })
    }

    // 匿名ユーザーIDを取得
    const anonymousId = getOrCreateAnonymousId()

    // タスクリストを作成
    const [taskList] = await db
      .insert(taskLists)
      .values({
        title,
        description: description || "",
      })
      .returning()

    if (!taskList) {
      throw new Error("タスクリストの作成に失敗しました")
    }

    // タスクを作成
    for (const task of taskItems) {
      if (task.title) {
        await db.insert(tasks).values({
          listId: taskList.id,
          title: task.title,
          description: task.description || "",
          status: "未着手",
          assignedTo: "",
          completed: false,
        })
      }
    }

    return NextResponse.json({ id: taskList.id })
  } catch (error) {
    console.error("Error creating task list:", error)
    return NextResponse.json({ error: "タスクリストの作成中にエラーが発生しました" }, { status: 500 })
  }
}
