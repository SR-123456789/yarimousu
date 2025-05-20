import { type NextRequest, NextResponse } from "next/server"
import { db, tasks } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function PATCH(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = params
    const { title, description, status, assignedTo, completed, progressPercentage } = await request.json()

    // 更新するフィールドを準備
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (completed !== undefined) updateData.completed = completed
    if (progressPercentage !== undefined) updateData.progressPercentage = progressPercentage
    updateData.updatedAt = new Date()

    // タスクを更新
    const [updatedTask] = await db.update(tasks).set(updateData).where(eq(tasks.id, itemId)).returning()

    if (!updatedTask) {
      return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 })
    }

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "タスクの更新中にエラーが発生しました" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { itemId } = params

    // タスクを削除
    await db.delete(tasks).where(eq(tasks.id, itemId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "タスクの削除中にエラーが発生しました" }, { status: 500 })
  }
}
