"use client"

import { motion } from 'framer-motion'
import { Camera, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraSelectorProps {
  selectedCameras: number[]
  onCameraChange: (cameras: number[]) => void
  availableCameras: number[]
  locationName?: string
  maxCameras: number // 根據宮格布局動態設定最大攝影機數量
  gridLayout: 1 | 4 | 9 | 16 // 當前宮格布局
}

export default function CameraSelector({
  selectedCameras,
  onCameraChange,
  availableCameras,
  locationName,
  maxCameras,
  gridLayout
}: CameraSelectorProps) {

  const toggleCamera = (cameraId: number) => {
    if (selectedCameras.includes(cameraId)) {
      // 移除攝影機
      const newSelection = selectedCameras.filter(id => id !== cameraId)
      onCameraChange(newSelection)
    } else {
      // 添加攝影機（根據宮格限制）
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

  // 獲取宮格布局名稱
  const getGridLayoutName = () => {
    switch (gridLayout) {
      case 1: return '1x1'
      case 4: return '2x2'
      case 9: return '3x3'
      case 16: return '4x4'
      default: return `${gridLayout}格`
    }
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
      {/* 快速選擇按鈕 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllCameras}
          disabled={selectedCameras.length === maxCameras || availableCameras.length === 0}
          className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white disabled:opacity-50 text-xs py-1 h-7"
        >
          全選 (最多{maxCameras}個)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllCameras}
          disabled={selectedCameras.length === 0}
          className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white disabled:opacity-50 text-xs py-1 h-7"
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
                  flex items-center gap-2 p-2 rounded-lg border cursor-pointer
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
                  <Camera className="h-3 w-3" />
                  <span className="font-medium text-sm">攝影機 {cameraId}</span>
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


    </div>
  )
} 