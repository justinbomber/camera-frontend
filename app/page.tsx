"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoadingScreen from "@/components/ui/loading-screen"
import { useDeviceDetection } from "@/lib/deviceUtils"
import { AuthService } from "@/lib/authService"

export default function HomePage() {
  const router = useRouter()
  const isMobile = useDeviceDetection()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // 標記 hydration 完成
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // 只有在 hydration 完成後才進行重定向邏輯
    if (!isHydrated || isRedirecting) return

    const handleRedirect = () => {
      try {
        console.log('根路由: 開始認證檢查')
        setIsRedirecting(true)
        
        // 檢查用戶認證狀態
        const isAuthenticated = AuthService.isAuthenticated()
        
        console.log('根路由: 認證檢查結果:', isAuthenticated)
        
        if (isAuthenticated) {
          console.log('根路由: 用戶已登入，導向到主頁面')
          router.replace('/mainpage')
        } else {
          console.log('根路由: 用戶未登入，導向到登入頁面')
          router.replace('/login')
        }
      } catch (error) {
        console.error('根路由: 認證檢查失敗:', error)
        // 發生錯誤時導向到登入頁面
        router.replace('/login')
      }
    }

    // 短暫延遲以確保頁面完全載入
    const timer = setTimeout(handleRedirect, 500)

    return () => clearTimeout(timer)
  }, [router, isRedirecting, isHydrated])

  // 在 hydration 完成前顯示載入畫面，使用預設的 isMobile 值
  return (
    <LoadingScreen 
      message="正在啟動 monitor.hub..." 
      isMobile={isHydrated ? isMobile : false} 
    />
  )
} 