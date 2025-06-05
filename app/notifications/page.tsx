"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, ArrowLeft, AlertCircle, Info, CheckCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Sidebar, { SidebarMode } from '@/components/Sidebar'
import { useDeviceDetection } from '@/lib/deviceUtils'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import PhoneSidebar from '@/components/PhoneSidebar'

export default function NotificationsPage() {
  const router = useRouter()
  const isMobile = useDeviceDetection()
  
  // 使用安全的 localStorage hook 避免 hydration 錯誤
  const [sidebarMode, setSidebarMode] = useLocalStorage<SidebarMode>('sidebar-mode', 'expanded')
  
  // 手機端 sidebar 狀態
  const [isPhoneSidebarOpen, setIsPhoneSidebarOpen] = useState(false)

  // 保存 sidebar 模式到 localStorage
  const handleSidebarModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode)
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-black overflow-hidden">
        {/* Sidebar - 只在桌面版顯示 */}
        {!isMobile && (
          <Sidebar mode={sidebarMode} onModeChange={handleSidebarModeChange} />
        )}
        
        {/* 主內容區域 */}
        <div className="flex-1 overflow-hidden">
          <div className="min-h-screen">
            <div className="container mx-auto px-6 py-8">
              {/* 頁面標題 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4 mb-8"
              >
                {/* 手機端頭像按鈕 - 只在手機端顯示 */}
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPhoneSidebarOpen(true)}
                    className="hover:bg-gray-700/80 text-white rounded-full w-10 h-10 p-0"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full shadow-lg border border-gray-600">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </Button>
                )}
                
                {/* 桌面端返回按鈕 */}
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-gray-300 hover:text-white hover:bg-gray-700/80"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">通知中心</h1>
                    <p className="text-gray-300">管理系統通知和警報</p>
                  </div>
                </div>
              </motion.div>

              {/* 預留內容區域 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600/50 p-8 shadow-xl"
              >
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-700/50 rounded-full">
                      <Bell className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-white mb-4">功能開發中</h2>
                  <p className="text-gray-300 mb-8 max-w-md mx-auto">
                    通知系統正在開發中，您很快就能在這裡接收和管理所有重要的系統通知。
                  </p>

                  {/* 預期功能預覽 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <h3 className="text-lg font-medium text-white">警報通知</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        即時接收設備異常和安全警報
                      </p>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Info className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-medium text-white">系統訊息</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        接收系統更新和維護通知
                      </p>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-medium text-white">狀態更新</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        追蹤設備連線和運作狀態
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/mainpage')}
                    className="mt-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all duration-200"
                  >
                    返回即時影像
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* 手機端 Sidebar */}
        {isMobile && (
          <PhoneSidebar 
            isOpen={isPhoneSidebarOpen} 
            onClose={() => setIsPhoneSidebarOpen(false)} 
          />
        )}
      </div>
    </AuthGuard>
  )
} 