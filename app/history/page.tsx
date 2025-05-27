"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, ArrowLeft, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Sidebar, { SidebarMode } from '@/components/Sidebar'
import { useDeviceDetection } from '@/lib/deviceUtils'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

export default function HistoryPage() {
  const router = useRouter()
  const isMobile = useDeviceDetection()
  
  // 使用安全的 localStorage hook 避免 hydration 錯誤
  const [sidebarMode, setSidebarMode] = useLocalStorage<SidebarMode>('sidebar-mode', 'expanded')
  
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="text-gray-300 hover:text-white hover:bg-gray-700/80"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">歷史影像</h1>
                    <p className="text-gray-300">查看過往的監控錄影</p>
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
                      <History className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-white mb-4">功能開發中</h2>
                  <p className="text-gray-300 mb-8 max-w-md mx-auto">
                    歷史影像功能正在開發中，您很快就能在這裡查看和管理所有的歷史錄影檔案。
                  </p>

                  {/* 預期功能預覽 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-medium text-white">日期瀏覽</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        按日期快速查找特定時間點的錄影檔案
                      </p>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-medium text-white">時間軸播放</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        使用時間軸快速跳轉到任意時間點
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