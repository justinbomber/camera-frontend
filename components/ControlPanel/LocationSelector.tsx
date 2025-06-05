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
  { id: 'location1', name: '基隆港區', cameras: [1, 2, 3, 4, 5, 6, 7, 8] }
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
                onClick={() => onLocationChange(isSelected ? null : location.id)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-400' 
                    : 'bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/70 hover:border-yellow-400/40'
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
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium text-sm">{location.name}</span>
                </div>

                {/* 攝影機數量 */}
                <div className="text-xs text-yellow-400/70">
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
          className="w-full text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10 hover:text-yellow-300 text-sm py-2 h-8"
        >
          清除地點選擇
        </Button>
      )}


    </div>
  )
}

export { locations }
export type { Location } 