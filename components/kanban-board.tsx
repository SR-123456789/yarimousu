/* eslint-disable react/forbid-dom-props */
"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Share2, User, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskComments } from "@/components/task-comments"
import { Slider } from "@/components/ui/slider"
import { TaskShareDialog } from "@/components/task-share-dialog"

type Task = {
  id: string
  listId: string
  title: string
  description: string
  status: "未着手" | "作業中" | "私がやる予定" | "完了" | "アーカイブ"
  assignedTo: string
  completed: boolean
  progressPercentage?: number
  priority?: number
  position: number
  createdAt: string
  updatedAt: string
}

interface KanbanBoardProps {
  tasks: Task[]
  userName: string
  listId: string
  onTaskStatusChange: (taskId: string, status: string) => void
  onTaskCompletedChange: (taskId: string, completed: boolean) => void
  onTaskUpdate: (taskId: string, title: string, description: string) => Promise<void>
  onTaskProgressChange: (taskId: string, progressPercentage: number) => void
  onDeleteTask: (taskId: string) => void
  onCommentWithoutName?: () => boolean
  selectedTask?: Task | null
  onSelectedTaskChange?: (task: Task | null) => void
  onAssigneeChange?: (taskId: string, assignee: string) => void
  onPriorityChange?: (taskId: string, priority: number) => void
  sortOrder?: Record<string, 'asc' | 'desc' | null>
  onSortByPriority?: (order: "asc" | "desc" | "all") => void
  onTaskReorder?: (tasks: Task[]) => void
}

const statusColumns = [
  { id: "未着手", name: "未着手" },
  { id: "作業中", name: "作業中" },
  { id: "私がやる予定", name: "私がやる予定" },
  { id: "完了", name: "完了" },
  { id: "アーカイブ", name: "アーカイブ" },
]

export function KanbanBoard({
  tasks,
  userName,
  listId,
  onTaskStatusChange,
  onTaskCompletedChange,
  onTaskUpdate,
  onTaskProgressChange,
  onDeleteTask,
  onCommentWithoutName,
  selectedTask: externalSelectedTask,
  onSelectedTaskChange,
  onAssigneeChange,
  onPriorityChange,
  sortOrder = {},
  onSortByPriority,
  onTaskReorder,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<{ [key: string]: Task[] }>({})
  const isMobile = useMobile()
  const [internalSelectedTask, setInternalSelectedTask] = useState<Task | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [sliderValue, setSliderValue] = useState<number>(0)
  const initialRenderRef = useRef(true)
  const isDraggingSliderRef = useRef(false)
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const [editAssignee, setEditAssignee] = useState("")
  const [isEditingPriority, setIsEditingPriority] = useState(false)
  const [editPriority, setEditPriority] = useState("")

  // 実際に表示に使用するselectedTaskを決定
  // 外部から渡されたものがあればそれを優先
  const selectedTask = externalSelectedTask || internalSelectedTask

  // 外部から選択されたタスクが変更された時のみ、編集状態をリセット
  useEffect(() => {
    if (externalSelectedTask && !initialRenderRef.current) {
      setIsEditing(false)
      setIsEditingAssignee(false)
      setIsEditingPriority(false) // 優先順位の編集状態もリセット
      // 選択されたタスクが作業中の場合、スライダーの値を更新
      if (externalSelectedTask.status === "作業中") {
        setSliderValue(externalSelectedTask.progressPercentage || 0)
      }
      // 担当者の値を更新
      setEditAssignee(externalSelectedTask.assignedTo || "")
      // 優先順位の値を更新
      setEditPriority(String(externalSelectedTask.priority ?? 1))
    }
    initialRenderRef.current = false
  }, [externalSelectedTask])

  // タスクが更新されたときにスライダーの値を更新
  useEffect(() => {
    if (selectedTask) {
      if (selectedTask.status === "作業中") {
        setSliderValue(selectedTask.progressPercentage || 0)
      }
      setEditAssignee(selectedTask.assignedTo || "")
      setEditPriority(String(selectedTask.priority ?? 1)) // 優先順位の値も更新
    }
  }, [selectedTask])

  useEffect(() => {
    // タスクをステータスごとに分類
    const newColumns: { [key: string]: Task[] } = {}

    statusColumns.forEach((column) => {
      let columnTasks = tasks.filter((task) => task.status === column.id)
      
      // 優先度のソート順が設定されている場合は適用
      const priorityOrder = sortOrder.priority
      if (priorityOrder) {
        columnTasks.sort((a, b) => {
          const priorityA = a.priority ?? 1
          const priorityB = b.priority ?? 1
          
          if (priorityOrder === 'desc') {
            return priorityB - priorityA // 高い順
          } else {
            return priorityA - priorityB // 低い順
          }
        })
      } else {
        // デフォルトはpositionでソート
        columnTasks.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      }
      
      newColumns[column.id] = columnTasks
    })

    setColumns(newColumns)
  }, [tasks, sortOrder])

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    // ドロップ先がない場合は何もしない
    if (!destination) return

    // 同じ場所にドロップした場合は何もしない
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // ドラッグしたタスクを取得
    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    const sourceColumnId = source.droppableId
    const destinationColumnId = destination.droppableId

    // 同一カラム内での並び替えの場合
    if (sourceColumnId === destinationColumnId) {
      // 同じステータス内でのposition変更
      const columnTasks = tasks.filter(t => t.status === sourceColumnId)
      const otherTasks = tasks.filter(t => t.status !== sourceColumnId)
      
      // ドラッグしたタスクを配列から削除
      const taskIndex = columnTasks.findIndex(t => t.id === draggableId)
      if (taskIndex === -1) return
      
      const [draggedTask] = columnTasks.splice(taskIndex, 1)
      
      // 新しい位置に挿入
      columnTasks.splice(destination.index, 0, draggedTask)
      
      // position値を更新
      const updatedColumnTasks = columnTasks.map((t, index) => ({
        ...t,
        position: index
      }))
      
      // 全体のタスクリストを再構築
      const reorderedTasks = [...otherTasks, ...updatedColumnTasks]
      
      // 並び替えを親コンポーネントに通知
      if (onTaskReorder) {
        onTaskReorder(reorderedTasks)
      }
    } else {
      // 異なるカラム間での移動の場合（既存の処理）
      const newStatus = destinationColumnId
      onTaskStatusChange(task.id, newStatus)
      // ステータス変更時に担当者を更新
      onAssigneeChange?.(task.id, userName)
    }
  }

  const handleTaskClick = (task: Task) => {
    setInternalSelectedTask(task)
    if (onSelectedTaskChange) {
      onSelectedTaskChange(task)
    }
    setIsEditing(false)
    setIsEditingAssignee(false)
    setIsEditingPriority(false) // 優先順位の編集状態もリセット
    if (task.status === "作業中") {
      setSliderValue(task.progressPercentage || 0)
    }
    setEditAssignee(task.assignedTo || "")
    setEditPriority(String(task.priority ?? 1)) // 優先順位の値を設定
  }

  const handleEditClick = () => {
    if (!selectedTask) return
    setEditTitle(selectedTask.title)
    setEditDescription(selectedTask.description || "")
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedTask) return
    await onTaskUpdate(selectedTask.id, editTitle, editDescription)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleCloseDialog = () => {
    setInternalSelectedTask(null)
    if (onSelectedTaskChange) {
      onSelectedTaskChange(null)
    }
    setIsEditing(false)
    setIsEditingAssignee(false)
    setIsEditingPriority(false) // 優先順位の編集状態もリセット
  }

  const handleShareClick = () => {
    setShowShareDialog(true)
  }

  // スライダーの値変更時の処理（ドラッグ中も含む）
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
    isDraggingSliderRef.current = true
  }

  // スライダーのドラッグ終了時の処理
  const handleSliderCommit = (value: number[]) => {
    if (selectedTask) {
      isDraggingSliderRef.current = false
      onTaskProgressChange(selectedTask.id, value[0])
    }
  }

  // 担当者編集モードの切り替え
  const toggleAssigneeEdit = () => {
    setIsEditingAssignee(!isEditingAssignee)
  }

  // 担当者の保存
  const handleSaveAssignee = () => {
    if (selectedTask && onAssigneeChange) {
      onAssigneeChange(selectedTask.id, editAssignee)
      setIsEditingAssignee(false)
    }
  }

  // 優先順位編集モードの切り替え
  const togglePriorityEdit = () => {
    setIsEditingPriority(!isEditingPriority)
    if (!isEditingPriority && selectedTask) {
      setEditPriority(selectedTask.priority?.toString() || "1")
    }
  }

  // 優先順位の保存
  const handleSavePriority = () => {
    if (selectedTask && onPriorityChange) {
      const priorityValue = parseFloat(editPriority)
      if (!isNaN(priorityValue)) {
        onPriorityChange(selectedTask.id, priorityValue)
        setIsEditingPriority(false)
      } else {
        alert("有効な数値を入力してください")
      }
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-3 min-w-max">
          {statusColumns.map((column) => (
            <div key={column.id} className={isMobile ? "w-56" : "w-72"}>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg p-2 md:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-xs md:text-sm">{column.name}</h3>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {columns[column.id]?.length || 0}
                    </Badge>
                  </div>
                  {onSortByPriority && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                      onClick={() => {
                        const currentOrder = sortOrder.priority;
                        let nextOrder: "asc" | "desc" | "all";
                        
                        if (!currentOrder) {
                          nextOrder = "desc"; // 高い順から開始
                        } else if (currentOrder === "desc") {
                          nextOrder = "asc"; // 低い順に変更
                        } else {
                          nextOrder = "all"; // リセット
                        }
                        
                        onSortByPriority(nextOrder);
                      }}
                      title={
                        !sortOrder.priority 
                          ? "優先度で並び替える" 
                          : sortOrder.priority === 'desc' 
                          ? "優先度順: 高い順に表示中（クリックで低い順に変更）" 
                          : "優先度順: 低い順に表示中（クリックでリセット）"
                      }
                    >
                      <div className="flex items-center gap-1">
                        {!sortOrder.priority ? (
                          <>
                            <ArrowUpDown className="w-3 h-3" />
                            <span className="text-[10px] font-medium">優先度</span>
                          </>
                        ) : sortOrder.priority === 'desc' ? (
                          <>
                            <ArrowDown className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] font-medium text-red-600">高→低</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-medium text-blue-600">低→高</span>
                          </>
                        )}
                      </div>
                    </Button>
                  )}
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-50 dark:bg-gray-900 rounded-b-lg p-1 md:p-2 min-h-[50vh]"
                  >
                    {columns[column.id]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2 shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                            onClick={() => handleTaskClick(task)}
                          >
                            <CardHeader className={isMobile ? "p-2 pb-0" : "p-3 pb-0"}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1">
                                  <Checkbox
                                    id={`kanban-task-${task.id}-completed`}
                                    checked={task.completed}
                                    onCheckedChange={(checked) => {
                                      // イベントの伝播を止める
                                      event?.stopPropagation()
                                      onTaskCompletedChange(task.id, checked === true)
                                      // 完了状態変更時に担当者を更新
                                      onAssigneeChange?.(task.id, userName)
                                    }}
                                    className={isMobile ? "mt-0.5 h-3 w-3" : "mt-1"}
                                    onClick={(e) => e.stopPropagation()} // クリックイベントの伝播を止める
                                  />
                                  <div className="flex-1">
                                    <div
                                      className={`font-medium ${isMobile ? "text-xs" : "text-sm"} ${
                                        task.completed ? "line-through text-gray-500" : ""
                                      }`}
                                    >
                                      {task.title}
                                    </div>
                                    {task.assignedTo && (
                                      <div className={`${isMobile ? "text-[10px]" : "text-xs"} text-gray-500 mt-0.5`}>
                                        {task.assignedTo}
                                      </div>
                                    )}
                                    {task.priority !== undefined && task.priority !== null && (
                                      <div className={`flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-2 py-1 rounded-md mt-1 ${isMobile ? "text-[10px]" : "text-xs"}`}>
                                        <div className="flex items-center space-x-1">
                                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500"></div>
                                          <span className="text-gray-700 dark:text-gray-300 font-medium">優先度</span>
                                          <span className="font-bold text-orange-600 dark:text-orange-400">{task.priority}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <div className="flex space-x-0.5">
                                            {[1, 2, 3, 4, 5].map((level) => {
                                              const isActive = (task.priority ?? 1) >= level;
                                              return (
                                                <div
                                                  key={level}
                                                  className={`w-1 h-2 rounded-sm transition-all duration-200 ${
                                                    isActive 
                                                      ? level <= 2 
                                                        ? 'bg-green-400' 
                                                        : level <= 4 
                                                        ? 'bg-yellow-400' 
                                                        : 'bg-red-400'
                                                      : 'bg-gray-200 dark:bg-gray-600'
                                                  }`}
                                                />
                                              );
                                            })}
                                          </div>
                                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">
                                            {(() => {
                                              const priority = task.priority ?? 1;
                                              if (priority <= 2) return "低";
                                              if (priority <= 4) return "中";
                                              return "高";
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={isMobile ? "h-5 w-5" : "h-6 w-6"}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleTaskClick(task)
                                      handleEditClick()
                                    }}
                                  >
                                    <Edit className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={isMobile ? "h-5 w-5" : "h-6 w-6"}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteTask(task.id)
                                    }}
                                  >
                                    <Trash2 className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {/* {task.description && !isMobile && (
                              <CardContent className="p-3 pt-2">
                                <div className="text-xs text-gray-600 dark:text-gray-300 max-h-24 overflow-y-auto">
                                  <MarkdownRenderer content={task.description} />
                                </div>
                              </CardContent>
                            )} */}
                            {/* 作業中のタスクには進捗バーを表示 */}
                            {task.status === "作業中" && (
                              <div className="px-3 pb-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 relative">
                                  <div
                                    className={`bg-blue-500 h-1.5 rounded-full transition-all duration-300 absolute left-0 top-0`}
                                    style={{ width: `${Math.min(100, Math.max(0, task.progressPercentage || 0))}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* タスク詳細ダイアログ */}
      <Dialog open={selectedTask !== null} onOpenChange={handleCloseDialog}>
        {selectedTask && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? "タスクを編集" : "タスク詳細"}</DialogTitle>
            </DialogHeader>

            {isEditing ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-task-title">タスク名</Label>
                  <Input
                    id="edit-task-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="タスク名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-task-description">詳細（Markdown対応）</Label>
                  <Textarea
                    id="edit-task-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="タスクの詳細"
                    rows={5}
                  />
                </div>
                <DialogFooter className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    キャンセル
                  </Button>
                  <Button onClick={handleSaveEdit} className="bg-blue-500 hover:bg-blue-600">
                    保存
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`dialog-task-${selectedTask.id}-completed`}
                      checked={selectedTask.completed}
                      onCheckedChange={(checked) => {
                        onTaskCompletedChange(selectedTask.id, checked === true)
                        // 完了状態変更時に担当者を更新
                        onAssigneeChange?.(selectedTask.id, userName)
                      }}
                    />
                    <Label
                      htmlFor={`dialog-task-${selectedTask.id}-completed`}
                      className={`font-medium ${selectedTask.completed ? "line-through text-gray-500" : ""}`}
                    >
                      {selectedTask.title}
                    </Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleShareClick}>
                      <Share2 className="h-4 w-4 mr-1" /> 共有
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                      <Edit className="h-4 w-4 mr-1" /> 編集
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`dialog-task-${selectedTask.id}-status`} className="whitespace-nowrap">
                      ステータス:
                    </Label>
                    <Select
                      value={selectedTask.status}
                      onValueChange={(value) => {
                        onTaskStatusChange(selectedTask.id, value)
                        // ステータス変更時に担当者を更新
                        onAssigneeChange?.(selectedTask.id, userName)
                      }}
                    >
                      <SelectTrigger id={`dialog-task-${selectedTask.id}-status`} className="w-[140px]">
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
                  {selectedTask.status === "未着手" && (
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor={`dialog-task-${selectedTask.id}-assignee`}
                        className="whitespace-nowrap flex items-center"
                      >
                        <User className="h-3 w-3 mr-1" /> 担当者:
                      </Label>
                      {isEditingAssignee ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            id={`dialog-task-${selectedTask.id}-assignee`}
                            value={editAssignee}
                            onChange={(e) => setEditAssignee(e.target.value)}
                            className="w-32 h-8 text-sm"
                            placeholder="担当者名"
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveAssignee}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">
                            {selectedTask.assignedTo ? selectedTask.assignedTo : "未確定"}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleAssigneeEdit}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 優先順位表示・編集エリア - 改善版 */}
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor={`dialog-task-${selectedTask.id}-priority`}
                      className="whitespace-nowrap flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500"></div>
                        <span>優先度</span>
                      </div>
                    </Label>
                    <div className="relative group">
                      <Input
                        id={`dialog-task-${selectedTask.id}-priority`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editPriority !== "" ? editPriority : (selectedTask.priority ?? 1)}
                        onChange={(e) => setEditPriority(e.target.value)}
                        onInput={(e) => {
                          // 矢印ボタンでの変更も検知
                          const value = (e.target as HTMLInputElement).value;
                          setEditPriority(value);
                          // 即座にDBに反映
                          const priorityValue = parseFloat(value);
                          if (!isNaN(priorityValue) && priorityValue >= 0 && onPriorityChange) {
                            onPriorityChange(selectedTask.id, priorityValue);
                          }
                        }}
                        onBlur={() => {
                          const priorityValue = parseFloat(editPriority || "1");
                          if (!isNaN(priorityValue) && priorityValue >= 0 && onPriorityChange) {
                            onPriorityChange(selectedTask.id, priorityValue);
                          } else {
                            // 無効な値の場合は元の値に戻す
                            setEditPriority((selectedTask.priority ?? 1).toString());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const priorityValue = parseFloat(editPriority || "1");
                            if (!isNaN(priorityValue) && priorityValue >= 0 && onPriorityChange) {
                              onPriorityChange(selectedTask.id, priorityValue);
                              e.currentTarget.blur();
                            }
                          }
                        }}
                        className="w-20 h-10 text-sm text-center border-2 border-transparent bg-gray-50 dark:bg-gray-800 rounded-lg 
                                 hover:border-blue-300 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700
                                 transition-all duration-200 ease-in-out
                                 group-hover:shadow-sm focus:shadow-md"
                        placeholder="1.0"
                      />
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 
                                    scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 優先度レベル表示 */}
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const currentPriority = editPriority !== "" 
                            ? parseFloat(editPriority) 
                            : (selectedTask.priority ?? 1);
                          const isActive = currentPriority >= level;
                          return (
                            <div
                              key={level}
                              className={`w-2 h-4 rounded-sm transition-all duration-200 ${
                                isActive 
                                  ? level <= 2 
                                    ? 'bg-green-400' 
                                    : level <= 4 
                                    ? 'bg-yellow-400' 
                                    : 'bg-red-400'
                                  : 'bg-gray-200 dark:bg-gray-600'
                              }`}
                            />
                          );
                        })}
                      </div>
                      {/* 優先度説明 */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(() => {
                          const currentPriority = editPriority !== "" 
                            ? parseFloat(editPriority) 
                            : (selectedTask.priority ?? 1);
                          if (currentPriority <= 2) return "低";
                          if (currentPriority <= 4) return "中";
                          return "高";
                        })()}
                      </div>
                    </div>
                  </div>

                  {selectedTask.status !== "未着手" && selectedTask.assignedTo && (
                    <div className="text-sm text-gray-500">担当者: {selectedTask.assignedTo}</div>
                  )}
                </div>

                {/* 進捗スライダー - 作業中のタスクのみ表示 */}
                {selectedTask.status === "作業中" && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`dialog-task-${selectedTask.id}-progress`}>進捗状況:</Label>
                      <span className="text-sm font-medium">{sliderValue}%</span>
                    </div>
                    <Slider
                      id={`dialog-task-${selectedTask.id}-progress`}
                      min={0}
                      max={100}
                      step={5}
                      value={[sliderValue]}
                      onValueChange={handleSliderChange}
                      onValueCommit={handleSliderCommit}
                      className="w-full"
                    />
                  </div>
                )}

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
                    {selectedTask.description ? (
                      <MarkdownRenderer content={selectedTask.description} />
                    ) : (
                      <p className="text-gray-500 italic">詳細はありません</p>
                    )}
                  </TabsContent>
                  <TabsContent value="comments" className="pt-4">
                    <TaskComments
                      taskId={selectedTask.id}
                      userName={userName}
                      onCommentWithoutName={onCommentWithoutName}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* タスク共有ダイアログ */}
      {selectedTask && (
        <TaskShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          taskId={selectedTask.id}
          listId={listId}
          taskTitle={selectedTask.title}
        />
      )}
    </div>
  )
}
