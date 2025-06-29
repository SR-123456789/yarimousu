import { type NextRequest, NextResponse } from "next/server"
import { db, tasks } from "@/lib/db"
import { eq } from "drizzle-orm"
import { ensureTaskPriority } from "@/lib/utils"

export async function PATCH(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { title, description, status, assignedTo, completed, progressPercentage, priority } = body
    
    console.log('PATCH API called:', { itemId, body }); // デバッグログ追加

    // 更新するフィールドを準備
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (completed !== undefined) updateData.completed = completed
    if (progressPercentage !== undefined) updateData.progressPercentage = progressPercentage
    if (priority !== undefined) updateData.priority = priority
    updateData.updatedAt = new Date()

    console.log('Update data prepared:', updateData); // デバッグログ追加

    // タスクを更新
    try {
      console.log('Attempting to update task with:', updateData); // デバッグログ追加
      const [updatedTask] = await db.update(tasks).set(updateData).where(eq(tasks.id, itemId)).returning()

      if (!updatedTask) {
        console.log('Task not found:', itemId); // デバッグログ追加
        return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 })
      }

      console.log('Task updated successfully:', updatedTask); // デバッグログ追加

      // priorityカラムが存在しない場合のフォールバック処理
      const taskWithPriority = ensureTaskPriority(updatedTask)

      console.log('Task with priority fallback:', taskWithPriority); // デバッグログ追加

      return NextResponse.json({ task: taskWithPriority })
    } catch (dbError) {
      // priorityカラムが存在しない場合のフォールバック
      console.warn("Database update failed, possibly missing priority column:", dbError)
      
      // priorityフィールドを除いて更新を再試行
      const updateDataWithoutPriority = { ...updateData }
      delete updateDataWithoutPriority.priority
      
      console.log('Retrying update without priority field:', updateDataWithoutPriority); // デバッグログ追加
      
      const [updatedTask] = await db.update(tasks).set(updateDataWithoutPriority).where(eq(tasks.id, itemId)).returning()

      if (!updatedTask) {
        console.log('Task not found on retry:', itemId); // デバッグログ追加
        return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 })
      }

      console.log('Task updated successfully on retry:', updatedTask); // デバッグログ追加

      // priority: 1をデフォルトとして追加
      const taskWithPriority = {
        ...updatedTask,
        priority: 1
      }

      console.log('Task with default priority:', taskWithPriority); // デバッグログ追加

      return NextResponse.json({ task: taskWithPriority })
    }
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "タスクの更新中にエラーが発生しました" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = await params

    // タスクを削除
    await db.delete(tasks).where(eq(tasks.id, itemId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "タスクの削除中にエラーが発生しました" }, { status: 500 })
  }
}
