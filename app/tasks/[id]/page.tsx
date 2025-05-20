/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  XIcon,
  RefreshCw,
  User,
} from "lucide-react"
import { generateQRCodeUrl } from "@/lib/utils"
import { TaskComments } from "@/components/task-comments"
import { UsernameDialog } from "@/components/username-dialog"
import { KanbanBoard } from "@/components/kanban-board"
import { useMobile } from "@/hooks/use-mobile"
import { Slider } from "@/components/ui/slider"
import { sendTaskIdToNative } from "@/lib/native-bridge"
import { Share2 } from "lucide-react"
import { TaskShareDialog } from "@/components/task-share-dialog"
import { useDebounce } from "@/hooks/use-debounce"

type TaskList = {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

type Task = {
  id: string
  listId: string
  title: string
  description: string
  status: "未着手" | "作業中" | "私がやる予定" | "完了" | "アーカイブ"
  assignedTo: string
  completed: boolean
  progressPercentage?: number
  createdAt: string
  updatedAt: string
}

// ユーザー名をlocalStorageから取得する関数
const getUserNameFromStorage = (): string => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("yarimaus_username") || ""
}

// ユーザー名をlocalStorageに保存する関数
const saveUserNameToStorage = (name: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("yarimaus_username", name)
}

// タスクリストデータをlocalStorageにキャッシュする関数
const cacheTaskListData = (id: string, data: any): void => {
  if (typeof window === "undefined") return
  const cacheKey = `taskList_${id}`
  const cacheData = {
    data,
    timestamp: Date.now(),
  }
  localStorage.setItem(cacheKey, JSON.stringify(cacheData))
}

// キャッシュからタスクリストデータを取得する関数
const getCachedTaskListData = (id: string): { data: any; timestamp: number } | null => {
  if (typeof window === "undefined") return null
  const cacheKey = `taskList_${id}`
  const cachedData = localStorage.getItem(cacheKey)
  if (!cachedData) return null

  try {
    return JSON.parse(cachedData)
  } catch (e) {
    return null
  }
}

// キャッシュの有効期限（10分）
const CACHE_EXPIRY = 10 * 60 * 1000

export default function TaskListPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const isMobile = useMobile()
  const initialRenderRef = useRef(true)
  const processedTaskIdRef = useRef<string | null>(null)
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialTaskIdRef = useRef<string | null>(searchParams.get("task"))

  const [taskList, setTaskList] = useState<TaskList | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingList, setIsEditingList] = useState(false)
  const [editListTitle, setEditListTitle] = useState("")
  const [editListDescription, setEditListDescription] = useState("")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [userName, setUserName] = useState("")
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "completed" | "comment" | "progress" | "assignee"
    taskId: string
    value: any
  } | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  // タスクの詳細表示状態を管理する状態
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})
  const [selectedTaskForShare, setSelectedTaskForShare] = useState<Task | null>(null)
  const [showTaskShareDialog, setShowTaskShareDialog] = useState(false)
  // カンバンモードで選択されているタスク
  const [selectedKanbanTask, setSelectedKanbanTask] = useState<Task | null>(null)
  // スライダーの値を管理する状態
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  // 検索・絞り込み用の状態
  const [searchQuery, setSearchQuery] = useState("")
  const [searchById, setSearchById] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const debouncedSearchById = useDebounce(searchById, 300)
  // 担当者入力用の状態
  const [taskAssignees, setTaskAssignees] = useState<Record<string, string>>({})
  const [isEditingAssignee, setIsEditingAssignee] = useState<Record<string, boolean>>({})

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const qrCodeUrl = generateQRCodeUrl(shareUrl)

  // ページロード時にlocalStorageからユーザー名を読み込む
  useEffect(() => {
    const storedUserName = getUserNameFromStorage()
    if (storedUserName) {
      setUserName(storedUserName)
    }
  }, [])

  const fetchTaskList = useCallback(
    async (useCache = true) => {
      setLoading(true)
      setError(null)

      try {
        // キャッシュをチェック
        if (useCache) {
          const cachedData = getCachedTaskListData(id)
          if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
            setTaskList(cachedData.data.taskList)
            setTasks(cachedData.data.tasks)
            setFilteredTasks(cachedData.data.tasks)
            setEditListTitle(cachedData.data.taskList.title)
            setEditListDescription(cachedData.data.taskList.description || "")

            // スライダーの初期値を設定
            const initialSliderValues: Record<string, number> = {}
            const initialAssignees: Record<string, string> = {}
            cachedData.data.tasks.forEach((task: Task) => {
              initialSliderValues[task.id] = task.progressPercentage || 0
              initialAssignees[task.id] = task.assignedTo || ""
            })
            setSliderValues(initialSliderValues)
            setTaskAssignees(initialAssignees)

            setLoading(false)
            return
          }
        }

        const response = await fetch(`/api/tasks/${id}`)

        if (!response.ok) {
          // レスポンスのステータスコードに応じたエラーメッセージ
          if (response.status === 429) {
            throw new Error("サーバーが混雑しています。しばらく待ってから再試行してください。")
          }

          const errorData = await response.json().catch(() => ({ error: "不明なエラーが発生しました" }))
          throw new Error(errorData.error || "タスクリストの取得に失敗しました")
        }

        const data = await response.json()

        // データをキャッシュに保存
        cacheTaskListData(id, data)

        setTaskList(data.taskList)
        setTasks(data.tasks)
        setFilteredTasks(data.tasks)
        setEditListTitle(data.taskList.title)
        setEditListDescription(data.taskList.description || "")

        // スライダーの初期値とタスク担当者を設定
        const initialSliderValues: Record<string, number> = {}
        const initialAssignees: Record<string, string> = {}
        data.tasks.forEach((task: Task) => {
          initialSliderValues[task.id] = task.progressPercentage || 0
          initialAssignees[task.id] = task.assignedTo || ""
        })
        setSliderValues(initialSliderValues)
        setTaskAssignees(initialAssignees)
      } catch (error) {
        console.error("Error:", error)
        setError(error instanceof Error ? error.message : "タスクリストの取得中にエラーが発生しました")
      } finally {
        setLoading(false)
        setIsRetrying(false)
      }
    },
    [id],
  )

  // 初回ロード時にデータを取得
  useEffect(() => {
    fetchTaskList()

    // クリーンアップ関数
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [fetchTaskList])

  // URLからタスクIDを取得し、検索欄に設定（初回のみ）
  useEffect(() => {
    if (initialTaskIdRef.current) {
      setSearchById(initialTaskIdRef.current)
      setViewMode("list") // リストモードに切り替え
      initialTaskIdRef.current = null // 一度だけ実行するためにnullに設定
    }
  }, [])

  // 検索・絞り込み条件が変更されたときにタスクをフィルタリング
  useEffect(() => {
    if (tasks.length === 0) return

    let filtered = [...tasks]

    // テキスト検索
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)),
      )
    }

    // ID検索
    if (debouncedSearchById) {
      filtered = filtered.filter((task) => task.id.includes(debouncedSearchById))
    }

    // ステータスフィルタ
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, debouncedSearchQuery, debouncedSearchById, statusFilter])

  // URLのクエリパラメータからタスクIDを取得し、該当タスクを表示
  useEffect(() => {
    if (loading || !initialRenderRef.current) return

    const taskId = searchParams.get("task")
    if (taskId && processedTaskIdRef.current !== taskId) {
      processedTaskIdRef.current = taskId

      // データ読み込み完了後に処理
      if (!loading && tasks.length > 0) {
        const task = tasks.find((t) => t.id === taskId)
        if (task) {
          if (viewMode === "list") {
            // リストモードの場合は詳細を展開
            setExpandedTasks((prev) => ({
              ...prev,
              [taskId]: true,
            }))
            // タスクの位置までスクロール
            setTimeout(() => {
              const taskElement = document.getElementById(`task-${taskId}`)
              if (taskElement) {
                taskElement.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            }, 100)
          } else {
            // カンバンモードの場合はタスク詳細ダイアログを表示
            setSelectedKanbanTask(task)
          }
        }
      }
    }

    initialRenderRef.current = false
  }, [loading, tasks, searchParams, viewMode])

  // 再試行ハンドラ
  const handleRetry = () => {
    setIsRetrying(true)
    fetchTaskList(false) // キャッシュを使用せずに再取得
  }

  // タスクの詳細表示を切り替える関数
  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  // ユーザー名が変更されたときにlocalStorageに保存
  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setUserName(newName)
    saveUserNameToStorage(newName)
  }

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    if (!userName) {
      setPendingAction({
        type: "status",
        taskId,
        value: status,
      })
      setShowUsernameDialog(true)
      return
    }

    await updateTaskStatus(taskId, status, userName)
  }

  const updateTaskStatus = async (taskId: string, status: string, name: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/items/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          assignedTo: name,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクの更新に失敗しました")
      }

      const { task } = await response.json()
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: task.status, assignedTo: task.assignedTo } : t,
      )
      setTasks(updatedTasks)

      // 担当者の状態も更新
      setTaskAssignees((prev) => ({
        ...prev,
        [taskId]: task.assignedTo || "",
      }))

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      alert(error instanceof Error ? error.message : "タスクの更新中にエラーが発生しました")
    }
  }

  // 担当者の編集モードを切り替える
  const toggleAssigneeEdit = (taskId: string) => {
    setIsEditingAssignee((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  // 担当者を更新する
  const handleAssigneeChange = (taskId: string, assignee: string) => {
    setTaskAssignees((prev) => ({
      ...prev,
      [taskId]: assignee,
    }))
  }

  // 担当者の更新を保存する
  const saveAssignee = async (taskId: string) => {
    const assignee = taskAssignees[taskId] || ""

    try {
      const response = await fetch(`/api/tasks/${id}/items/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedTo: assignee,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("担当者の更新に失敗しました")
      }

      const { task } = await response.json()
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, assignedTo: task.assignedTo } : t))
      setTasks(updatedTasks)

      // 編集モードを終了
      toggleAssigneeEdit(taskId)

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error updating assignee:", error)
      alert(error instanceof Error ? error.message : "担当者の更新中にエラーが発生しました")
    }
  }

  const handleTaskProgressChange = async (taskId: string, progressPercentage: number) => {
    // スライダーの値を更新
    setSliderValues((prev) => ({
      ...prev,
      [taskId]: progressPercentage,
    }))

    if (!userName) {
      setPendingAction({
        type: "progress",
        taskId,
        value: progressPercentage,
      })
      setShowUsernameDialog(true)
      return
    }

    // 既存のタイムアウトをクリア
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current)
    }

    // 新しいタイムアウトを設定（500ms後に実行）
    sliderTimeoutRef.current = setTimeout(() => {
      updateTaskProgress(taskId, progressPercentage, userName)
    }, 500)
  }

  const updateTaskProgress = async (taskId: string, progressPercentage: number, name: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/items/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          progressPercentage,
          assignedTo: name,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクの更新に失敗しました")
      }

      const { task } = await response.json()
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, progressPercentage: task.progressPercentage, assignedTo: task.assignedTo } : t,
      )
      setTasks(updatedTasks)

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error updating task progress:", error)
      alert(error instanceof Error ? error.message : "タスクの更新中にエラーが発生しました")
    }
  }

  const handleTaskCompletedChange = async (taskId: string, completed: boolean) => {
    if (!userName) {
      setPendingAction({
        type: "completed",
        taskId,
        value: completed,
      })
      setShowUsernameDialog(true)
      return
    }

    await updateTaskCompleted(taskId, completed, userName)
  }

  const updateTaskCompleted = async (taskId: string, completed: boolean, name: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/items/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed,
          assignedTo: name,
          // 完了時は進捗を100%に、未完了に戻した場合は進捗を変更しない
          ...(completed ? { progressPercentage: 100 } : {}),
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクの更新に失敗しました")
      }

      const { task } = await response.json()
      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: task.completed,
              assignedTo: task.assignedTo,
              progressPercentage: task.progressPercentage,
            }
          : t,
      )
      setTasks(updatedTasks)

      // 完了時はスライダーの値も更新
      if (completed) {
        setSliderValues((prev) => ({
          ...prev,
          [taskId]: 100,
        }))
      }

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error updating task completion:", error)
      alert(error instanceof Error ? error.message : "タスクの更新中にエラーが発生しました")
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description || "")
  }

  // handleSaveTaskEdit関数を更新
  const handleSaveTaskEdit = async () => {
    if (!editingTaskId) return

    try {
      const response = await fetch(`/api/tasks/${id}/items/${editingTaskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクの更新に失敗しました")
      }

      const { task } = await response.json()
      const updatedTasks = tasks.map((t) =>
        t.id === editingTaskId ? { ...t, title: task.title, description: task.description } : t,
      )
      setTasks(updatedTasks)

      // Swift側にタスク更新を通知
      sendTaskIdToNative(editingTaskId, "updated")

      setEditingTaskId(null)

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error updating task:", error)
      alert(error instanceof Error ? error.message : "タスクの更新中にエラーが発生しました")
    }
  }

  const handleCancelTaskEdit = () => {
    setEditingTaskId(null)
  }

  // handleDeleteTask関数を更新
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("このタスクを削除してもよろしいですか？")) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${id}/items/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクの削除に失敗しました")
      }

      const updatedTasks = tasks.filter((t) => t.id !== taskId)
      setTasks(updatedTasks)

      // Swift側にタスク削除を通知
      sendTaskIdToNative(taskId, "deleted")

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      alert(error instanceof Error ? error.message : "タスクの削除中にエラーが発生しました")
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      alert("タスク名を入力してください")
      return
    }

    try {
      const response = await fetch(`/api/tasks/${id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクの追加に失敗しました")
      }

      const { task } = await response.json()
      const updatedTasks = [...tasks, task]
      setTasks(updatedTasks)

      // スライダーの初期値を設定
      setSliderValues((prev) => ({
        ...prev,
        [task.id]: task.progressPercentage || 0,
      }))

      // 担当者の初期値を設定
      setTaskAssignees((prev) => ({
        ...prev,
        [task.id]: task.assignedTo || "",
      }))

      // Swift側にタスクIDを送信
      sendTaskIdToNative(task.id, "created")

      setNewTaskTitle("")
      setNewTaskDescription("")
      setIsAddingTask(false)

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error adding task:", error)
      alert(error instanceof Error ? error.message : "タスクの追加中にエラーが発生しました")
    }
  }

  const handleUpdateTaskList = async () => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editListTitle,
          description: editListDescription,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return
        }
        throw new Error("タスクリストの更新に失敗しました")
      }

      const { taskList } = await response.json()
      setTaskList(taskList)
      setIsEditingList(false)

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          taskList,
        }
        cacheTaskListData(id, updatedData)
      }
    } catch (error) {
      console.error("Error updating task list:", error)
      alert(error instanceof Error ? error.message : "タスクリストの更新中にエラーが発生しました")
    }
  }

  const handleUsernameSubmit = (name: string) => {
    setUserName(name)
    saveUserNameToStorage(name) // ユーザー名をlocalStorageに保存
    setShowUsernameDialog(false)

    if (pendingAction) {
      if (pendingAction.type === "status") {
        updateTaskStatus(pendingAction.taskId, pendingAction.value, name)
      } else if (pendingAction.type === "completed") {
        updateTaskCompleted(pendingAction.taskId, pendingAction.value, name)
      } else if (pendingAction.type === "progress") {
        updateTaskProgress(pendingAction.taskId, pendingAction.value, name)
      } else if (pendingAction.type === "assignee") {
        saveAssignee(pendingAction.taskId)
      }
      setPendingAction(null)
    }
  }

  const handleCommentWithoutName = () => {
    if (!userName) {
      setShowUsernameDialog(true)
      return true
    }
    return false
  }

  // カンバンボード用のタスク更新関数
  const handleTaskUpdate = async (taskId: string, title: string, description: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/items/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          alert("サーバーが混雑しています。しばらく待ってから再試行してください。")
          return Promise.reject(new Error("サーバーが混雑しています"))
        }
        return Promise.reject(new Error("タスクの更新に失敗しました"))
      }

      const { task } = await response.json()
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, title: task.title, description: task.description } : t,
      )
      setTasks(updatedTasks)

      // キャッシュを更新
      const cachedData = getCachedTaskListData(id)
      if (cachedData) {
        const updatedData = {
          ...cachedData.data,
          tasks: updatedTasks,
        }
        cacheTaskListData(id, updatedData)
      }

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating task:", error)
      return Promise.reject(error)
    }
  }

  // カンバンボードの選択タスク変更ハンドラ
  const handleSelectedKanbanTaskChange = useCallback((task: Task | null) => {
    setSelectedKanbanTask(task)
  }, [])

  // スライダーの値変更ハンドラ
  const handleSliderChange = (taskId: string, value: number[]) => {
    setSliderValues((prev) => ({
      ...prev,
      [taskId]: value[0],
    }))
  }

  // スライダーの値確定ハンドラ
  const handleSliderCommit = (taskId: string, value: number[]) => {
    handleTaskProgressChange(taskId, value[0])
  }

  // 検索条件のリセット
  const resetFilters = () => {
    setSearchQuery("")
    setSearchById("")
    setStatusFilter("all")
  }

  // 検索条件が適用されているかどうか
  const hasActiveFilters = searchQuery !== "" || searchById !== "" || statusFilter !== "all"

  // 選択されたタスクを取得（URLパラメータから）
  const selectedTaskId = searchParams.get("task")
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <p className="text-lg">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[50vh]">
        <p className="text-lg text-red-500 mb-4">{error}</p>
        <div className="flex space-x-4">
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            ホームに戻る
          </Button>
          <Button onClick={handleRetry} className="bg-blue-500 hover:bg-blue-600" disabled={isRetrying}>
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> 再試行中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> 再試行
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (!taskList) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[50vh]">
        <p className="text-lg text-red-500 mb-4">タスクリストが見つかりません</p>
        <Button onClick={() => (window.location.href = "/")}>ホームに戻る</Button>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-full lg:max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            {isEditingList ? (
              <Input
                value={editListTitle}
                onChange={(e) => setEditListTitle(e.target.value)}
                className="text-xl md:text-2xl font-bold w-full"
              />
            ) : (
              <h1 className="text-xl md:text-2xl font-bold break-words">{taskList.title}</h1>
            )}
          </div>
          <div className="flex space-x-2">
            {isEditingList ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditingList(false)}>
                  <X className="h-4 w-4 mr-1" /> キャンセル
                </Button>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleUpdateTaskList}>
                  <Check className="h-4 w-4 mr-1" /> 保存
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditingList(true)}>
                  <Edit className="h-4 w-4 mr-1" /> 編集
                </Button>
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                      <Share2 className="h-4 w-4 mr-1" /> 共有
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>タスクリストを共有</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>共有リンク</Label>
                        <div className="flex">
                          <Input value={shareUrl} readOnly className="flex-1" />
                          <Button
                            variant="outline"
                            className="ml-2"
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl)
                              alert("リンクをコピーしました")
                            }}
                          >
                            コピー
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <img src={qrCodeUrl || "/placeholder.svg"} alt="QRコード" className="w-48 h-48" />
                      </div>
                      <p className="text-sm text-center text-gray-500">
                        このQRコードをスキャンするか、リンクを共有してタスクリストにアクセスできます
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {isEditingList ? (
          <Textarea
            value={editListDescription}
            onChange={(e) => setEditListDescription(e.target.value)}
            placeholder="タスクリストの詳細"
            className="mb-6"
            rows={4}
          />
        ) : taskList.description ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <MarkdownRenderer content={taskList.description} />
            </CardContent>
          </Card>
        ) : null}

        <div className="mb-4">
          <Label htmlFor="user-name" className="mb-2 block">
            あなたの名前（任意）
          </Label>
          <Input
            id="user-name"
            placeholder="名前を入力（タスク状態変更時に記録されます）"
            value={userName}
            onChange={handleUserNameChange}
            className="max-w-md"
          />
        </div>

        <div className="space-y-6 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg md:text-xl font-semibold">タスク一覧</h2>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className={viewMode === "list" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-1" /> リスト
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  className={viewMode === "kanban" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" /> カンバン
                </Button>
              </div>
            </div>
            <Button onClick={() => setIsAddingTask(true)} className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" /> 新しいタスク
            </Button>
          </div>

          {/* 検索・絞り込み機能 - リストモードのみ表示 */}
          {viewMode === "list" && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search-query" className="flex items-center">
                    <Search className="h-4 w-4 mr-1" /> タスク検索
                  </Label>
                  <Input
                    id="search-query"
                    placeholder="タスク名や説明で検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search-by-id" className="flex items-center">
                    <Search className="h-4 w-4 mr-1" /> ID検索
                  </Label>
                  <Input
                    id="search-by-id"
                    placeholder="タスクIDで検索"
                    value={searchById}
                    onChange={(e) => setSearchById(e.target.value)}
                  />
                </div>
                <div className="md:w-1/4 space-y-2">
                  <Label htmlFor="status-filter" className="flex items-center">
                    <Filter className="h-4 w-4 mr-1" /> ステータス
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="ステータスで絞り込み" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="未着手">未着手</SelectItem>
                      <SelectItem value="作業中">作業中</SelectItem>
                      <SelectItem value="私がやる予定">私がやる予定</SelectItem>
                      <SelectItem value="完了">完了</SelectItem>
                      <SelectItem value="アーカイブ">アーカイブ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">{filteredTasks.length} 件のタスクが見つかりました</div>
                  <Button variant="outline" size="sm" onClick={resetFilters} className="text-gray-500">
                    <XIcon className="h-3 w-3 mr-1" /> フィルターをクリア
                  </Button>
                </div>
              )}
            </div>
          )}

          {isAddingTask && (
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-lg">新しいタスク</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-task-title">タスク名</Label>
                  <Input
                    id="new-task-title"
                    placeholder="タスク名"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-description">詳細（Markdown対応）</Label>
                  <Textarea
                    id="new-task-description"
                    placeholder="タスクの詳細"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingTask(false)
                      setNewTaskTitle("")
                      setNewTaskDescription("")
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleAddTask} className="bg-blue-500 hover:bg-blue-600">
                    追加
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">タスクがありません。新しいタスクを追加してください。</p>
            </div>
          ) : viewMode === "kanban" ? (
            <div className={isMobile ? "overflow-x-auto -mx-4 px-4" : ""}>
              <KanbanBoard
                tasks={tasks}
                userName={userName}
                listId={id} // リストIDを追加
                onTaskStatusChange={handleTaskStatusChange}
                onTaskCompletedChange={handleTaskCompletedChange}
                onTaskUpdate={handleTaskUpdate}
                onTaskProgressChange={handleTaskProgressChange}
                onDeleteTask={handleDeleteTask}
                onCommentWithoutName={handleCommentWithoutName}
                selectedTask={selectedKanbanTask}
                onSelectedTaskChange={handleSelectedKanbanTaskChange}
                onAssigneeChange={handleAssigneeChange}
              />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">検索条件に一致するタスクがありません。</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} id={`task-${task.id}`} className="overflow-hidden mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        id={`task-${task.id}-completed`}
                        checked={task.completed}
                        onCheckedChange={(checked) => handleTaskCompletedChange(task.id, checked === true)}
                        className="mt-1"
                      />
                      {editingTaskId === task.id ? (
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1" />
                      ) : (
                        <Label
                          htmlFor={`task-${task.id}-completed`}
                          className={`font-medium text-base md:text-lg flex-1 ${task.completed ? "line-through text-gray-500" : ""}`}
                        >
                          {task.title}
                        </Label>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {editingTaskId === task.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={handleCancelTaskEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={handleSaveTaskEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTaskForShare(task)
                              setShowTaskShareDialog(true)
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`task-${task.id}-status`} className="whitespace-nowrap">
                          ステータス:
                        </Label>
                        <Select value={task.status} onValueChange={(value) => handleTaskStatusChange(task.id, value)}>
                          <SelectTrigger id={`task-${task.id}-status`} className="w-[140px]">
                            <SelectValue placeholder="ステータスを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="未着手">未着手</SelectItem>
                            <SelectItem value="作業中">作業中</SelectItem>
                            <SelectItem value="私がやる予定">私がやる予定</SelectItem>
                            <SelectItem value="完了">完了</SelectItem>
                            <SelectItem value="アーカイブ">アーカイブ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 担当者表示・編集エリア */}
                      {task.status === "未着手" && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`task-${task.id}-assignee`} className="whitespace-nowrap flex items-center">
                            <User className="h-3 w-3 mr-1" /> 担当者:
                          </Label>
                          {isEditingAssignee[task.id] ? (
                            <div className="flex items-center space-x-1">
                              <Input
                                id={`task-${task.id}-assignee`}
                                value={taskAssignees[task.id] || ""}
                                onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                className="w-32 h-8 text-sm"
                                placeholder="担当者名"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (!userName) {
                                    setPendingAction({
                                      type: "assignee",
                                      taskId: task.id,
                                      value: null,
                                    })
                                    setShowUsernameDialog(true)
                                    return
                                  }
                                  saveAssignee(task.id)
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleAssigneeEdit(task.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm">{task.assignedTo ? task.assignedTo : "未確定"}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleAssigneeEdit(task.id)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {task.status !== "未着手" && task.assignedTo && (
                        <div className="text-sm text-gray-500">最終更新者: {task.assignedTo}</div>
                      )}
                      <div className="text-xs text-gray-400">ID: {task.id}</div>
                    </div>

                    {/* 進捗スライダー - 作業中のタスクのみ表示 */}
                    {task.status === "作業中" && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`task-${task.id}-progress`}>進捗状況:</Label>
                          <span className="text-sm font-medium">{sliderValues[task.id] || 0}%</span>
                        </div>
                        <Slider
                          id={`task-${task.id}-progress`}
                          min={0}
                          max={100}
                          step={5}
                          value={[sliderValues[task.id] || 0]}
                          onValueChange={(value) => handleSliderChange(task.id, value)}
                          onValueCommit={(value) => handleSliderCommit(task.id, value)}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* 詳細表示ボタン */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-gray-500"
                        onClick={() => toggleTaskExpanded(task.id)}
                      >
                        {expandedTasks[task.id] ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" /> 詳細を隠す
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" /> 詳細を表示
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 詳細とコメントのタブ（展開時のみ表示） */}
                    {expandedTasks[task.id] && (
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="w-full md:w-auto">
                          <TabsTrigger value="details" className="flex-1 md:flex-none">
                            詳細
                          </TabsTrigger>
                          <TabsTrigger value="comments" className="flex-1 md:flex-none">
                            コメント
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="pt-4">
                          {editingTaskId === task.id ? (
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="タスクの詳細"
                              rows={4}
                            />
                          ) : task.description ? (
                            <MarkdownRenderer content={task.description} />
                          ) : (
                            <p className="text-gray-500 italic">詳細はありません</p>
                          )}
                        </TabsContent>
                        <TabsContent value="comments" className="pt-4">
                          <TaskComments
                            taskId={task.id}
                            userName={userName}
                            onCommentWithoutName={handleCommentWithoutName}
                          />
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <UsernameDialog isOpen={showUsernameDialog} onClose={handleUsernameSubmit} />
        {selectedTaskForShare && (
          <TaskShareDialog
            isOpen={showTaskShareDialog}
            onClose={() => setShowTaskShareDialog(false)}
            taskId={selectedTaskForShare.id}
            listId={id}
            taskTitle={selectedTaskForShare.title}
          />
        )}
      </div>
    </>
  )
}
