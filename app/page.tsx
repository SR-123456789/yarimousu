"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Share2, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getTaskListHistory } from "@/app/tasks/[id]/page"

type TaskListHistoryItem = {
  id: string;
  title: string;
  lastAccessed: number;
};

export default function Home() {
  const [recentTaskLists, setRecentTaskLists] = useState<TaskListHistoryItem[]>([])

  useEffect(() => {
    // 最近開いたタスクリストを取得
    const history = getTaskListHistory()
    setRecentTaskLists(history)
  }, [])
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col items-center text-center space-y-8 py-12">
        <div className="flex items-center space-x-2">
          <div className="w-16 h-16 relative">
            <Image src="/yarimaus-icon.png" alt="やりまぅす" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">やりまぅす</h1>
        </div>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
          ログイン不要・匿名対応のタスク共有アプリ。URLを送るだけでタスクリストを共有でき、誰でもそのURLからタスクの確認・追加・編集・削除・進捗管理が可能です。
        </p>
        <Link href="/new" className="w-full sm:w-auto">
          <Button size="lg" className="mt-6 bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
            新しいタスクリストを作成 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 最近開いたタスクリスト */}
      {recentTaskLists.length > 0 && (
        <div className="py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-6 px-6">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">最近開いたタスクリスト</h2>
            <div className="ml-auto">
              <span className="text-sm text-gray-500">{recentTaskLists.length}件</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
            {recentTaskLists.slice(0, 6).map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm truncate flex-1 pr-2">
                      {item.title}
                    </h3>
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {new Date(item.lastAccessed).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <Link href={`/tasks/${item.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600">
                        開く
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {recentTaskLists.length > 6 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">他 {recentTaskLists.length - 6} 件のタスクリスト</p>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 md:gap-8 py-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
          <CheckCircle className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">シンプルで使いやすい</h3>
          <p className="text-gray-600 dark:text-gray-300">ログイン不要で、すぐにタスクリストを作成・共有できます。</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
          <Share2 className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">簡単に共有</h3>
          <p className="text-gray-600 dark:text-gray-300">
            URLを送るだけで、誰でもタスクリストにアクセスして編集できます。
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center">
          <div className="h-12 w-12 relative mb-4">
            <Image src="/yarimaus-icon.png" alt="やりまぅす" width={48} height={48} className="object-contain" />
          </div>
          <h3 className="text-xl font-medium mb-2">匿名で操作</h3>
          <p className="text-gray-600 dark:text-gray-300">匿名でタスクの追加・編集・削除・進捗管理が可能です。</p>
        </div>
      </div>
    </div>
  )
}
