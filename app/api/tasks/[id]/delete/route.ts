import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // まずタスクリストが存在するかチェック
    const taskList = await db.query(
      "SELECT id FROM task_lists WHERE id = ?",
      [id]
    );

    if (taskList.length === 0) {
      return NextResponse.json(
        { error: "タスクリストが見つかりません" },
        { status: 404 }
      );
    }

    // 関連するタスクのコメントを削除
    await db.query(
      "DELETE FROM task_comments WHERE task_id IN (SELECT id FROM tasks WHERE list_id = ?)",
      [id]
    );

    // 関連するタスクを削除
    await db.query("DELETE FROM tasks WHERE list_id = ?", [id]);

    // タスクリストを削除
    await db.query("DELETE FROM task_lists WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task list:", error);
    return NextResponse.json(
      { error: "タスクリストの削除に失敗しました" },
      { status: 500 }
    );
  }
}
