import type { Metadata, ResolvingMetadata } from "next"
import type { ReactNode } from "react"

type Props = {
  params: { id: string } | Promise<{ id: string }>
  searchParams?: { task?: string } | Promise<{ task?: string }>
  children: ReactNode
}

// メタデータ生成
export async function generateMetadata(
  rawProps: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await rawProps.params
  const searchParams = await rawProps.searchParams || {}

  const id = params.id
  const taskId = searchParams.task

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"

  let taskListData

  try {
    const res = await fetch(`${baseUrl}/api/tasks/${id}`, {
      next: { revalidate: 60 },
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

  let selectedTask = null
  if (taskId) {
    selectedTask = tasks.find((t: any) => t.id === taskId)
  }

  const title = selectedTask
    ? `${selectedTask.title} | ${taskList.title} | やりまぅす`
    : `${taskList.title} | やりまぅす`

  const description = selectedTask
    ? `タスク: ${selectedTask.title} - ${selectedTask.status}${selectedTask.description ? ` - ${selectedTask.description.slice(0, 100)}...` : ""}`
    : taskList.description || "ログイン不要・匿名対応のタスク共有アプリ"

  const url = `${baseUrl}/tasks/${id}${taskId ? `?task=${taskId}` : ""}`

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

// Layoutコンポーネント
export default function TaskLayout({ children }: { children: ReactNode }) {
  return children
}
