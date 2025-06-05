"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Monitor, 
  History, 
  Bell, 
  Settings, 
  X,
  User,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthService } from '@/lib/authService'

interface PhoneSidebarItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  isActive?: boolean
}

interface PhoneSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const PhoneSidebar: React.FC<PhoneSidebarProps> = ({ isOpen, onClose, className = '' }) => {
  const router = useRouter()
  const pathname = usePathname()
  
  // 獲取當前用戶信息
  const currentUser = AuthService.getCurrentUser()
  
  // 導航項目
  const navigationItems: PhoneSidebarItem[] = [
    {
      id: 'live',
      icon: Monitor,
      label: '即時影像',
      path: '/mainpage',
      isActive: pathname === '/mainpage' || pathname === '/'
    },
    {
      id: 'history',
      icon: History,
      label: '歷史影像',
      path: '/history',
      isActive: pathname === '/history'
    },
    {
      id: 'notifications',
      icon: Bell,
      label: '通知',
      path: '/notifications',
      isActive: pathname === '/notifications'
    },
    {
      id: 'settings',
      icon: Settings,
      label: '設定',
      path: '/settings',
      isActive: pathname === '/settings'
    }
  ]
  
  // 處理導航
  const handleNavigation = (item: PhoneSidebarItem) => {
    // 如果是導航到 mainpage，清除相關的 sessionStorage 來觸發重新初始化
    if (item.path === '/mainpage') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('mainpage-initialized')
      }
    }
    
    router.push(item.path)
    onClose() // 導航後關閉 sidebar
  }
  
  // 處理登出
  const handleLogout = async () => {
    try {
      await AuthService.logout()
      router.push('/login')
      onClose()
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }
  
  return (
    <>
      {/* 遮罩層 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar 主體 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            className={`fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-600/50 z-[201] flex flex-col shadow-2xl ${className}`}
          >
            {/* 頂部用戶區域 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg">
                    <User className="h-6 w-6 text-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {currentUser?.email?.split('@')[0] || '用戶'}
                    </h3>
                    <p className="text-gray-400 text-sm">已登入</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/80 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* monitor.hub 標題 */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-yellow-400">monitor.hub</h2>
                <p className="text-gray-400 text-sm mt-1">監控系統</p>
              </div>
            </div>
            
            {/* 導航區域 */}
            <div className="flex-1 py-4">
              <nav className="space-y-2 px-4">
                {navigationItems.map((item) => (
                  <PhoneSidebarButton
                    key={item.id}
                    item={item}
                    onClick={() => handleNavigation(item)}
                  />
                ))}
              </nav>
            </div>
            
            {/* 底部登出區域 */}
            <div className="p-4 border-t border-gray-700/50">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 py-3"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="text-base font-medium">登出</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Sidebar 按鈕組件
interface PhoneSidebarButtonProps {
  item: PhoneSidebarItem
  onClick: () => void
}

const PhoneSidebarButton: React.FC<PhoneSidebarButtonProps> = ({ item, onClick }) => {
  const Icon = item.icon
  
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start py-3 transition-all duration-200 ${
        item.isActive 
          ? 'bg-yellow-500/20 text-yellow-400 border-l-4 border-yellow-500' 
          : 'text-gray-300 hover:text-white hover:bg-gray-700/80'
      }`}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span className="text-base font-medium">{item.label}</span>
    </Button>
  )
}

export default PhoneSidebar 