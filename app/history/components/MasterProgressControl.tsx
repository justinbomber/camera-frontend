"use client"

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MasterProgressControlProps {
  currentTime: number // 0-100 百分比
  duration: number // 總長度（百分比）
  startTime: Date
  endTime: Date
  onTimeChange: (time: number) => void
  isPlaying: boolean
}

export default function MasterProgressControl({
  currentTime,
  duration,
  startTime,
  endTime,
  onTimeChange,
  isPlaying
}: MasterProgressControlProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localTime, setLocalTime] = useState(currentTime)

  // 進度條拖拽處理
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateProgress(e)
    document.addEventListener('mousemove', handleDocumentMouseMove)
    document.addEventListener('mouseup', handleDocumentMouseUp)
  }

  const handleDocumentMouseMove = (e: MouseEvent) => {
    if (isDragging && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setLocalTime(percentage)
    }
  }

  const handleDocumentMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      onTimeChange(localTime)
      document.removeEventListener('mousemove', handleDocumentMouseMove)
      document.removeEventListener('mouseup', handleDocumentMouseUp)
    }
  }

  const updateProgress = (e: React.MouseEvent) => {
    if (!progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setLocalTime(percentage)
  }

  // 格式化時間顯示
  const formatTimeDisplay = (percentage: number): string => {
    const totalMs = endTime.getTime() - startTime.getTime()
    const currentMs = (percentage / 100) * totalMs
    const currentDate = new Date(startTime.getTime() + currentMs)
    
    return currentDate.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 格式化持續時間
  const formatDuration = (): string => {
    const totalMs = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`
    } else {
      return `${minutes}分鐘`
    }
  }

  // 快速跳轉
  const jumpTo = (percentage: number) => {
    const newTime = Math.max(0, Math.min(100, percentage))
    onTimeChange(newTime)
  }

  // 同步外部時間到本地狀態
  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime)
    }
  }, [currentTime, isDragging])

  // 顯示的時間（拖拽時顯示本地時間，否則顯示實際時間）
  const displayTime = isDragging ? localTime : currentTime

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* 標題和時間信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-400 font-medium">
          <Clock className="h-5 w-5" />
          <span>主時間軸控制</span>
        </div>
        
        <div className="text-sm text-gray-300">
          總長度: {formatDuration()}
        </div>
      </div>

      {/* 主進度條 */}
      <div className="space-y-3">
        {/* 時間標籤 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {startTime.toLocaleTimeString('zh-TW', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          <span className="text-yellow-400 font-mono text-base">
            {formatTimeDisplay(displayTime)}
          </span>
          
          <span className="text-gray-400">
            {endTime.toLocaleTimeString('zh-TW', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* 進度條容器 */}
        <div
          ref={progressRef}
          className="relative h-3 bg-gray-600 rounded-full cursor-pointer group"
          onMouseDown={handleProgressMouseDown}
        >
          {/* 背景軌道 */}
          <div className="absolute inset-0 bg-gray-600 rounded-full" />
          
          {/* 已播放進度 */}
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full transition-all duration-150"
            style={{ width: `${displayTime}%` }}
            animate={{ width: `${displayTime}%` }}
            transition={{ duration: isDragging ? 0 : 0.15 }}
          />
          
          {/* 拖拽手柄 */}
          <motion.div 
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-yellow-400 rounded-full shadow-lg border-2 border-white cursor-grab active:cursor-grabbing transition-all duration-150"
            style={{ left: `calc(${displayTime}% - 10px)` }}
            animate={{ 
              left: `calc(${displayTime}% - 10px)`,
              scale: isDragging ? 1.2 : 1
            }}
            transition={{ duration: isDragging ? 0 : 0.15 }}
            whileHover={{ scale: 1.1 }}
          />
          
          {/* 時間標記線 */}
          <div className="absolute top-0 h-full flex justify-between px-1 pointer-events-none">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={i}
                className="w-px bg-gray-500/50 h-full"
              />
            ))}
          </div>
        </div>

        {/* 快速跳轉按鈕 */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpTo(0)}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              <SkipBack className="h-4 w-4 mr-1" />
              開始
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpTo(25)}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              25%
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpTo(50)}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              50%
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpTo(75)}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              75%
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpTo(100)}
              className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              結束
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* 播放狀態和同步提示 */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            <span>{isPlaying ? '播放中' : '已暫停'}</span>
          </div>
          
          <span>所有攝影機將同步到此時間點</span>
          
          <div className="text-yellow-400">
            {Math.round(displayTime)}%
          </div>
        </div>
      </div>
    </motion.div>
  )
} 