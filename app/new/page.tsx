"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, ChevronUp, FileText } from "lucide-react"
import { Label } from "@/components/ui/label"
import { sendTaskIdToNative } from "@/lib/native-bridge"

type Task = {
  id: string
  title: string
  description: string
  showDescription: boolean
}

export default function NewTaskList() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [showDescription, setShowDescription] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([{ id: "1", title: "", description: "", showDescription: false }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addTask = () => {
    setTasks([...tasks, { id: Date.now().toString(), title: "", description: "", showDescription: false }])
  }

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== id))
    }
  }

  const updateTaskTitle = (id: string, title: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, title } : task)))
  }

  const updateTaskDescription = (id: string, description: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, description } : task)))
  }

  const toggleTaskDescription = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, showDescription: !task.showDescription } : task)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert("タスクリストのタイトルを入力してください")
      return
    }

    // 空のタスクを除外
    const validTasks = tasks.filter((task) => task.title.trim())

    if (validTasks.length === 0) {
      alert("少なくとも1つのタスクを追加してください")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          tasks: validTasks.map(({ id, title, description }) => ({ id, title, description })),
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Swift側にタスクIDを送信
        sendTaskIdToNative(data.id, "created")

        // 作成完了ページにリダイレクト
        router.push(`/created/${data.id}`)
      } else {
        throw new Error("タスクリストの作成に失敗しました")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("タスクリストの作成中にエラーが発生しました。もう一度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center">新しいタスクリストを作成</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>タスクリスト情報</CardTitle>
            <CardDescription>タスクリストのタイトルと詳細を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                placeholder="タスクリストのタイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {!showDescription ? (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2 text-gray-500"
                onClick={() => setShowDescription(true)}
              >
                <FileText className="mr-2 h-4 w-4" /> 詳細を追加（Markdown対応）
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">詳細（Markdown対応）</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDescription(false)}
                    className="h-8 px-2 text-gray-500"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" /> 隠す
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="タスクリストの詳細を記入してください"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mt-8 mb-4">タスク一覧</h2>

        {tasks.map((task, index) => (
          <Card key={task.id} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">タスク {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(task.id)}
                  disabled={tasks.length === 1}
                >
                  <Trash2 className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`task-title-${task.id}`}>タスク名</Label>
                <Input
                  id={`task-title-${task.id}`}
                  placeholder="タスク名"
                  value={task.title}
                  onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                />
              </div>

              {!task.showDescription ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-gray-500"
                  onClick={() => toggleTaskDescription(task.id)}
                >
                  <FileText className="mr-2 h-4 w-4" /> 詳細を追加（Markdown対応）
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`task-description-${task.id}`}>詳細（Markdown対応）</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTaskDescription(task.id)}
                      className="h-8 px-2 text-gray-500"
                    >
                      <ChevronUp className="h-4 w-4 mr-1" /> 隠す
                    </Button>
                  </div>
                  <Textarea
                    id={`task-description-${task.id}`}
                    placeholder="タスクの詳細"
                    value={task.description}
                    onChange={(e) => updateTaskDescription(task.id, e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" className="w-full mt-4" onClick={addTask}>
          <Plus className="mr-2 h-4 w-4" /> タスクを追加
        </Button>

        <div className="mt-8 flex justify-end">
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600 w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "タスクリストを作成"}
          </Button>
        </div>
      </form>
    </div>
  )
}
