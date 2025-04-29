"use client"
import { useState } from "react"
import StreamCell from "./stream-cell"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Grid2X2, Grid3X3, LayoutGrid as Grid4X4 } from "lucide-react"

interface StreamGridProps {
  streams: string[]
  isRemoveMode: boolean
  selectedIndices?: number[]
  isH265?: boolean
  onCellClick: (index: number) => void
  gridLayout?: 1 | 4 | 9 | 16
  onGridLayoutChange?: (layout: 1 | 4 | 9 | 16) => void
}

export default function StreamGrid({ 
  streams, 
  isRemoveMode, 
  selectedIndices = [], 
  isH265 = false,
  onCellClick,
  gridLayout = 9,
  onGridLayoutChange
}: StreamGridProps) {
  const [internalGridLayout, setInternalGridLayout] = useState<1 | 4 | 9 | 16>(9); // 默認9宮格
  
  // 使用外部提供的gridLayout或内部狀態
  const currentLayout = onGridLayoutChange ? gridLayout : internalGridLayout;
  
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
    const baseStyle = "grid w-full h-full gap-1 auto-rows-fr ";
    
    switch (currentLayout) {
      case 1:
        return baseStyle + "grid-cols-1 grid-rows-1";
      case 4:
        return baseStyle + "grid-cols-2 grid-rows-2";
      case 9:
        return baseStyle + "grid-cols-3 grid-rows-3";
      case 16:
        return baseStyle + "grid-cols-4 grid-rows-4";
      default:
        return baseStyle + "grid-cols-3 grid-rows-3";
    }
  };

  // 生成空白單元格
  const renderEmptyCells = () => {
    const totalCells = currentLayout;
    const emptyCells = [];
    for (let i = streams.length; i < totalCells; i++) {
      emptyCells.push(
        <StreamCell
          key={`empty-${i}`}
          index={i}
          streamUrl=""
          isRemoveMode={isRemoveMode}
          isSelected={false}
          isH265={isH265}
          onClick={() => {}}
          isEmpty={true}
        />
      );
    }
    return emptyCells;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 主要內容區域 */}
      <div className="flex-1 p-1 min-h-0 overflow-hidden">
        <div className={getGridStyle()}>
          {streams.slice(0, currentLayout).map((streamUrl, index) => (
            <StreamCell
              key={index}
              index={index}
              streamUrl={streamUrl}
              isRemoveMode={isRemoveMode}
              isSelected={selectedIndices.includes(index)}
              isH265={isH265}
              onClick={() => {
                if (isRemoveMode) {
                  onCellClick(index)
                }
              }}
              isEmpty={false}
            />
          ))}
          {renderEmptyCells()}
        </div>
      </div>
    </div>
  )
}
