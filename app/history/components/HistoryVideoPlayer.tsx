"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, WifiOff, Wifi, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoData {
  cameraId: number
  name: string
  url: string
  duration: number
  startTime: string
  endTime: string
}

interface HistoryVideoPlayerProps {
  videoData: VideoData
  isPlaying: boolean
  currentTime: number // 0-100 百分比
  onTimeChange: (time: number) => void
  isMobile: boolean
}

export default function HistoryVideoPlayer({
  videoData,
  isPlaying,
  currentTime,
  onTimeChange,
  isMobile
}: HistoryVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [isMuted, setIsMuted] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [localTime, setLocalTime] = useState(currentTime)
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null)

  // 模擬HLS播放初始化
  useEffect(() => {
    if (!videoRef.current || !videoData.url) return

    setIsLoading(true)
    setConnectionStatus('disconnected')

    // 模擬加載過程
    const loadTimeout = setTimeout(() => {
      setIsLoading(false)
      setIsVideoReady(true)
      setConnectionStatus('connected')

      // 設置模擬視頻源
      if (videoRef.current) {
        // 使用測試視頻或空白視頻
        videoRef.current.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzFtcDQx'
        videoRef.current.load()
      }
    }, 1500)

    return () => {
      clearTimeout(loadTimeout)
    }
  }, [videoData.url])

  // 播放/暫停控制
  useEffect(() => {
    if (!videoRef.current || !isVideoReady) return

    if (isPlaying) {
      videoRef.current.play().catch(console.error)
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying, isVideoReady])

  // 同步時間
  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime)
    }
  }, [currentTime, isDragging])

  // 更新視頻當前時間
  useEffect(() => {
    if (videoRef.current && isVideoReady) {
      const video = videoRef.current
      const targetTime = (localTime / 100) * video.duration
      if (Math.abs(video.currentTime - targetTime) > 1) {
        video.currentTime = targetTime
      }
    }
  }, [localTime, isVideoReady])

  // Loading動畫
  useEffect(() => {
    if (!isLoading) return
    const canvas = loadingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let running = true
    let animationId: number
    
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = Date.now() / 1000
      
      ctx.beginPath()
      ctx.arc(canvas.width/2, canvas.height/2, 20, 0, Math.PI*2*(0.5 + 0.5*Math.sin(t*2)))
      ctx.strokeStyle = '#facc15' // yellow-400
      ctx.lineWidth = 4
      ctx.stroke()
      
      animationId = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => { 
      running = false
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isLoading])

  // 進度條拖拽處理
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateProgress(e)
  }

  const handleProgressMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateProgress(e)
    }
  }

  const handleProgressMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      onTimeChange(localTime)
    }
  }

  // 觸控事件處理
  const handleProgressTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    updateProgressTouch(e)
  }

  const handleProgressTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault() // 防止頁面滾動
      updateProgressTouch(e)
    }
  }

  const handleProgressTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      onTimeChange(localTime)
    }
  }

  const updateProgress = (e: React.MouseEvent) => {
    if (!progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setLocalTime(percentage)
  }

  const updateProgressTouch = (e: React.TouchEvent) => {
    if (!progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    const x = touch.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setLocalTime(percentage)
  }

  // 格式化時間
  const formatTime = (percentage: number): string => {
    const totalMs = new Date(videoData.endTime).getTime() - new Date(videoData.startTime).getTime()
    const currentMs = (percentage / 100) * totalMs
    const currentDate = new Date(new Date(videoData.startTime).getTime() + currentMs)
    
    return currentDate.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 連線狀態圖標
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${isMobile ? 'bg-gray-800 h-full flex flex-col rounded-lg overflow-hidden' : 'bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 h-full flex flex-col'}`}
    >
      {/* 視頻區域 */}
      <div className={`relative bg-black ${isMobile ? 'aspect-video rounded-t-lg overflow-hidden' : 'flex-1 min-h-0'}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          preload="metadata"
          onLoadedMetadata={() => {
            setIsVideoReady(true)
            setIsLoading(false)
          }}
          onError={() => {
            setConnectionStatus('error')
            setIsLoading(false)
          }}
        />

        {/* 攝影機信息覆蓋層 */}
        <div className="absolute top-2 left-2 bg-black/50 rounded-lg px-2 py-1">
          <span className="text-white text-sm font-medium">{videoData.name}</span>
        </div>

        {/* 連線狀態指示器 */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-lg px-2 py-1">
          {getConnectionIcon()}
          <span className="text-white text-xs">
            {connectionStatus === 'connected' ? '已連線' : 
             connectionStatus === 'error' ? '錯誤' : '離線'}
          </span>
        </div>

        {/* Loading覆蓋層 */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <canvas 
                ref={loadingCanvasRef} 
                width={80} 
                height={80} 
                className="mx-auto mb-2"
              />
              <div className="text-white text-sm">載入中...</div>
            </div>
          </div>
        )}

        {/* 無影片狀態 */}
        {!isVideoReady && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <Video className="w-12 h-12 mx-auto mb-2" />
              <p>無可用影片</p>
            </div>
          </div>
        )}
      </div>

      {/* 控制面板 */}
      <div className={`${isMobile ? 'p-3 space-y-3 bg-gray-800 rounded-b-lg' : 'p-4 space-y-3'}`}>
        {/* 個別進度條 */}
        <div className="space-y-2">
          {!isMobile && (
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>個別進度</span>
              <span className="text-yellow-400">{formatTime(localTime)}</span>
            </div>
          )}
          
          <div
            ref={progressRef}
            className={`relative ${isMobile ? 'h-3' : 'h-2'} bg-gray-600 rounded-full cursor-pointer group`}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressMouseMove}
            onMouseUp={handleProgressMouseUp}
            onMouseLeave={handleProgressMouseUp}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full transition-all duration-150"
              style={{ width: `${localTime}%` }}
            />
            
            {/* 拖拽手柄 */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} bg-yellow-400 rounded-full shadow-lg transition-all duration-150 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              style={{ left: `calc(${localTime}% - ${isMobile ? '10px' : '8px'})` }}
            />
          </div>
          
          {/* 手機端播放控制按鈕 */}
          {isMobile && (
            <div className="flex items-center justify-between">
              {/* 倒退5%按鈕 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newTime = Math.max(0, localTime - 5)
                  setLocalTime(newTime)
                  onTimeChange(newTime)
                }}
                className="text-gray-300 hover:text-white"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              {/* 播放/暫停按鈕 */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  if (isPlaying) {
                    if (videoRef.current) {
                      videoRef.current.pause()
                    }
                  } else {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error)
                    }
                  }
                }}
                className="text-yellow-400 hover:text-yellow-300 mx-4"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>

              {/* 快轉5%按鈕 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newTime = Math.min(100, localTime + 5)
                  setLocalTime(newTime)
                  onTimeChange(newTime)
                }}
                className="text-gray-300 hover:text-white"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* 全屏按鈕 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // 進入全屏模式
                  if (videoRef.current) {
                    if (videoRef.current.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }
                }}
                className="text-gray-300 hover:text-white ml-2"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 控制按鈕 - 僅桌面端 */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-300 hover:text-white"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-400">
              {new Date(videoData.startTime).toLocaleString('zh-TW')}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 進入全屏模式
                if (videoRef.current) {
                  if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              className="text-gray-300 hover:text-white"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
} 