/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"
import { generateQRCodeUrl } from "@/lib/utils"

interface TaskCreatedDialogProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export function TaskCreatedDialog({ isOpen, onClose, taskId }: TaskCreatedDialogProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const taskUrl = typeof window !== "undefined" ? `${window.location.origin}/tasks/${taskId}` : `/tasks/${taskId}`

  const qrCodeUrl = generateQRCodeUrl(taskUrl)

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(taskUrl)
    setCopied(true)
  }

  const viewTaskList = () => {
    router.push(`/tasks/${taskId}`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">タスクリストを作成しました</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          <p className="text-center text-gray-600 dark:text-gray-300">
            このリンクを共有してタスクリストにアクセスできます
          </p>

          <div className="flex w-full items-center space-x-2">
            <Input value={taskUrl} readOnly className="flex-1" />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              className={copied ? "bg-green-100 text-green-600" : ""}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center">
            <img src={qrCodeUrl || "/placeholder.svg"} alt="QRコード" className="h-48 w-48" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" className="w-full" onClick={viewTaskList}>
            タスクリストを表示
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
