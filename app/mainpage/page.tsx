"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Plus, Trash2, Menu, Square, Grid2X2, Grid3X3, LayoutGrid, User, LogOut, ChevronDown, MapPin, Camera, Settings, Monitor } from "lucide-react"
import { useRouter } from 'next/navigation'
import StreamGrid from "@/components/StreamGrid"
import ControlPanel from "@/components/ControlPanel"
import AddStreamDialog from "@/components/AddStreamDialog"
import MobileStreamPlayer from "@/components/MobileStreamPlayer"
import LoadingScreen from "@/components/ui/loading-screen"
import Sidebar, { SidebarMode } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { useDeviceDetection } from "@/lib/deviceUtils"
import { Grid4x4Icon } from "@/components/ui/grid4x4-icon"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { AuthService } from "@/lib/authService"
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import LocationSelector, { locations } from "@/components/ControlPanel/LocationSelector"
import CameraSelector from "@/components/ControlPanel/CameraSelector"
import PhoneSidebar from "@/components/PhoneSidebar"

// Default streams to load on initial page load
const STREAM_ENDPOINT = process.env.NEXT_PUBLIC_STREAM_ENDPOINT || "http://streamcamkeelong.mooo.com"

// 檢測是否在開發環境且需要使用代理
const isDev = process.env.NODE_ENV === 'development'
const isExternal = STREAM_ENDPOINT.includes('streamcamkeelong.mooo.com')
const useProxy = isDev && isExternal

// 決定實際使用的端點
const ACTUAL_ENDPOINT = useProxy ? '/api/proxy/stream' : STREAM_ENDPOINT

// 調試用：顯示當前使用的端點
console.log('原始串流端點:', STREAM_ENDPOINT)
console.log('實際使用端點:', ACTUAL_ENDPOINT)
console.log('是否使用代理:', useProxy)

const DEFAULT_STREAMS = [
  `${ACTUAL_ENDPOINT}/camera001`,
  `${ACTUAL_ENDPOINT}/camera002`,
  `${ACTUAL_ENDPOINT}/camera003`,
  `${ACTUAL_ENDPOINT}/camera004`,
  `${ACTUAL_ENDPOINT}/camera005`,
  `${ACTUAL_ENDPOINT}/camera006`,
  `${ACTUAL_ENDPOINT}/camera007`,
  `${ACTUAL_ENDPOINT}/camera008`
]

export default function MonitoringDashboard() {
  const router = useRouter()
  
  // State to track streams in the grid
  const [streams, setStreams] = useState<(string | null)[]>(Array(9).fill(null))
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveMode, setIsRemoveMode] = useState(false)
  // 新增選中要移除的串流索引陣列
  const [selectedForRemoval, setSelectedForRemoval] = useState<number[]>([])
  // 控制面板開關狀態
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  // 網格布局
  const [gridLayout, setGridLayout] = useState<1 | 4 | 9 | 16>(9)
  // 新增：攝影機顯示狀態管理
  const [cameraVisibility, setCameraVisibility] = useState<{ [key: number]: boolean }>({})
  // 新增：初始載入狀態 - 修復 hydration 錯誤
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  // 新增：手機端攝影機切換索引
  const [currentMobileStreamIndex, setCurrentMobileStreamIndex] = useState<number>(0)

  // 使用安全的 localStorage hook 避免 hydration 錯誤
  const [sidebarMode, setSidebarMode] = useLocalStorage<SidebarMode>('sidebar-mode', 'expanded')
  // 新增：參數選擇狀態
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedCameras, setSelectedCameras] = useState<number[]>([])
  const [streamingCameras, setStreamingCameras] = useState<{ [key: number]: string }>({}) // 將攝影機ID映射到stream URL
  
  // 使用新的設備檢測 Hook
  const isMobile = useDeviceDetection()
  
  // 新增：獲取當前用戶信息
  const currentUser = AuthService.getCurrentUser()
  
  // 新增：手機端 sidebar 狀態
  const [isPhoneSidebarOpen, setIsPhoneSidebarOpen] = useState(false)
  
  // 新增：自動初始化功能（從其他頁面切回時）
  useEffect(() => {
    // 檢查是否需要自動初始化
    if (typeof window !== 'undefined') {
      const isInitialized = sessionStorage.getItem('mainpage-initialized')
      
      // 如果還沒初始化過，且沒有選擇地點
      if (!isInitialized && !selectedLocation) {
        // 自動選擇第一個地點（基隆）
        const firstLocation = locations[0]
        if (firstLocation) {
          setSelectedLocation(firstLocation.id)
          
          if (isMobile) {
            // 手機端：選擇第一支相機
            const firstCamera = firstLocation.cameras[0]
            setSelectedCameras([firstCamera])
            
            const streamUrl = `${ACTUAL_ENDPOINT}/camera${firstCamera.toString().padStart(3, '0')}`
            setStreamingCameras({ [firstCamera]: streamUrl })
            setStreams([streamUrl])
            setCameraVisibility({ 0: true })
            setCurrentMobileStreamIndex(0)
          } else {
            // 電腦端：全選八隻監視器
            const allCameras = firstLocation.cameras.slice(0, 8) // 取前8隻
            setSelectedCameras(allCameras)
            
            // 建立攝影機ID到stream URL的映射
            const newStreamingCameras: { [key: number]: string } = {}
            allCameras.forEach(cameraId => {
              newStreamingCameras[cameraId] = `${ACTUAL_ENDPOINT}/camera${cameraId.toString().padStart(3, '0')}`
            })
            setStreamingCameras(newStreamingCameras)
            
            // 設定所有的串流
            const newStreams = Array(gridLayout).fill(null)
            allCameras.forEach((cameraId, index) => {
              if (index < gridLayout) {
                newStreams[index] = newStreamingCameras[cameraId]
              }
            })
            setStreams(newStreams)
            
            // 設定攝影機可見性
            const newVisibility: { [key: number]: boolean } = {}
            allCameras.forEach((_, index) => {
              if (index < gridLayout) {
                newVisibility[index] = true
              }
            })
            setCameraVisibility(newVisibility)
          }
          
          // 標記為已初始化
          sessionStorage.setItem('mainpage-initialized', 'true')
        }
      }
    }
  }, [selectedLocation, isMobile, gridLayout])



  // 新增：處理登出
  const handleLogout = async () => {
    try {
      await AuthService.logout()
      router.push('/login')
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }

  // 新增：處理地點選擇變更
  const handleLocationChange = (location: string | null) => {
    setSelectedLocation(location)
    setSelectedCameras([]) // 清空攝影機選擇
    
    if (location) {
      // 自動選擇地點時，預設選擇所有八隻攝影機
      const locationData = locations.find(loc => loc.id === location)
      if (locationData) {
        const allCameras = locationData.cameras // 選擇全部8隻攝影機
        setSelectedCameras(allCameras)
        
        // 建立攝影機ID到stream URL的映射
        const newStreamingCameras: { [key: number]: string } = {}
        allCameras.forEach((cameraId, index) => {
          newStreamingCameras[cameraId] = `${ACTUAL_ENDPOINT}/camera${cameraId.toString().padStart(3, '0')}`
        })
        setStreamingCameras(newStreamingCameras)
        
        // 更新主要的 streams 狀態（根據當前宮格限制顯示）
        const newStreams = Array(gridLayout).fill(null)
        allCameras.forEach((cameraId, index) => {
          if (index < gridLayout) {
            newStreams[index] = newStreamingCameras[cameraId]
          }
        })
        setStreams(newStreams)
        
        // 更新攝影機可見性（根據當前宮格限制）
        const newVisibility: { [key: number]: boolean } = {}
        allCameras.forEach((_, index) => {
          if (index < gridLayout) {
            newVisibility[index] = true
          }
        })
        setCameraVisibility(newVisibility)
      }
    } else {
      // 清空所有選擇
      setStreamingCameras({})
      setStreams(Array(gridLayout).fill(null))
      setCameraVisibility({})
    }
  }

  // 新增：處理攝影機選擇變更
  const handleCameraChange = (cameras: number[]) => {
    setSelectedCameras(cameras)
    
    // 建立攝影機ID到stream URL的映射
    const newStreamingCameras: { [key: number]: string } = {}
    cameras.forEach(cameraId => {
      newStreamingCameras[cameraId] = `${ACTUAL_ENDPOINT}/camera${cameraId.toString().padStart(3, '0')}`
    })
    setStreamingCameras(newStreamingCameras)
    
    // 更新主要的 streams 狀態
    const newStreams = Array(gridLayout).fill(null)
    cameras.forEach((cameraId, index) => {
      if (index < gridLayout) {
        newStreams[index] = newStreamingCameras[cameraId]
      }
    })
    setStreams(newStreams)
    
    // 更新攝影機可見性
    const newVisibility: { [key: number]: boolean } = {}
    cameras.forEach((_, index) => {
      newVisibility[index] = true
    })
    setCameraVisibility(newVisibility)
  }

  // 新增：獲取可用攝影機列表
  const getAvailableCameras = (): number[] => {
    if (!selectedLocation) return []
    
    const locationData = locations.find(loc => loc.id === selectedLocation)
    return locationData ? locationData.cameras : []
  }

  // 新增：獲取地點名稱
  const getLocationName = (): string => {
    if (!selectedLocation) return ''
    
    const locationData = locations.find(loc => loc.id === selectedLocation)
    return locationData ? locationData.name : ''
  }



  // Load default streams on initial page load
  useEffect(() => {
    const loadInitialStreams = async () => {
      // 檢查 sessionStorage（但要安全地處理）
      let hasLoaded = false
      if (typeof window !== 'undefined') {
        hasLoaded = sessionStorage.getItem('camera-loaded') === 'true'
      }
      
      if (!hasLoaded) {
        // 首次載入，顯示動畫
        setIsInitialLoading(true)
        
        // 模擬載入時間
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 標記為已載入（這個會話期間有效）
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('camera-loaded', 'true')
          // 同時標記 mainpage 為已初始化，避免重複初始化
          sessionStorage.setItem('mainpage-initialized', 'true')
        }
      }
      
      setIsInitialLoading(false)
    }
    
    loadInitialStreams()
  }, [isMobile])

  // 監聽 gridLayout 變更，自動調整攝影機顯示
  useEffect(() => {
    if (selectedLocation && selectedCameras.length > 0) {
      // 重新生成 streams 以適應新的宮格布局（不改變選中的攝影機數量）
      const newStreams = Array(gridLayout).fill(null)
      selectedCameras.forEach((cameraId, index) => {
        if (index < gridLayout && streamingCameras[cameraId]) {
          newStreams[index] = streamingCameras[cameraId]
        }
      })
      setStreams(newStreams)
      
      // 更新攝影機可見性（只顯示在當前宮格範圍內的）
      const newVisibility: { [key: number]: boolean } = {}
      selectedCameras.forEach((_, index) => {
        if (index < gridLayout) {
          newVisibility[index] = true
        }
      })
      setCameraVisibility(newVisibility)
    }
  }, [gridLayout])

  // 監聽初始地點選擇，觸發攝影機選擇
  useEffect(() => {
    if (selectedLocation && selectedCameras.length === 0) {
      // 當地點被選擇但還沒有攝影機選擇時，自動選擇所有攝影機
      const locationData = locations.find(loc => loc.id === selectedLocation)
      if (locationData) {
        const allCameras = locationData.cameras
        handleCameraChange(allCameras)
      }
    }
  }, [selectedLocation])

  // 如果還在初始載入中，顯示統一的Loading畫面
  if (isInitialLoading) {
    return <LoadingScreen message="正在載入攝影機..." isMobile={isMobile} />
  }

  // Add a new stream to the first available cell
  const addStream = (streamUrl: string) => {
    setStreams(prevStreams => {
      // 尋找第一個空位
      const newStreams = [...prevStreams]
      const emptyIndex = newStreams.findIndex((stream) => stream === null)

      if (emptyIndex !== -1) {
        newStreams[emptyIndex] = streamUrl
        return newStreams
      }

      return prevStreams // No empty cells available
    })

    return true
  }

  // 處理串流選擇狀態切換
  const toggleStreamSelection = (index: number) => {
    if (selectedForRemoval.includes(index)) {
      // 如果已經選中，則取消選取
      setSelectedForRemoval(selectedForRemoval.filter((idx: number) => idx !== index))
    } else {
      // 如果未選中，則添加到選取列表
      setSelectedForRemoval([...selectedForRemoval, index])
    }
  }

  // 新增：切換攝影機可見性
  const toggleCameraVisibility = (index: number) => {
    setCameraVisibility(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // 新增：全選/取消全選攝影機
  const toggleAllCameras = () => {
    const allStreams = getAllStreams()
    const allVisible = allStreams.every(({ index }) => cameraVisibility[index] !== false)
    
    const newVisibility = { ...cameraVisibility }
    allStreams.forEach(({ index }) => {
      newVisibility[index] = !allVisible
    })
    setCameraVisibility(newVisibility)
  }

  // 新增：處理StreamCell點擊跳轉
  const handleStreamClick = (streamUrl: string, streamIndex: number) => {
    if (!isRemoveMode && streamUrl) {
      // 編碼stream URL和索引，跳轉到子頁面
      const encodedUrl = encodeURIComponent(streamUrl)
      router.push(`/stream/${streamIndex}?url=${encodedUrl}`)
    }
  }

  // 移除選定的串流
  const removeSelectedStreams = () => {
    if (selectedForRemoval.length === 0) return

    setStreams(prevStreams => {
      const newStreams = [...prevStreams]
      selectedForRemoval.forEach(index => {
        newStreams[index] = null
      })
      return newStreams
    })

    // 清空選擇並退出移除模式
    setSelectedForRemoval([])
    setIsRemoveMode(false)
  }

  // 取消移除模式
  const cancelRemoveMode = () => {
    setSelectedForRemoval([])
    setIsRemoveMode(false)
  }

  // 獲取有效的串流，只返回可見的攝影機串流並自動補位
  const getValidStreams = (): string[] => {
    const visibleStreams: string[] = []
    
    // 遍歷所有串流，只加入可見且非空的串流
    streams.forEach((stream, index) => {
      if (stream && cameraVisibility[index] !== false) {
        visibleStreams.push(stream)
      }
    })
    
    return visibleStreams
  }

  // 獲取所有非空串流（用於管理面板顯示）
  const getAllStreams = (): { stream: string; index: number; name: string }[] => {
    const allStreams: { stream: string; index: number; name: string }[] = []
    
    streams.forEach((stream, index) => {
      if (stream) {
        allStreams.push({
          stream,
          index,
          name: `攝影機 ${index + 1}`
        })
      }
    })
    
    return allStreams
  }

  // 手機端的內容渲染
  const renderMobileContent = () => {
    const validStreams = getValidStreams()
    const allStreams = getAllStreams()
    
    // 新增：手機端攝影機切換函數
    const handleMobileCameraSwitch = (targetIndex: number) => {
      // 找到目標攝影機在validStreams中的位置
      const targetStream = streams[targetIndex]
      if (!targetStream || cameraVisibility[targetIndex] === false) return
      
      const targetValidIndex = validStreams.findIndex(stream => stream === targetStream)
      if (targetValidIndex === -1) return
      
      // 如果點擊的是當前正在播放的攝影機，不需要切換
      if (targetValidIndex === currentMobileStreamIndex) return
      
      console.log(`手機端切換攝影機: ${currentMobileStreamIndex} -> ${targetValidIndex} (原始索引: ${targetIndex})`)
      setCurrentMobileStreamIndex(targetValidIndex)
    }
    
    return (
      <>
        {/* 手機端使用單一播放器 + 切換列表 */}
        <div className="flex-1 overflow-hidden">
          <MobileStreamPlayer
            streams={validStreams}
            initialStreamIndex={currentMobileStreamIndex}
          />
        </div>

        {/* 手機端控制面板（覆蓋模式） */}
        <ControlPanel isOpen={isPanelOpen} setIsOpen={setIsPanelOpen} isMobile={true}>
          <div className="space-y-6">
            {/* 地點選擇區域 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm">
                <MapPin className="h-4 w-4" />
                <span>選擇監控地點</span>
              </div>
              <LocationSelector
                selectedLocation={selectedLocation}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* 分隔線 */}
            <div className="border-t border-yellow-400/40"></div>

            {/* 攝影機列表區域 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                攝影機列表
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allStreams.length > 0 ? allStreams.map(({ stream, index, name }) => {
                  // 檢查這個攝影機是否正在播放
                  const currentPlayingStream = validStreams[currentMobileStreamIndex]
                  const isCurrentlyPlaying = currentPlayingStream === stream && 
                    cameraVisibility[index] !== false
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                        isCurrentlyPlaying
                          ? 'bg-yellow-400/20 border-yellow-400/50 shadow-sm'
                          : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/70 hover:border-yellow-400/30'
                      }`}
                      onClick={() => {
                        handleMobileCameraSwitch(index)
                      }}
                    >
                      <span className={`truncate flex-1 mr-2 font-medium ${
                        isCurrentlyPlaying ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {name}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {/* 正在播放的黃色勾勾 */}
                        {isCurrentlyPlaying && (
                          <div className="flex items-center justify-center w-5 h-5 bg-yellow-400 rounded-full">
                            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center text-yellow-400/70 py-4 bg-gray-800/30 rounded-lg border border-gray-600">
                    {selectedLocation ? '請等待攝影機載入...' : '請先選擇監控地點'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ControlPanel>
      </>
    )
  }

  // 桌面端的內容渲染
  const renderDesktopContent = () => {
    const allStreams = getAllStreams()
    
    return (
      <div className="flex flex-1 w-full overflow-hidden">
        {/* 串流網格 - 佔據全螢幕 */}
        <div className="flex-grow h-full transition-all duration-300 ease-in-out overflow-hidden">
          <StreamGrid
            streams={isRemoveMode ? streams.filter(s => s !== null) as string[] : getValidStreams()}
            originalStreams={streams}
            isRemoveMode={isRemoveMode}
            selectedIndices={selectedForRemoval}
            isH265={true}
            onCellClick={toggleStreamSelection}
            onStreamClick={handleStreamClick}
            gridLayout={gridLayout}
            onGridLayoutChange={setGridLayout}
            isMobile={false}
            cameraVisibility={cameraVisibility}
          />
        </div>

        {/* 控制面板 */}
        <ControlPanel isOpen={isPanelOpen} setIsOpen={setIsPanelOpen} isMobile={false}>
          <div className="space-y-6">
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
                <span>選擇攝影機 (根據宮格限制)</span>
              </div>
              <CameraSelector
                selectedCameras={selectedCameras}
                onCameraChange={handleCameraChange}
                availableCameras={getAvailableCameras()}
                locationName={getLocationName()}
                maxCameras={gridLayout}
                gridLayout={gridLayout}
              />
            </div>
          </div>
        </ControlPanel>
      </div>
    )
  }
  
  // 判斷是否應該使用收縮狀態的CSS
  const isSidebarCollapsed = sidebarMode === 'collapsed' || sidebarMode === 'hover'
  
  const content = (
    <div className="flex h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-black overflow-hidden">
      {/* Sidebar - 只在桌面版顯示 */}
      {!isMobile && (
        <Sidebar mode={sidebarMode} onModeChange={setSidebarMode} />
      )}
      
      {/* 主內容區域 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 頁面標題區域 */}
        <div className="bg-gray-900/90 backdrop-blur-sm shadow-sm py-3 px-4 flex items-center justify-between border-b border-gray-700/50 relative z-10">
          <div className="flex items-center gap-3">
            {/* 手機端頭像按鈕 - 只在手機端顯示 */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPhoneSidebarOpen(true)}
                className="hover:bg-gray-700/80 text-white rounded-full w-10 h-10 p-0"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full shadow-lg border border-gray-600">
                  <User className="h-4 w-4 text-white" />
                </div>
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-yellow-400" />
              <span className="text-xl font-bold text-white">即時影像</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 宮格切換按鈕 - 只在桌面設備顯示 */}
            {!isMobile && (
              <>
                <Button
                  variant={gridLayout === 1 ? "default" : "outline"}
                  size="icon"
                  onClick={() => setGridLayout(1)}
                  className={`w-8 h-8 ${gridLayout === 1 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-500' : 'bg-black text-white border-gray-600 hover:bg-gray-800'}`}
                >
                  <Square className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridLayout === 4 ? "default" : "outline"}
                  size="icon"
                  onClick={() => setGridLayout(4)}
                  className={`w-8 h-8 ${gridLayout === 4 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-500' : 'bg-black text-white border-gray-600 hover:bg-gray-800'}`}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridLayout === 9 ? "default" : "outline"}
                  size="icon"
                  onClick={() => setGridLayout(9)}
                  className={`w-8 h-8 ${gridLayout === 9 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-500' : 'bg-black text-white border-gray-600 hover:bg-gray-800'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridLayout === 16 ? "default" : "outline"}
                  size="icon"
                  onClick={() => setGridLayout(16)}
                  className={`w-8 h-8 ${gridLayout === 16 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-500' : 'bg-black text-white border-gray-600 hover:bg-gray-800'}`}
                >
                  <Grid4x4Icon className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* 菜單按鈕 */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-700/80 text-white"
              onClick={() => setIsPanelOpen(!isPanelOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 主内容區域 - 根據設備類型渲染不同內容 */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? renderMobileContent() : renderDesktopContent()}
        </div>

        <AddStreamDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          onAdd={addStream} 
        />
        
        {/* 手機端 Sidebar */}
        {isMobile && (
          <PhoneSidebar 
            isOpen={isPhoneSidebarOpen} 
            onClose={() => setIsPhoneSidebarOpen(false)} 
          />
        )}
      </div>
    </div>
  );

  return (
    <AuthGuard>
      {content}
    </AuthGuard>
  )
} 