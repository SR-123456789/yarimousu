import { type NextRequest, NextResponse } from "next/server"
import { db, taskLists, tasks } from "@/lib/db"
import { eq } from "drizzle-orm"

// リトライ用のヘルパー関数
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error

    // エラーメッセージをログに出力
    console.log(
      `Retrying operation after error: ${error instanceof Error ? error.message : String(error)}. Retries left: ${retries}`,
    )

    // 指定された時間だけ待機
    await new Promise((resolve) => setTimeout(resolve, delay))

    // 再帰的に関数を呼び出し、リトライ回数を減らす
    return withRetry(fn, retries - 1, delay * 1.5)
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // リトライロジックを使用してデータベースクエリを実行
    const result = await withRetry(async () => {
      // タスクリストを取得
      const [taskList] = await db.select().from(taskLists).where(eq(taskLists.id, id)).limit(1)

      if (!taskList) {
        throw new Error("タスクリストが見つかりません")
      }

      // タスクを取得
      const taskItems = await db.select().from(tasks).where(eq(tasks.listId, id)).orderBy(tasks.createdAt)

      return {
        taskList,
        tasks: taskItems,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching task list:", error)

    // エラーの種類に応じて適切なステータスコードを返す
    if (error instanceof Error && error.message.includes("Too Many")) {
      return NextResponse.json(
        { error: "サーバーが混雑しています。しばらく待ってから再試行してください。" },
        { status: 429 },
      )
    }

    if (error instanceof Error && error.message.includes("タスクリストが見つかりません")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: "タスクリストの取得中にエラーが発生しました" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { title, description } = await request.json()

    // リトライロジックを使用してデータベースクエリを実行
    const result = await withRetry(async () => {
      // タスクリストを更新
      const [updatedTaskList] = await db
        .update(taskLists)
        .set({
          title,
          description,
          updatedAt: new Date(),
        })
        .where(eq(taskLists.id, id))
        .returning()

      if (!updatedTaskList) {
        throw new Error("タスクリストが見つかりません")
      }

      return { taskList: updatedTaskList }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating task list:", error)

    // エラーの種類に応じて適切なステータスコードを返す
    if (error instanceof Error && error.message.includes("Too Many")) {
      return NextResponse.json(
        { error: "サーバーが混雑しています。しばらく待ってから再試行してください。" },
        { status: 429 },
      )
    }

    if (error instanceof Error && error.message.includes("タスクリストが見つかりません")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: "タスクリストの更新中にエラーが発生しました" }, { status: 500 })
  }
}
