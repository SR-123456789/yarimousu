/**
 * iOS WebViewとの連携のためのブリッジ関数
 * タスクIDをSwift側に送信します
 */
export function sendTaskIdToNative(taskId: string, action: "created" | "updated" | "deleted" = "created"): void {
  try {
    // iOS WebViewのメッセージハンドラが存在するか確認
    if (
      typeof window !== "undefined" &&
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.jsToSwift
    ) {
      // Swift側にメッセージを送信
      window.webkit.messageHandlers.jsToSwift.postMessage({
        type: "task",
        action: action,
        taskId: taskId,
      })
      console.log(`Task ID ${taskId} sent to native app (${action})`)
    } else {
      // 開発環境などでは単にログ出力
      console.log(`Native bridge not available. Would send task ID: ${taskId} (${action})`)
    }
  } catch (error) {
    console.error("Error sending message to native app:", error)
  }
}

// グローバルな型定義を拡張
declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        jsToSwift?: {
          postMessage: (message: any) => void
        }
      }
    }
  }
}
