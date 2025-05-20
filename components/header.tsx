"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMouseNearTop, setIsMouseNearTop] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // ページ上部にいる場合は常に表示
      if (currentScrollY < 10) {
        setIsVisible(true)
      } else {
        // 上スクロールで表示、下スクロールで非表示
        setIsVisible(currentScrollY < lastScrollY)
      }

      setLastScrollY(currentScrollY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      // マウスが画面上部から50px以内にある場合
      setIsMouseNearTop(e.clientY < 50)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [lastScrollY])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-transform duration-300",
        {
          "translate-y-0": isVisible || isMouseNearTop,
          "-translate-y-full": !isVisible && !isMouseNearTop,
        },
      )}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 relative">
            <Image src="/yarimaus-icon.png" alt="やりまぅす" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-semibold text-blue-500">やりまぅす</span>
        </Link>

        {/* デスクトップナビゲーション */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/new" className="text-sm text-blue-500 hover:text-blue-600">
            新規作成
          </Link>
        </div>

        {/* モバイルナビゲーション */}
        <div className="md:hidden flex items-center">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col space-y-4 mt-8">
                <Link
                  href="/new"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4 text-blue-500" />
                  <span>新規作成</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
