import { type NextRequest, NextResponse } from "next/server"
import { db, tasks } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: listId } = await params
    const { tasks: tasksToUpdate } = await request.json()

    if (!Array.isArray(tasksToUpdate)) {
      return NextResponse.json(
        { error: "タスクの配列が必要です" },
        { status: 400 }
      )
    }

    // トランザクションでposition値を更新
    const results = []
    for (const taskUpdate of tasksToUpdate) {
      const { id, position } = taskUpdate

      if (!id || position === undefined) {
        continue
      }

      try {
        const [updatedTask] = await db
          .update(tasks)
          .set({ position })
          .where(eq(tasks.id, id))
          .returning()

        if (updatedTask) {
          results.push(updatedTask)
        }
      } catch (error) {
        console.error(`Error updating task ${id}:`, error)
        // 個別のタスクのエラーでは続行
        continue
      }
    }

    return NextResponse.json({
      message: "タスクの順序を更新しました",
      updatedTasks: results
    })
  } catch (error) {
    console.error("Error reordering tasks:", error)
    return NextResponse.json(
      { error: "タスクの並び替え中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
