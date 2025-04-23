"use client"
import StreamCell from "./stream-cell"

interface StreamGridProps {
  streams: string[]
  isRemoveMode: boolean
  selectedIndices?: number[]
  onCellClick: (index: number) => void
}

export default function StreamGrid({ 
  streams, 
  isRemoveMode, 
  selectedIndices = [], 
  onCellClick 
}: StreamGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {streams.map((streamUrl, index) => (
        <StreamCell
          key={index}
          index={index}
          streamUrl={streamUrl}
          isRemoveMode={isRemoveMode}
          isSelected={selectedIndices.includes(index)}
          onClick={() => {
            if (isRemoveMode) {
              onCellClick(index)
            }
          }}
        />
      ))}
    </div>
  )
}
