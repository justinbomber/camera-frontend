"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Menu, LayoutGrid, Grid2X2, Grid3X3, LayoutGrid as Grid4X4 } from "lucide-react"
import StreamGrid from "@/components/stream-grid"
import ControlPanel from "@/components/control-panel"
import AddStreamDialog from "@/components/add-stream-dialog"
import { Button } from "@/components/ui/button"
import Script from 'next/script'

// Default streams to load on initial page load
const DEFAULT_STREAMS = [
  "http://streamcamkeelong.mooo.com/camera001",
  "http://streamcamkeelong.mooo.com/camera002",
  "http://streamcamkeelong.mooo.com/camera003",
  "http://streamcamkeelong.mooo.com/camera004",
]

export default function MonitoringDashboard() {
  // State to track streams in the grid
  const [streams, setStreams] = useState<(string | null)[]>(Array(9).fill(null))
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveMode, setIsRemoveMode] = useState(false)
  // 新增選中要移除的串流索引陣列
  const [selectedForRemoval, setSelectedForRemoval] = useState<number[]>([])
  // 控制面板開關狀態
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  // 是否為移動設備
  const [isMobile, setIsMobile] = useState(false)
  // 網格布局
  const [gridLayout, setGridLayout] = useState<1 | 4 | 9 | 16>(9)

  // 檢測設備類型
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // Load default streams on initial page load
  useEffect(() => {
    const initialStreams = [...streams]
    DEFAULT_STREAMS.forEach((stream, index) => {
      if (index < initialStreams.length) {
        initialStreams[index] = stream
      }
    })
    setStreams(initialStreams)
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

  // 移除所有選定的串流，並將空位緊湊化（前移）
  const removeSelectedStreams = () => {
    if (selectedForRemoval.length === 0) return;

    // 先按索引從大到小排序，防止刪除時影響後續索引
    const sortedIndices = [...selectedForRemoval].sort((a, b) => b - a);

    setStreams(prevStreams => {
      // 創建新的陣列副本
      let newStreams = [...prevStreams];

      // 逐個移除選定的位置
      sortedIndices.forEach(index => {
        newStreams.splice(index, 1);
      });

      // 補充空位到總數9個
      while (newStreams.length < 9) {
        newStreams.push(null);
      }

      return newStreams;
    });

    setSelectedForRemoval([]);
    setIsRemoveMode(false);
  }

  // 取消移除模式並清空選擇
  const cancelRemoveMode = () => {
    setIsRemoveMode(false);
    setSelectedForRemoval([]);
  }

  // 根據設備類型決定面板樣式
  const getPanelClassName = () => {
    const baseClass = "flex-1 transition-all duration-300 ease-in-out overflow-hidden";

    if (isMobile) {
      // 移動設備不需要邊距，面板會覆蓋
      return baseClass;
    } else {
      // 桌面設備需要邊距，給控制面板空間
      return `${baseClass} ${isPanelOpen ? 'mr-[260px]' : ''}`;
    }
  };
  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <Script 
        src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/missile.js"
        strategy="beforeInteractive"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/h265webjs.js"
        strategy="beforeInteractive"
      />

      {/* 頁面標題區域 */}
      <div className="bg-white shadow-sm py-3 px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">HLS Stream Monitoring</h1>
        <div className="flex items-center gap-2">
          {/* 宮格切換按鈕 */}
          <Button
            variant={gridLayout === 1 ? "default" : "outline"}
            size="icon"
            onClick={() => setGridLayout(1)}
            className="w-8 h-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={gridLayout === 4 ? "default" : "outline"}
            size="icon"
            onClick={() => setGridLayout(4)}
            className="w-8 h-8"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={gridLayout === 9 ? "default" : "outline"}
            size="icon"
            onClick={() => setGridLayout(9)}
            className="w-8 h-8"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={gridLayout === 16 ? "default" : "outline"}
            size="icon"
            onClick={() => setGridLayout(16)}
            className="w-8 h-8"
          >
            <Grid4X4 className="h-4 w-4" />
          </Button>
          
          {/* 菜單按鈕 */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100/80"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 主内容區域 - Flex 容器 */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* 串流網格 - 自動佔據所有可用空間 */}
        <div className={`flex-grow h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out overflow-hidden ${isMobile && isPanelOpen ? 'hidden' : 'block'}`}>
          <StreamGrid
            streams={streams.filter(stream => stream !== null) as string[]}
            isRemoveMode={isRemoveMode}
            selectedIndices={selectedForRemoval}
            isH265={true}
            onCellClick={toggleStreamSelection}
            gridLayout={gridLayout}
            onGridLayoutChange={setGridLayout}
          />
        </div>

        {/* 控制面板 */}
        <ControlPanel isOpen={isPanelOpen} setIsOpen={setIsPanelOpen} isMobile={isMobile}>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mb-2" variant="default">
            <Plus className="mr-2 h-4 w-4" /> Add Stream
          </Button>

          {!isRemoveMode ? (
            <Button
              onClick={() => setIsRemoveMode(true)}
              className="w-full"
              variant="outline"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Streams
            </Button>
          ) : (
            <>
              <div className="flex space-x-2 mb-2">
                <Button onClick={cancelRemoveMode} className="flex-1" variant="outline">Cancel</Button>
                <Button
                  onClick={removeSelectedStreams}
                  className="flex-1"
                  variant="destructive"
                  disabled={selectedForRemoval.length === 0}
                >
                  Delete {selectedForRemoval.length > 0 ? `(${selectedForRemoval.length})` : ''}
                </Button>
              </div>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                選擇要移除的串流，然後點擊「Delete」按鈕進行移除
              </div>
            </>
          )}
        </ControlPanel>
      </div>

      <AddStreamDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onAdd={addStream} />
    </div>
  )
}