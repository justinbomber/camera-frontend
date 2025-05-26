"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Menu, Square, Grid2X2, Grid3X3, LayoutGrid } from "lucide-react"
import { useRouter } from 'next/navigation'
import StreamGrid from "@/components/StreamGrid"
import ControlPanel from "@/components/ControlPanel"
import AddStreamDialog from "@/components/AddStreamDialog"
import MobileStreamPlayer from "@/components/MobileStreamPlayer"
import { Button } from "@/components/ui/button"
import { useDeviceDetection } from "@/lib/deviceUtils"
import { Grid4x4Icon } from "@/components/ui/grid4x4-icon"

// Default streams to load on initial page load
const DEFAULT_STREAMS = [
  "http://streamcamkeelong.mooo.com/camera001",
  "http://streamcamkeelong.mooo.com/camera002",
  "http://streamcamkeelong.mooo.com/camera003",
  "http://streamcamkeelong.mooo.com/camera004",
  "http://streamcamkeelong.mooo.com/camera005",
  "http://streamcamkeelong.mooo.com/camera006",
  "http://streamcamkeelong.mooo.com/camera007",
  "http://streamcamkeelong.mooo.com/camera008"
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
  
  // 使用新的設備檢測 Hook
  const isMobile = useDeviceDetection()

  // Load default streams on initial page load
  useEffect(() => {
    const initialStreams = [...streams]
    const initialVisibility: { [key: number]: boolean } = {}
    DEFAULT_STREAMS.forEach((stream, index) => {
      if (index < initialStreams.length) {
        initialStreams[index] = stream
        initialVisibility[index] = true // 預設所有攝影機都顯示
      }
    })
    setStreams(initialStreams)
    setCameraVisibility(initialVisibility)
  }, [])

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
    
    return (
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* 手機端使用單一播放器 + 切換列表 */}
        <div className="flex-1 overflow-hidden">
          <MobileStreamPlayer
            streams={validStreams}
            initialStreamIndex={0}
          />
        </div>

        {/* 手機端控制面板（覆蓋模式） */}
        <ControlPanel isOpen={isPanelOpen} setIsOpen={setIsPanelOpen} isMobile={true}>
          <div className="space-y-4">
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full" variant="default">
              <Plus className="mr-2 h-4 w-4 text-white" /> 
              <span className="text-white">新增串流</span>
            </Button>

            {!isRemoveMode ? (
              <Button
                onClick={() => setIsRemoveMode(true)}
                className="w-full"
                variant="outline"
              >
                <Trash2 className="mr-2 h-4 w-4 text-black" />
                <span className="text-black">移除串流</span>
              </Button>
            ) : (
              <>
                <div className="flex space-x-2">
                  <Button onClick={cancelRemoveMode} className="flex-1" variant="outline">
                    <span className="text-black">取消</span>
                  </Button>
                  <Button
                    onClick={removeSelectedStreams}
                    className="flex-1"
                    variant="destructive"
                    disabled={selectedForRemoval.length === 0}
                  >
                    <span className="text-white">刪除 {selectedForRemoval.length > 0 ? `(${selectedForRemoval.length})` : ''}</span>
                  </Button>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  選擇要移除的串流，然後點擊「刪除」按鈕進行移除
                </div>
              </>
            )}

            {/* 手機端串流列表管理 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-black mb-3">目前串流列表</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allStreams.length > 0 ? allStreams.map(({ stream, index, name }) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 border rounded-md text-sm ${
                      selectedForRemoval.includes(index) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="truncate flex-1 mr-2 text-black">
                      {name}
                    </span>
                    {isRemoveMode && (
                      <Button
                        size="sm"
                        variant={selectedForRemoval.includes(index) ? "destructive" : "outline"}
                        onClick={() => toggleStreamSelection(index)}
                      >
                        <span className={selectedForRemoval.includes(index) ? "text-white" : "text-black"}>
                          {selectedForRemoval.includes(index) ? '已選' : '選擇'}
                        </span>
                      </Button>
                    )}
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-4">
                    尚無串流
                  </div>
                )}
              </div>
            </div>

            {/* 手機端攝影機顯示控制列表 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-black">攝影機顯示控制</h3>
                {allStreams.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mobile-select-all"
                      checked={allStreams.every(({ index }) => cameraVisibility[index] !== false)}
                      onChange={toggleAllCameras}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="mobile-select-all" className="text-xs text-black font-medium cursor-pointer">
                      全選
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allStreams.length > 0 ? allStreams.map(({ stream, index, name }) => (
                  <div 
                    key={`mobile-${index}`}
                    className="flex items-center space-x-3 p-2 border rounded-md bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`mobile-camera-${index}`}
                      checked={cameraVisibility[index] !== false}
                      onChange={() => toggleCameraVisibility(index)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label 
                      htmlFor={`mobile-camera-${index}`}
                      className="flex-1 text-sm text-black font-medium cursor-pointer"
                    >
                      {name}
                    </label>
                    <div className={`w-2 h-2 rounded-full ${cameraVisibility[index] !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-4">
                    尚無攝影機
                  </div>
                )}
              </div>
            </div>
          </div>
        </ControlPanel>
      </div>
    )
  }

  // 桌面端的內容渲染
  const renderDesktopContent = () => {
    const allStreams = getAllStreams()
    
    return (
      <div className="flex flex-1 w-full overflow-hidden">
        {/* 串流網格 - 佔據全螢幕 */}
        <div className="flex-grow h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out overflow-hidden">
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
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mb-2" variant="default">
            <Plus className="mr-2 h-4 w-4 text-white" /> 
            <span className="text-white">Add Stream</span>
          </Button>

          {!isRemoveMode ? (
            <Button
              onClick={() => setIsRemoveMode(true)}
              className="w-full mb-4"
              variant="outline"
            >
              <Trash2 className="mr-2 h-4 w-4 text-black" />
              <span className="text-black">Remove Streams</span>
            </Button>
          ) : (
            <>
              <div className="flex space-x-2 mb-2">
                <Button onClick={cancelRemoveMode} className="flex-1" variant="outline">
                  <span className="text-black">Cancel</span>
                </Button>
                <Button
                  onClick={removeSelectedStreams}
                  className="flex-1"
                  variant="destructive"
                  disabled={selectedForRemoval.length === 0}
                >
                  <span className="text-white">Delete {selectedForRemoval.length > 0 ? `(${selectedForRemoval.length})` : ''}</span>
                </Button>
              </div>
              <div className="mt-2 mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                選擇要移除的串流，然後點擊「Delete」按鈕進行移除
              </div>
            </>
          )}

          {/* 攝影機顯示控制列表 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-black">攝影機顯示控制</h3>
              {allStreams.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="desktop-select-all"
                    checked={allStreams.every(({ index }) => cameraVisibility[index] !== false)}
                    onChange={toggleAllCameras}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="desktop-select-all" className="text-xs text-black font-medium cursor-pointer">
                    全選
                  </label>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allStreams.length > 0 ? allStreams.map(({ stream, index, name }) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-2 border rounded-md bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`camera-${index}`}
                    checked={cameraVisibility[index] !== false}
                    onChange={() => toggleCameraVisibility(index)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label 
                    htmlFor={`camera-${index}`}
                    className="flex-1 text-sm text-black font-medium cursor-pointer"
                  >
                    {name}
                  </label>
                  <div className={`w-2 h-2 rounded-full ${cameraVisibility[index] !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  尚無攝影機
                </div>
              )}
            </div>
          </div>
        </ControlPanel>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* 頁面標題區域 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm py-3 px-4 flex items-center justify-between border-b border-white/20">
        <h1 className="text-xl font-bold text-gray-800">
          Streaminghub {isMobile && <span className="text-sm text-gray-500 ml-2">(手機版)</span>}
        </h1>
        <div className="flex items-center gap-2">
          {/* 宮格切換按鈕 - 只在桌面設備顯示 */}
          {!isMobile && (
            <>
              <Button
                variant={gridLayout === 1 ? "default" : "outline"}
                size="icon"
                onClick={() => setGridLayout(1)}
                className={`w-8 h-8 ${gridLayout === 1 ? 'text-gray-500' : 'text-black'}`}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={gridLayout === 4 ? "default" : "outline"}
                size="icon"
                onClick={() => setGridLayout(4)}
                className={`w-8 h-8 ${gridLayout === 4 ? 'text-gray-500' : 'text-black'}`}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridLayout === 9 ? "default" : "outline"}
                size="icon"
                onClick={() => setGridLayout(9)}
                className={`w-8 h-8 ${gridLayout === 9 ? 'text-gray-500' : 'text-black'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridLayout === 16 ? "default" : "outline"}
                size="icon"
                onClick={() => setGridLayout(16)}
                className={`w-8 h-8 ${gridLayout === 16 ? 'text-gray-500' : 'text-black'}`}
              >
                <Grid4x4Icon className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* 菜單按鈕 */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100/80 text-black"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 主内容區域 - 根據設備類型渲染不同內容 */}
      {isMobile ? renderMobileContent() : renderDesktopContent()}

      <AddStreamDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onAdd={addStream} 
      />
    </div>
  )
} 