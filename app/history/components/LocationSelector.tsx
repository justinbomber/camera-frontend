"use client"

import { motion } from 'framer-motion'
import { MapPin, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Location {
  id: string
  name: string
  cameras: number[]
}

interface LocationSelectorProps {
  selectedLocation: string | null
  onLocationChange: (location: string | null) => void
}

const locations: Location[] = [
  { id: 'location1', name: '大門口', cameras: [1, 2, 3] },
  { id: 'location2', name: '停車場', cameras: [4, 5] },
  { id: 'location3', name: '辦公大樓', cameras: [6, 7, 8, 9] },
  { id: 'location4', name: '後門區域', cameras: [10, 11, 12] }
]

export default function LocationSelector({
  selectedLocation,
  onLocationChange
}: LocationSelectorProps) {
  
  const getSelectedLocationData = () => {
    return locations.find(loc => loc.id === selectedLocation)
  }

  return (
    <div className="space-y-4">
      {/* 提示文字 */}
      <div className="text-sm text-gray-300 text-center bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
        <div className="font-medium text-yellow-400 mb-1">請先選擇監控地點</div>
        <div className="text-xs text-gray-400">
          {selectedLocation ? `已選擇: ${getSelectedLocationData()?.name}` : '未選擇地點'}
        </div>
      </div>

      {/* 地點選擇列表 */}
      <div className="space-y-2">
        {locations.map((location) => {
          const isSelected = selectedLocation === location.id
          
          return (
            <motion.div
              key={location.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                onClick={() => onLocationChange(location.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' 
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

                {/* 地點圖標和名稱 */}
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{location.name}</span>
                </div>

                {/* 攝影機數量 */}
                <div className="text-xs text-gray-400">
                  {location.cameras.length} 個攝影機
                </div>

                {/* 選中狀態標籤 */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-medium"
                  >
                    已選
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 清除選擇按鈕 */}
      {selectedLocation && (
        <Button
          variant="outline"
          onClick={() => onLocationChange(null)}
          className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
        >
          清除地點選擇
        </Button>
      )}

      {/* 選擇摘要 */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30"
        >
          <div className="text-sm text-gray-300">
            <div className="flex items-center justify-between mb-2">
              <span>選擇的地點：</span>
              <span className="text-yellow-400 font-medium">
                {getSelectedLocationData()?.name}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              可用攝影機: {getSelectedLocationData()?.cameras.join(', ')}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export { locations }
export type { Location } 