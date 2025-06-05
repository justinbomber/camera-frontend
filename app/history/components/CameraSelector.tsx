"use client"

import { motion } from 'framer-motion'
import { Camera, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraSelectorProps {
  selectedCameras: number[]
  onCameraChange: (cameras: number[]) => void
  availableCameras: number[]
  locationName?: string
  isMobile?: boolean
}

export default function CameraSelector({
  selectedCameras,
  onCameraChange,
  availableCameras,
  locationName,
  isMobile = false
}: CameraSelectorProps) {
  const maxCameras = isMobile ? 1 : 2

  const toggleCamera = (cameraId: number) => {
    if (selectedCameras.includes(cameraId)) {
      // 移除攝影機
      const newSelection = selectedCameras.filter(id => id !== cameraId)
      onCameraChange(newSelection)
    } else {
      // 添加攝影機（最多2個）
      if (selectedCameras.length < maxCameras) {
        onCameraChange([...selectedCameras, cameraId].sort())
      }
    }
  }

  const selectAllCameras = () => {
    const maxSelectable = Math.min(availableCameras.length, maxCameras)
    onCameraChange(availableCameras.slice(0, maxSelectable))
  }

  const clearAllCameras = () => {
    onCameraChange([])
  }

  // 如果沒有可用攝影機，顯示提示
  if (availableCameras.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 mb-2">
          <Camera className="h-8 w-8 mx-auto mb-2" />
          請先選擇一個地點
        </div>
        <p className="text-sm text-gray-500">選擇地點後才能查看可用的攝影機</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 提示文字 */}
      <div className="text-sm text-gray-300 text-center bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
        <div className="font-medium text-yellow-400 mb-1">
          {locationName ? `${locationName} - 最多可選擇 ${maxCameras} 隻攝影機` : `最多可選擇 ${maxCameras} 隻攝影機`}
        </div>
        <div className="text-xs text-gray-400">
          已選擇 {selectedCameras.length} / {maxCameras} 個 (共 {availableCameras.length} 個可用)
        </div>
      </div>

      {/* 快速選擇按鈕 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllCameras}
          disabled={selectedCameras.length === maxCameras || availableCameras.length === 0}
          className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white disabled:opacity-50"
        >
          全選 (最多{maxCameras}個)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllCameras}
          disabled={selectedCameras.length === 0}
          className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white disabled:opacity-50"
        >
          清空
        </Button>
      </div>

      {/* 攝影機 checklist */}
      <div className="space-y-2">
        {availableCameras.map((cameraId) => {
          const isSelected = selectedCameras.includes(cameraId)
          const isDisabled = !isSelected && selectedCameras.length >= maxCameras
          
          return (
            <motion.div
              key={cameraId}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            >
              <div
                onClick={() => !isDisabled && toggleCamera(cameraId)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' 
                    : isDisabled
                    ? 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700/70 hover:border-gray-500'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  flex items-center justify-center w-5 h-5 rounded border-2 
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-yellow-400 border-yellow-400' 
                    : isDisabled
                    ? 'border-gray-600 bg-gray-700'
                    : 'border-gray-500 hover:border-gray-400'
                  }
                `}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-3 w-3 text-black" />
                    </motion.div>
                  )}
                </div>

                {/* 攝影機圖標和名稱 */}
                <div className="flex items-center gap-2 flex-1">
                  <Camera className="h-4 w-4" />
                  <span className="font-medium">攝影機 {cameraId}</span>
                </div>

                {/* 狀態標籤 */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-medium"
                  >
                    已選
                  </motion.div>
                )}
                
                {isDisabled && !isSelected && (
                  <div className="text-gray-500 text-xs px-2 py-1 rounded-full">
                    已滿
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 選擇摘要 */}
      {selectedCameras.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30"
        >
          <div className="text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>選擇的攝影機：</span>
              <span className="text-yellow-400 font-medium">
                {selectedCameras.map(id => `攝影機 ${id}`).join(', ')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 