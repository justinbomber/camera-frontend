"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Monitor, 
  History, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  PanelLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type SidebarMode = 'expanded' | 'collapsed' | 'hover'

interface SidebarItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  isActive?: boolean
}

interface SidebarProps {
  mode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ mode, onModeChange, className = '' }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  
  // 判斷是否應該展開
  const shouldExpand = mode === 'expanded' || (mode === 'hover' && isHovered)
  
  // 導航項目
  const topItems: SidebarItem[] = [
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
    }
  ]
  
  const bottomItems: SidebarItem[] = [
    {
      id: 'settings',
      icon: Settings,
      label: '設定',
      path: '/settings',
      isActive: pathname === '/settings'
    }
  ]
  
  // 處理導航
  const handleNavigation = (item: SidebarItem) => {
    // 如果是導航到 mainpage，清除相關的 sessionStorage 來觸發重新初始化
    if (item.path === '/mainpage') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('mainpage-initialized')
      }
      // 如果是即時影像，直接跳轉到 mainpage
      router.push('/mainpage')
    } else {
      // 其他頁面跳轉到預留頁面
      router.push(item.path)
    }
  }
  
  // 模式選擇器選項
  const modeOptions = [
    { id: 'expanded', label: '完全展開', description: '顯示圖示和文字' },
    { id: 'collapsed', label: '僅顯示圖示', description: '節省空間' },
    { id: 'hover', label: '懸停展開', description: '滑鼠懸停時展開' }
  ]
  
  return (
    <>
      <motion.div
        className={`fixed left-0 top-0 h-full bg-gray-800/95 backdrop-blur-sm border-r border-gray-600/50 z-[100] flex flex-col shadow-xl ${className}`}
        initial={false}
        animate={{
          width: shouldExpand ? 240 : 64
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setShowModeSelector(false)
        }}
      >
        {/* 頂部導航項目 */}
        <div className="flex-1 pt-4">
          <div className="space-y-2 px-2">
            {topItems.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                isExpanded={shouldExpand}
                onClick={() => handleNavigation(item)}
              />
            ))}
          </div>
        </div>
        
        {/* 底部項目 */}
        <div className="pb-4">
          <div className="space-y-2 px-2">
            {/* 設定按鈕 */}
            {bottomItems.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                isExpanded={shouldExpand}
                onClick={() => handleNavigation(item)}
              />
            ))}
            
            {/* Sidebar 控制按鈕 */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200 ${
                  shouldExpand ? 'px-3' : 'px-0 justify-center'
                }`}
                onClick={() => setShowModeSelector(!showModeSelector)}
              >
                <PanelLeft className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {shouldExpand && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="ml-3 text-sm font-medium"
                    >
                      Sidebar 控制
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              
              {/* 模式選擇器下拉選單 */}
              <AnimatePresence>
                {showModeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-gray-600 py-2 z-[200]"
                  >
                    <div className="px-3 py-2 border-b border-gray-600">
                      <h3 className="text-sm font-medium text-white">Sidebar 模式</h3>
                    </div>
                    {modeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          onModeChange(option.id as SidebarMode)
                          setShowModeSelector(false)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors ${
                          mode === option.id ? 'bg-gray-700/50 border-l-2 border-yellow-500' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-white">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.description}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* 為 sidebar 騰出空間的佔位符 */}
      <div 
        className="flex-shrink-0 transition-all duration-300 ease-in-out"
        style={{ width: shouldExpand ? 240 : 64 }}
      />
    </>
  )
}

// Sidebar 按鈕組件
interface SidebarButtonProps {
  item: SidebarItem
  isExpanded: boolean
  onClick: () => void
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ item, isExpanded, onClick }) => {
  const Icon = item.icon
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`w-full justify-start transition-all duration-200 ${
        item.isActive 
          ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-500' 
          : 'text-gray-300 hover:text-white hover:bg-gray-700/80'
      } ${isExpanded ? 'px-3' : 'px-0 justify-center'}`}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="ml-3 text-sm font-medium"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}

export default Sidebar 