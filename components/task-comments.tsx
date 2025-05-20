"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"

type Comment = {
  id: number
  taskId: string
  userName: string
  content: string
  createdAt: string
}

interface TaskCommentsProps {
  taskId: string
  userName: string
  onCommentWithoutName?: () => boolean
}

export function TaskComments({ taskId, userName, onCommentWithoutName }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/comments`)

        if (!isMountedRef.current) return

        if (response.ok) {
          const data = await response.json()
          setComments(data.comments)
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchComments()

    return () => {
      isMountedRef.current = false
    }
  }, [taskId])

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    // ユーザー名が未入力の場合、親コンポーネントに通知
    if (onCommentWithoutName && !userName) {
      const shouldStop = onCommentWithoutName()
      if (shouldStop) return
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          userName: userName || "匿名",
        }),
      })

      if (response.ok) {
        const { comment } = await response.json()
        setComments((prevComments) => [...prevComments, comment])
        setNewComment("")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-center py-4">コメントを読み込み中...</p>
      ) : comments.length === 0 ? (
        <p className="text-center py-4 text-gray-500">コメントはまだありません</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-8 w-8 bg-blue-100 text-blue-500">
                <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline">
                  <p className="font-medium text-sm">{comment.userName}</p>
                  <span className="ml-2 text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex space-x-2 pt-2">
        <Textarea
          placeholder={`コメントを入力（${userName || "匿名"}として投稿されます）`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
          rows={2}
        />
        <Button
          className="self-end bg-blue-500 hover:bg-blue-600"
          size="icon"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
