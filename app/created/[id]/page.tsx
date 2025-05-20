/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"
import { generateQRCodeUrl } from "@/lib/utils"
import { sendTaskIdToNative } from "@/lib/native-bridge"

export default function TaskCreatedPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [copied, setCopied] = useState(false)

  const taskUrl = typeof window !== "undefined" ? `${window.location.origin}/tasks/${id}` : ""
  const qrCodeUrl = generateQRCodeUrl(taskUrl)

  useEffect(() => {
    // ページロード時にSwift側にタスクIDを送信
    sendTaskIdToNative(id, "created")

    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied, id])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(taskUrl)
    setCopied(true)
  }

  const viewTaskList = () => {
    router.push(`/tasks/${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <h1 className="text-xl md:text-2xl font-bold text-center">タスクリストを作成しました</h1>

            <p className="text-center text-gray-600 dark:text-gray-300">
              このリンクを共有してタスクリストにアクセスできます
            </p>

            <div className="flex items-center space-x-2">
              <Input value={taskUrl} readOnly className="flex-1 text-sm" />
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

            <div className="flex justify-center py-2 md:py-4">
              <img src={qrCodeUrl || "/placeholder.svg"} alt="QRコード" className="h-36 w-36 md:h-48 md:w-48" />
            </div>

            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={viewTaskList}>
              タスクリストを表示
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
