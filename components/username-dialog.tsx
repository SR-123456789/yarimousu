"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ユーザー名をlocalStorageから取得する関数
const getUserNameFromStorage = (): string => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("yarimaus_username") || ""
}

interface UsernameDialogProps {
  isOpen: boolean
  onClose: (username?: string) => void
}

export function UsernameDialog({ isOpen, onClose }: UsernameDialogProps) {
  const [username, setUsername] = useState("")

  // ダイアログが開かれたときにlocalStorageから名前を読み込む
  useEffect(() => {
    if (isOpen) {
      const storedName = getUserNameFromStorage()
      if (storedName) {
        setUsername(storedName)
      }
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose(username.trim() || "匿名")
  }

  const handleSkip = () => {
    onClose("匿名")
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>お名前を入力してください</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">お名前（任意）</Label>
              <Input
                id="username"
                placeholder="あなたの名前を入力してください"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <p className="text-sm text-gray-500">名前を入力しない場合は「匿名」として記録されます</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleSkip} className="sm:order-1">
              スキップ
            </Button>
            <Button type="submit" className="sm:order-2">
              確定
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
