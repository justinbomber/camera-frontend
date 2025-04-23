"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import StreamGrid from "@/components/stream-grid"
import ControlPanel from "@/components/control-panel"
import AddStreamDialog from "@/components/add-stream-dialog"
import { Button } from "@/components/ui/button"

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
    const newStreams = [...streams]
    const emptyIndex = newStreams.findIndex((stream) => stream === null)

    if (emptyIndex !== -1) {
      newStreams[emptyIndex] = streamUrl
      setStreams(newStreams)
      return true
    }

    return false // No empty cells available
  }

  // Remove a stream from a specific cell
  const removeStream = (index: number) => {
    const newStreams = [...streams]
    newStreams[index] = null
    setStreams(newStreams)
    setIsRemoveMode(false)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">HLS Stream Monitoring</h1>
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <strong>注意:</strong> 此應用使用HLS協議連接到媒體服務器。請確保流媒體服務器支持HLS，
          並且已正確配置CORS和網絡設置以允許HTTP串流連接。默認流可能需要幾秒鐘來建立連接。
        </div>
        <StreamGrid streams={streams} isRemoveMode={isRemoveMode} onCellClick={removeStream} />
      </div>

      <ControlPanel>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mb-2" variant="default">
          <Plus className="mr-2 h-4 w-4" /> Add Stream
        </Button>

        <Button
          onClick={() => setIsRemoveMode(!isRemoveMode)}
          className="w-full"
          variant={isRemoveMode ? "destructive" : "outline"}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isRemoveMode ? "Cancel Remove" : "Remove Stream"}
        </Button>

        {isRemoveMode && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            Click on a stream cell to remove it
          </div>
        )}
      </ControlPanel>

      <AddStreamDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onAdd={addStream} />
    </div>
  )
}