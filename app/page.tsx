"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoadingScreen from "@/components/ui/loading-screen"
import { useDeviceDetection } from "@/lib/deviceUtils"

export default function HomePage() {
  const router = useRouter()
  const isMobile = useDeviceDetection()

  useEffect(() => {
    // 短暫延遲後重定向到主頁面
    const timer = setTimeout(() => {
      router.replace('/mainpage')
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return <LoadingScreen message="正在啟動 Streaminghub..." isMobile={isMobile} />
} 