"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, XCircle, Check, RefreshCw, Wifi, WifiOff } from "lucide-react"
import StreamService from "@/lib/streamService"
import styles from "./styles.module.css"

interface StreamCellProps {
  index: number
  streamUrl: string | null
  isRemoveMode: boolean
  isSelected?: boolean
  onClick: () => void
}

export default function StreamCell({
  index,
  streamUrl,
  isRemoveMode,
  isSelected = false,
  onClick,
}: StreamCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamServiceRef = useRef<StreamService | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null)

  // 手動重連功能
  const handleManualReconnect = async () => {
    if (!streamUrl || !videoRef.current) return
    
    setIsReconnecting(true)
    setErrorMessage("")
    
    try {
      // 銷毀現有連線
      if (streamServiceRef.current) {
        streamServiceRef.current.destroy()
      }
      
      // 等待一秒後重新建立連線
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 重新初始化
      streamServiceRef.current = new StreamService({
        onError: (message) => {
          console.error('StreamCell 錯誤:', message)
          setConnectionStatus('error')
          setIsLoading(false)
          setIsReconnecting(false)
        },
        onLoading: (loading) => {
          setIsLoading(loading)
          if (!loading && connectionStatus !== 'connected') {
            setConnectionStatus('connected')
          }
        },
        onReady: () => {
          setIsLoading(false)
          setConnectionStatus('connected')
          setErrorMessage("")
          setIsReconnecting(false)
        }
      })

      // 重置重連狀態 - 這是關鍵的修復
      streamServiceRef.current.resetReconnectionState()
      
      await streamServiceRef.current.initializeStream(videoRef.current, streamUrl)
    } catch (error) {
      console.error('手動重連失敗:', error)
      setErrorMessage('重連失敗，請稍後再試')
      setConnectionStatus('error')
      setIsReconnecting(false)
    }
  }

  useEffect(() => {
    if (!streamUrl) {
      setIsLoading(false)
      setConnectionStatus('disconnected')
      return
    }

    const video = videoRef.current
    if (!video) return

    // 初始化串流服務
    streamServiceRef.current = new StreamService({
      onError: (message) => {
        console.error('StreamCell 錯誤:', message)
        setConnectionStatus('error')
        setIsLoading(false)
        setIsReconnecting(false)
      },
      onLoading: (loading) => {
        setIsLoading(loading)
        if (!loading && connectionStatus !== 'connected') {
          setConnectionStatus('connected')
        }
      },
      onReady: () => {
        setIsLoading(false)
        setConnectionStatus('connected')
        setErrorMessage("")
        setIsReconnecting(false)
      }
    })

    // 開始串流
    streamServiceRef.current.initializeStream(video, streamUrl)
      .catch(error => {
        console.error('串流初始化失敗:', error)
        setErrorMessage('串流初始化失敗')
        setConnectionStatus('error')
      })

    return () => {
      if (streamServiceRef.current) {
        streamServiceRef.current.destroy()
      }
    }
  }, [streamUrl])

  // Canvas loading 動畫
  useEffect(() => {
    if (!isLoading && !isReconnecting) return
    const canvas = loadingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let running = true
    
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = Date.now() / 1000
      
      // 不同狀態使用不同顏色
      const color = isReconnecting ? '#f59e0b' : '#3b82f6'
      
      ctx.beginPath()
      ctx.arc(canvas.width/2, canvas.height/2, 28, 0, Math.PI*2*(0.5 + 0.5*Math.sin(t*2)))
      ctx.strokeStyle = color
      ctx.lineWidth = 6
      ctx.stroke()
    }
    
    const loop = () => { 
      draw() 
      if(running) requestAnimationFrame(loop) 
    }
    loop()
    
    return () => { running = false }
  }, [isLoading, isReconnecting])

  // 連線狀態指示器
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
    <Card className={styles.container} onClick={onClick}>
      <CardContent className={styles.content}>
        {streamUrl ? (
          <>
            {/* 影片容器 - 確保影片不被裁切 */}
            <div className={styles.videoContainer}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                preload="metadata"
                className={styles.video}
                onError={(e) => {
                  console.error('StreamCell 視頻錯誤:', e)
                  setConnectionStatus('error')
                }}
                onPlay={() => {
                  setConnectionStatus('connected')
                  setIsLoading(false)
                  setErrorMessage("")
                }}
                onCanPlay={() => {
                  setIsLoading(false)
                  if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().catch(err => {
                      console.warn('StreamCell canPlay時播放失敗:', err);
                    });
                  }
                }}
              />
            </div>

            {/* 連線狀態指示器 */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/50 rounded px-2 py-1">
              {getConnectionIcon()}
              <span className="text-xs text-white">
                {isReconnecting ? '重連中...' : 
                 connectionStatus === 'connected' ? '已連線' : 
                 connectionStatus === 'error' ? '錯誤' : '離線'}
              </span>
            </div>

            <div className={styles.title}>
              Stream {index + 1}
            </div>

            {isRemoveMode && (
              <div className={styles.removeModeOverlay}>
                {isSelected ? 
                  <Check className="w-12 h-12 text-blue-400" /> : 
                  <XCircle className="w-12 h-12 text-red-500" />
                }
              </div>
            )}

            {(isLoading || isReconnecting) && (
              <div className={styles.loadingOverlay}>
                <canvas 
                  ref={loadingCanvasRef} 
                  width={120} 
                  height={120} 
                  style={{ width: 80, height: 80, borderRadius: 12 }} 
                />
                <div className="mt-2 text-sm text-center">
                  {isReconnecting ? '重新連線中...' : '載入中...'}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Video className={styles.emptyStateIcon} />
            <span>No Stream</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 