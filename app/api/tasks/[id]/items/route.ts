import { type NextRequest, NextResponse } from "next/server"
import { db, tasks } from "@/lib/db"
import { ensureTaskPriority } from "@/lib/utils"
import { eq, max } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: listId } = await params
    const { title, description, priority } = await request.json()

    // バリデーション
    if (!title) {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
    }

    // 現在のタスクの最大position値を取得
    const maxPositionResult = await db
      .select({ maxPosition: max(tasks.position) })
      .from(tasks)
      .where(eq(tasks.listId, listId))
    
    const nextPosition = (maxPositionResult[0]?.maxPosition ?? -1) + 1

    // タスクを作成
    try {
      const [task] = await db
        .insert(tasks)
        .values({
          listId,
          title,
          description: description || "",
          status: "未着手",
          assignedTo: "",
          completed: false,
          priority: priority ?? 1,
          position: nextPosition,
        })
        .returning()

      // priorityカラムが存在しない場合のフォールバック処理
      const taskWithPriority = ensureTaskPriority(task)

      return NextResponse.json({ task: taskWithPriority })
    } catch (dbError) {
      // priorityカラムが存在しない場合のフォールバック
      console.warn("Database insert failed, possibly missing priority column:", dbError)
      
      // priorityカラムなしでタスクを作成
      const [task] = await db
        .insert(tasks)
        .values({
          listId,
          title,
          description: description || "",
          status: "未着手",
          assignedTo: "",
          completed: false,
          position: nextPosition,
        })
        .returning()

      // priority: 1をデフォルトとして追加
      const taskWithPriority = {
        ...task,
        priority: 1,
        position: nextPosition
      }

      return NextResponse.json({ task: taskWithPriority })
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "タスクの作成中にエラーが発生しました" }, { status: 500 })
  }
}
