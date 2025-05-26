"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, ArrowLeft, User, Shield, Monitor, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Sidebar, { SidebarMode } from '@/components/Sidebar'
import { useDeviceDetection } from '@/lib/deviceUtils'

export default function SettingsPage() {
  const router = useRouter()
  const isMobile = useDeviceDetection()
  
  // sidebar 狀態管理，從 localStorage 讀取偏好設定
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-mode')
      if (saved && ['expanded', 'collapsed', 'hover'].includes(saved)) {
        return saved as SidebarMode
      }
    }
    return 'expanded'
  })
  
  // 保存 sidebar 模式到 localStorage
  const handleSidebarModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-mode', mode)
    }
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="text-gray-300 hover:text-white hover:bg-gray-700/80"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">系統設定</h1>
                    <p className="text-gray-300">管理應用程式偏好設定</p>
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
                      <Settings className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-white mb-4">功能開發中</h2>
                  <p className="text-gray-300 mb-8 max-w-md mx-auto">
                    設定功能正在開發中，您很快就能在這裡自訂各種系統設定和偏好選項。
                  </p>

                  {/* 預期功能預覽 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-medium text-white">個人資料</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        管理帳戶資訊和個人偏好
                      </p>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-medium text-white">安全設定</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        設定密碼和雙重驗證
                      </p>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Monitor className="h-5 w-5 text-purple-400" />
                        <h3 className="text-lg font-medium text-white">顯示設定</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        自訂界面主題和佈局
                      </p>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Wifi className="h-5 w-5 text-orange-400" />
                        <h3 className="text-lg font-medium text-white">連線設定</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        管理串流伺服器和連線
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
      </div>
    </AuthGuard>
  )
} 