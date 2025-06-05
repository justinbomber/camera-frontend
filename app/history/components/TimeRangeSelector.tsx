"use client"

import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TimeRangeSelectorProps {
  startTime: Date
  endTime: Date
  onStartTimeChange: (time: Date) => void
  onEndTimeChange: (time: Date) => void
}

export default function TimeRangeSelector({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange
}: TimeRangeSelectorProps) {

  // 格式化日期時間為 HTML datetime-local 格式
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // 處理開始時間變更
  const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = new Date(event.target.value)
    onStartTimeChange(newStartTime)
    
    // 如果開始時間晚於結束時間，自動調整結束時間
    if (newStartTime >= endTime) {
      const newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000) // 加1小時
      onEndTimeChange(newEndTime)
    }
  }

  // 處理結束時間變更
  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = new Date(event.target.value)
    
    // 確保結束時間不早於開始時間
    if (newEndTime > startTime) {
      onEndTimeChange(newEndTime)
    }
  }

  // 快速時間範圍選擇
  const setQuickRange = (hours: number) => {
    const now = new Date()
    const newStartTime = new Date(now.getTime() - hours * 60 * 60 * 1000)
    onStartTimeChange(newStartTime)
    onEndTimeChange(now)
  }

  // 計算時間範圍
  const getDuration = (): string => {
    const durationMs = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}小時${minutes > 0 ? ` ${minutes}分鐘` : ''}`
    } else {
      return `${minutes}分鐘`
    }
  }

  return (
    <div className="space-y-4">
      {/* 快速選擇按鈕 */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickRange(1)}
          className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
        >
          最近1小時
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickRange(6)}
          className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
        >
          最近6小時
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickRange(24)}
          className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
        >
          最近24小時
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickRange(24 * 7)}
          className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
        >
          最近7天
        </Button>
      </div>

      {/* 詳細時間選擇 */}
      <div className="space-y-3">
        {/* 開始時間 */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            開始時間
          </label>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(startTime)}
            onChange={handleStartTimeChange}
            max={formatDateTimeLocal(new Date())}
            className="
              w-full px-3 py-2 rounded-md text-sm
              bg-gray-700 border border-gray-600 text-white
              focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none
              hover:border-gray-500 transition-colors
            "
          />
        </div>

        {/* 結束時間 */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            結束時間
          </label>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(endTime)}
            onChange={handleEndTimeChange}
            min={formatDateTimeLocal(startTime)}
            max={formatDateTimeLocal(new Date())}
            className="
              w-full px-3 py-2 rounded-md text-sm
              bg-gray-700 border border-gray-600 text-white
              focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none
              hover:border-gray-500 transition-colors
            "
          />
        </div>
      </div>

      {/* 時間範圍摘要 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30"
      >
        <div className="text-sm text-gray-300 space-y-1">
          <div className="flex items-center justify-between">
            <span>時間範圍：</span>
            <span className="text-yellow-400 font-medium">{getDuration()}</span>
          </div>
          <div className="text-xs text-gray-400">
            {startTime.toLocaleString('zh-TW')} 至 {endTime.toLocaleString('zh-TW')}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 