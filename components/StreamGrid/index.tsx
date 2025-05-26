"use client"
import { useState, useEffect } from "react"
import StreamCell from "../StreamCell"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Grid2X2, Grid3X3 } from "lucide-react"
import styles from "./styles.module.css"

interface StreamGridProps {
  streams: string[]
  originalStreams?: (string | null)[]
  isRemoveMode: boolean
  selectedIndices?: number[]
  isH265?: boolean
  onCellClick: (index: number) => void
  onStreamClick?: (streamUrl: string, streamIndex: number) => void
  gridLayout?: 1 | 4 | 9 | 16
  onGridLayoutChange?: (layout: 1 | 4 | 9 | 16) => void
  isMobile?: boolean
  cameraVisibility?: { [key: number]: boolean }
}

export default function StreamGrid({ 
  streams, 
  originalStreams,
  isRemoveMode, 
  selectedIndices = [], 
  isH265 = false,
  onCellClick,
  onStreamClick,
  gridLayout = 9,
  onGridLayoutChange,
  isMobile = false,
  cameraVisibility = {}
}: StreamGridProps) {
  const [internalGridLayout, setInternalGridLayout] = useState<1 | 4 | 9 | 16>(9); // 默認9宮格
  const [containerKey, setContainerKey] = useState(0); // 強制重新渲染的 key
  
  // 使用外部提供的gridLayout或内部狀態
  const currentLayout = onGridLayoutChange ? gridLayout : internalGridLayout;
  
  // 監聽窗口尺寸變化，確保佈局正確更新
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      // 延遲觸發重新渲染，確保佈局計算正確
      setTimeout(() => {
        setContainerKey(prev => prev + 1)
      }, 350) // 稍微延遲一點，配合 sidebar 動畫時間 (300ms)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 更新網格布局
  const updateGridLayout = (layout: 1 | 4 | 9 | 16) => {
    if (onGridLayoutChange) {
      onGridLayoutChange(layout);
    } else {
      setInternalGridLayout(layout);
    }
  };

  // 根據布局獲取網格樣式
  const getGridStyle = () => {
    const baseStyle = styles.grid;
    
    // 手機端強制使用垂直布局
    if (isMobile) {
      return `${baseStyle} ${styles.gridMobileVertical}`;
    }
    
    switch (currentLayout) {
      case 1:
        return `${baseStyle} ${styles.grid1x1}`;
      case 4:
        return `${baseStyle} ${styles.grid2x2}`;
      case 9:
        return `${baseStyle} ${styles.grid3x3}`;
      case 16:
        return `${baseStyle} ${styles.grid4x4}`;
      default:
        return `${baseStyle} ${styles.grid3x3}`;
    }
  };

  // 生成空白單元格
  const renderEmptyCells = () => {
    // 手機端不顯示空白單元格，因為使用垂直布局
    if (isMobile) {
      return [];
    }
    
    const totalCells = currentLayout;
    const emptyCells = [];
    for (let i = streams.length; i < totalCells; i++) {
      emptyCells.push(
        <StreamCell
          key={`empty-${i}`}
          index={i}
          streamUrl={null}
          isRemoveMode={isRemoveMode}
          isSelected={false}
          onClick={() => {}}
        />
      );
    }
    return emptyCells;
  };

  return (
    <div className={styles.container}>
      {/* 主要內容區域 */}
      <div className={isMobile ? styles.contentMobile : styles.content}>
        <div key={containerKey} className={getGridStyle()}>
          {(isMobile ? streams : streams.slice(0, currentLayout)).map((streamUrl, displayIndex) => {
            // 在移除模式下，找到對應的原始索引
            let originalIndex = displayIndex
            if (isRemoveMode && originalStreams) {
              // 在原始串流中找到當前串流的真實索引
              let currentStreamCount = 0
              for (let i = 0; i < originalStreams.length; i++) {
                if (originalStreams[i] === streamUrl) {
                  if (currentStreamCount === displayIndex) {
                    originalIndex = i
                    break
                  }
                  currentStreamCount++
                }
              }
            }
            
            return (
              <StreamCell
                key={isRemoveMode ? `remove-${originalIndex}` : `normal-${displayIndex}`}
                index={originalIndex}
                streamUrl={streamUrl}
                isRemoveMode={isRemoveMode}
                isSelected={selectedIndices.includes(originalIndex)}
                onClick={() => {
                  if (isRemoveMode) {
                    onCellClick(originalIndex)
                  } else if (onStreamClick && streamUrl) {
                    onStreamClick(streamUrl, originalIndex)
                  }
                }}
              />
            )
          })}
          {renderEmptyCells()}
        </div>
      </div>
    </div>
  )
} 