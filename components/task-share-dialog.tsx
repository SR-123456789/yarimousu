/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { generateQRCodeUrl } from "@/lib/utils"

interface TaskShareDialogProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  listId: string
  taskTitle: string
}

export function TaskShareDialog({ isOpen, onClose, taskId, listId, taskTitle }: TaskShareDialogProps) {
  const [copied, setCopied] = useState(false)

  // タスクへの直接リンク
  const taskUrl = typeof window !== "undefined" ? `${window.location.origin}/tasks/${listId}?task=${taskId}` : ""
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>タスクを共有</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-500">「{taskTitle}」へのリンクを共有して、他の人とタスクを共有できます。</p>
          <div className="space-y-2">
            <Label>共有リンク</Label>
            <div className="flex">
              <Input value={taskUrl} readOnly className="flex-1" />
              <Button variant="outline" className="ml-2" onClick={copyToClipboard}>
                {copied ? "コピー済み" : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex justify-center py-4">
            <img src={qrCodeUrl || "/placeholder.svg"} alt="QRコード" className="w-48 h-48" />
          </div>
          <p className="text-xs text-center text-gray-500">
            このQRコードをスキャンするか、リンクを共有してタスクにアクセスできます
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
