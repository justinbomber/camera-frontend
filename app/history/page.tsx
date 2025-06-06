"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, ArrowLeft, Play, Pause, SkipBack, SkipForward, Settings, Camera, Clock, MapPin, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Sidebar, { SidebarMode } from '@/components/Sidebar'
import { useDeviceDetection } from '@/lib/deviceUtils'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import HistoryVideoPlayer from './components/HistoryVideoPlayer'
import TimeRangeSelector from './components/TimeRangeSelector'
import CameraSelector from './components/CameraSelector'
import LocationSelector, { locations } from './components/LocationSelector'
import MasterProgressControl from './components/MasterProgressControl'
import PhoneSidebar from '@/components/PhoneSidebar'
import UserMenu from '@/components/ui/UserMenu'

export default function HistoryPage() {
  const router = useRouter()
  const isMobile = useDeviceDetection()
  
  // 使用安全的 localStorage hook 避免 hydration 錯誤
  const [sidebarMode, setSidebarMode] = useLocalStorage<SidebarMode>('sidebar-mode', 'expanded')
  
  // 狀態管理
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedCameras, setSelectedCameras] = useState<number[]>([])
  const [startTime, setStartTime] = useState<Date>(new Date(Date.now() - 60 * 60 * 1000)) // 1小時前
  const [endTime, setEndTime] = useState<Date>(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // 0-100 百分比
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // 彈出panel狀態
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  
  // 手機端 sidebar 狀態
  const [isPhoneSidebarOpen, setIsPhoneSidebarOpen] = useState(false)
  
  // 保存 sidebar 模式到 localStorage
  const handleSidebarModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode)
  }

  // 根據選擇的地點獲取可用攝影機
  const getAvailableCameras = (): number[] => {
    if (!selectedLocation) return []
    const location = locations.find(loc => loc.id === selectedLocation)
    return location ? location.cameras : []
  }

  const getLocationName = (): string => {
    if (!selectedLocation) return ''
    const location = locations.find(loc => loc.id === selectedLocation)
    return location ? location.name : ''
  }

  // 當地點改變時，清空攝影機選擇
  const handleLocationChange = (locationId: string | null) => {
    setSelectedLocation(locationId)
    setSelectedCameras([]) // 清空攝影機選擇
  }

  // 搜尋歷史記錄
  const handleSearch = async () => {
    if (selectedCameras.length === 0 || !selectedLocation) return
    
    setIsSearching(true)
    
    // 模擬搜尋API調用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成模擬的搜尋結果
    const mockResults = selectedCameras.map(cameraId => ({
      cameraId,
      name: `攝影機 ${cameraId}`,
      url: `http://streamcamkeelong.mooo.com/stream/camera${cameraId}/history.m3u8?start=${startTime.getTime()}&end=${endTime.getTime()}`,
      duration: endTime.getTime() - startTime.getTime(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }))
    
    setSearchResults(mockResults)
    setIsSearching(false)
    setShowSearchPanel(false) // 搜尋完成後關閉panel
  }

  // 播放控制
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeChange = (newTime: number) => {
    setCurrentTime(newTime)
  }

  // 快進快退
  const skipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 5))
  }

  const skipForward = () => {
    setCurrentTime(Math.min(100, currentTime + 5))
  }

  // 判斷是否只有一個攝影機
  const isSingleCamera = searchResults.length === 1

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-black overflow-hidden">
        {/* Sidebar - 只在桌面版顯示 */}
        {!isMobile && (
          <Sidebar mode={sidebarMode} onModeChange={handleSidebarModeChange} />
        )}
        
        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 頂部導航欄 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-600/50 z-10"
          >
            <div className="flex items-center gap-3">
              {/* 手機端頭像按鈕 - 只在手機端顯示 */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPhoneSidebarOpen(true)}
                  className="hover:bg-gray-700/80 text-white rounded-full w-10 h-10 p-0 mr-2"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full shadow-lg border border-gray-600">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Button>
              )}
              
              {/* 桌面端返回按鈕 */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="text-gray-300 hover:text-white hover:bg-gray-700/80"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-yellow-400" />
                <span className="text-xl font-bold text-white">歷史影像</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 搜尋結果摘要 - 只在桌面端顯示 */}
              {searchResults.length > 0 && !isMobile && (
                <div className="text-sm text-gray-300">
                  {getLocationName()} • {selectedCameras.length} 個攝影機 • {startTime.toLocaleDateString('zh-TW')} ~ {endTime.toLocaleDateString('zh-TW')}
                </div>
              )}
              
              {/* 參數選擇按鈕 */}
              <Button
                variant="outline"
                onClick={() => setShowSearchPanel(true)}
                className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10 hover:text-yellow-300"
              >
                <Settings className="h-4 w-4 mr-2" />
                參數選擇
              </Button>
              
              {/* 用戶選單 - 只在桌面設備顯示 */}
              {!isMobile && (
                <UserMenu />
              )}
            </div>
          </motion.div>

          {/* 主要內容區域 */}
          <div className="flex-1 relative">
            {searchResults.length > 0 ? (
              <>
                {/* 影片播放區域 */}
                <div className={`h-full flex flex-col ${isSingleCamera ? '' : ''}`}>
                  <div className="flex-1 p-4 min-h-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${isSingleCamera ? 'max-h-[calc(100vh-160px)]' : 'max-h-[calc(100vh-320px)]'}`}
                    >
                      {isMobile ? (
                        // 手機端：16:9播放器，信息下置
                        <div className="flex flex-col p-4 space-y-4">
                          {/* 16:9視頻區域 */}
                          <div className="relative">
                            <HistoryVideoPlayer
                              key={selectedCameras[0]}
                              videoData={searchResults[0]}
                              isPlaying={isPlaying}
                              currentTime={currentTime}
                              onTimeChange={handleTimeChange}
                              isMobile={true}
                            />
                          </div>
                          
                          {/* 攝影機資訊區域 */}
                          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 p-3 rounded-xl">
                            <div className="text-center text-sm text-gray-300 space-y-1">
                              <div className="font-medium text-yellow-400">
                                {getLocationName()} • 攝影機 {selectedCameras[0]}
                              </div>
                              <div className="text-xs text-gray-400">
                                {startTime.toLocaleDateString('zh-TW')} {startTime.toLocaleTimeString('zh-TW', {hour: '2-digit', minute: '2-digit'})} ~ 
                                {endTime.toLocaleDateString('zh-TW')} {endTime.toLocaleTimeString('zh-TW', {hour: '2-digit', minute: '2-digit'})}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isSingleCamera ? (
                        // 桌面端單一攝影機：置中且放大
                        <div className="h-full flex items-center justify-center">
                          <div className="w-4/5 h-full max-w-4xl">
                            <HistoryVideoPlayer
                              videoData={searchResults[0]}
                              isPlaying={isPlaying}
                              currentTime={currentTime}
                              onTimeChange={handleTimeChange}
                              isMobile={false}
                            />
                          </div>
                        </div>
                      ) : (
                        // 桌面端多攝影機：2列grid佈局
                        <div className="h-full grid grid-cols-2 gap-3">
                          {searchResults.map((result, index) => (
                            <div key={result.cameraId} className="w-full h-full">
                              <HistoryVideoPlayer
                                videoData={result}
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                onTimeChange={handleTimeChange}
                                isMobile={false}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* 底部控制面板 - 只在桌面端多攝影機時顯示總時間軸 */}
                  {!isSingleCamera && !isMobile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-600/50 p-3 flex-shrink-0"
                    >
                      {/* 播放控制按鈕 */}
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={skipBackward}
                          className="text-white border-gray-600 hover:bg-gray-700"
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="lg"
                          onClick={togglePlayPause}
                          className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all duration-200 px-8"
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={skipForward}
                          className="text-white border-gray-600 hover:bg-gray-700"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 主進度條 */}
                      <MasterProgressControl
                        currentTime={currentTime}
                        duration={100}
                        startTime={startTime}
                        endTime={endTime}
                        onTimeChange={handleTimeChange}
                        isPlaying={isPlaying}
                      />
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              /* 空狀態 - 歡迎畫面 */
              <div className="h-full flex items-center justify-center p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center max-w-md"
                >
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-700/50 rounded-full">
                      <History className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-white mb-4">歷史影像查詢</h2>
                  <p className="text-gray-300 mb-8">
                    點擊右上角的「參數選擇」開始查看歷史錄影
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                      <MapPin className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <h4 className="text-white font-medium mb-1">多地點支援</h4>
                      <p className="text-gray-300 text-sm">選擇不同監控地點</p>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                      <Camera className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <h4 className="text-white font-medium mb-1">{isMobile ? '單攝影機模式' : '雙攝影機支援'}</h4>
                      <p className="text-gray-300 text-sm">{isMobile ? '專注查看單一攝影機' : '同時查看最多2個攝影機'}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* 參數選擇面板 */}
        <AnimatePresence>
          {showSearchPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSearchPanel(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                className="bg-gray-800 rounded-2xl border border-gray-600 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Panel 標題 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg">
                      <Settings className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">參數選擇</h2>
                      <p className="text-gray-400 text-sm">選擇地點、攝影機和時間範圍</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearchPanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Panel 內容 */}
                <div className="p-6 space-y-6">
                  {/* 地點選擇 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-400 font-medium">
                      <MapPin className="h-5 w-5" />
                      <span>選擇監控地點</span>
                    </div>
                    <LocationSelector
                      selectedLocation={selectedLocation}
                      onLocationChange={handleLocationChange}
                    />
                  </div>

                  {/* 分隔線 */}
                  <div className="border-t border-gray-600/50"></div>

                  {/* 攝影機選擇 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-400 font-medium">
                      <Camera className="h-5 w-5" />
                      <span>選擇攝影機 (最多{isMobile ? '1' : '2'}個)</span>
                    </div>
                    <CameraSelector
                      selectedCameras={selectedCameras}
                      onCameraChange={setSelectedCameras}
                      availableCameras={getAvailableCameras()}
                      locationName={getLocationName()}
                      isMobile={isMobile}
                    />
                  </div>

                  {/* 分隔線 */}
                  <div className="border-t border-gray-600/50"></div>

                  {/* 時間範圍選擇 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-400 font-medium">
                      <Clock className="h-5 w-5" />
                      <span>時間範圍</span>
                    </div>
                    <TimeRangeSelector
                      startTime={startTime}
                      endTime={endTime}
                      onStartTimeChange={setStartTime}
                      onEndTimeChange={setEndTime}
                    />
                  </div>
                </div>

                {/* Panel 底部按鈕 */}
                <div className="flex gap-3 p-6 border-t border-gray-600/50">
                  <Button
                    variant="outline"
                    onClick={() => setShowSearchPanel(false)}
                    className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || selectedCameras.length === 0 || !selectedLocation}
                    className="flex-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all duration-200"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>搜尋中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>開始搜尋</span>
                      </div>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 手機端 Sidebar */}
        {isMobile && (
          <PhoneSidebar 
            isOpen={isPhoneSidebarOpen} 
            onClose={() => setIsPhoneSidebarOpen(false)} 
          />
        )}
      </div>
    </AuthGuard>
  )
} 