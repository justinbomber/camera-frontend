"use client"
import StreamCell from "./stream-cell"

interface StreamGridProps {
  streams: (string | null)[]
  isRemoveMode: boolean
  onCellClick: (index: number) => void
}

export default function StreamGrid({ streams, isRemoveMode, onCellClick }: StreamGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {streams.map((streamUrl, index) => (
        <StreamCell
          key={index}
          index={index}
          streamUrl={streamUrl}
          isRemoveMode={isRemoveMode}
          onClick={() => {
            if (isRemoveMode && streamUrl !== null) {
              onCellClick(index)
            }
          }}
        />
      ))}
    </div>
  )
}
