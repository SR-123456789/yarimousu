import type { Metadata, ResolvingMetadata } from "next"
import type { ReactNode } from "react"

type Props = {
  params: { id: string }
  searchParams: { task?: string }
  children: ReactNode
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const id = params.id
  const taskId = searchParams.task

  // タスクリストの情報を取得
  let taskListData
  try {
    const res = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/tasks/${id}`, {
      next: { revalidate: 60 }, // 60秒間キャッシュ
    })

    if (!res.ok) {
      throw new Error("Failed to fetch task list")
    }

    taskListData = await res.json()
  } catch (error) {
    console.error("Error fetching metadata:", error)
    return {
      title: "やりまぅす - タスク共有アプリ",
      description: "ログイン不要・匿名対応のタスク共有アプリ",
    }
  }

  const { taskList, tasks } = taskListData

  // 特定のタスクが指定されている場合
  let selectedTask = null
  if (taskId) {
    selectedTask = tasks.find((t: any) => t.id === taskId)
  }

  // メタデータを構築
  const title = selectedTask
    ? `${selectedTask.title} | ${taskList.title} | やりまぅす`
    : `${taskList.title} | やりまぅす`

  const description = selectedTask
    ? `タスク: ${selectedTask.title} - ${selectedTask.status}${selectedTask.description ? ` - ${selectedTask.description.substring(0, 100)}...` : ""}`
    : taskList.description || "ログイン不要・匿名対応のタスク共有アプリ"

  const url = `${process.env.VERCEL_URL || "http://localhost:3000"}/tasks/${id}${taskId ? `?task=${taskId}` : ""}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "やりまぅす",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default function TaskLayout({ children }: { children: ReactNode }) {
  return children
}
