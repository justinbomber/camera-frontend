"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, RotateCcw, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import StreamService from "@/lib/streamService"

interface StreamDetailPageProps {
  params: {
    id: string
  }
}

export default function StreamDetailPage({ params }: StreamDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamServiceRef = useRef<StreamService | null>(null)
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  
  const streamUrl = searchParams?.get('url') ? decodeURIComponent(searchParams.get('url')!) : null
  const streamIndex = parseInt(params.id)
  const streamName = `攝影機 ${streamIndex + 1}`

  // 初始化串流
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    const video = videoRef.current
    
    // 設置初始連接狀態
    setConnectionStatus('connecting')
    setIsLoading(true)
    setErrorMessage("")
    
    // 設置初始化超時，給串流更多時間連接
    const initTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting') {
        console.warn('StreamDetail 串流初始化超時')
        setConnectionStatus('error')
        setErrorMessage('連線超時，請稍後再試')
        setIsLoading(false)
      }
    }, 15000) // 15秒超時
    
    streamServiceRef.current = new StreamService({
      onError: (message) => {
        console.error('StreamDetail 錯誤:', message)
        clearTimeout(initTimeout)
        // 只有在不是重連狀態時才設為錯誤
        if (!isReconnecting) {
          setConnectionStatus('error')
          setErrorMessage(message)
        }
        setIsLoading(false)
        setIsReconnecting(false)
      },
      onLoading: (loading) => {
        setIsLoading(loading)
        // 載入完成且當前不是已連線狀態時，設為已連線
        if (!loading && connectionStatus !== 'connected') {
          clearTimeout(initTimeout)
          setConnectionStatus('connected')
          setErrorMessage("")
        }
      },
      onReady: () => {
        clearTimeout(initTimeout)
        setIsLoading(false)
        setConnectionStatus('connected')
        setErrorMessage("")
        setIsReconnecting(false)
      }
    })

    streamServiceRef.current.initializeStream(video, streamUrl)
      .catch(error => {
        console.error('串流初始化失敗:', error)
        clearTimeout(initTimeout)
        setErrorMessage('串流初始化失敗')
        setConnectionStatus('error')
        setIsLoading(false)
      })

    return () => {
      clearTimeout(initTimeout)
      if (streamServiceRef.current) {
        streamServiceRef.current.destroy()
      }
    }
  }, [streamUrl]) // 移除 connectionStatus 依賴避免無限循環

  // 手動重連功能
  const handleManualReconnect = async () => {
    if (!streamUrl || !videoRef.current) return
    
    setIsReconnecting(true)
    setConnectionStatus('connecting')
    setErrorMessage("")
    
    try {
      if (streamServiceRef.current) {
        streamServiceRef.current.destroy()
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      streamServiceRef.current = new StreamService({
        onError: (message) => {
          console.error('StreamDetail 重連錯誤:', message)
          setConnectionStatus('error')
          setErrorMessage(message)
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

      streamServiceRef.current.resetReconnectionState()
      await streamServiceRef.current.initializeStream(videoRef.current!, streamUrl)
    } catch (error) {
      console.error('手動重連失敗:', error)
      setErrorMessage('重連失敗，請稍後再試')
      setConnectionStatus('error')
      setIsReconnecting(false)
    }
  }

  // 全螢幕切換
  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 音頻切換
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  // 返回主頁面
  const handleGoBack = () => {
    router.push('/mainpage')
  }

  // Canvas loading 動畫
  useEffect(() => {
    if (!isLoading && !isReconnecting) return
    const canvas = loadingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let running = true
    let animationId: number
    let startTime = performance.now()
    
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 使用相對時間避免 hydration 錯誤
      const t = (performance.now() - startTime) / 1000
      
      // 根據連線狀態選擇顏色
      const color = isReconnecting ? '#f59e0b' : 
                    connectionStatus === 'connecting' ? '#f97316' : '#3b82f6'
      
      ctx.beginPath()
      ctx.arc(canvas.width/2, canvas.height/2, 40, 0, Math.PI*2*(0.5 + 0.5*Math.sin(t*2)))
      ctx.strokeStyle = color
      ctx.lineWidth = 8
      ctx.stroke()
      
      animationId = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => { 
      running = false
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isLoading, isReconnecting, connectionStatus])

  if (!streamUrl) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white/80 backdrop-blur-sm shadow-sm py-3 px-4 flex items-center justify-between border-b border-white/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="hover:bg-gray-100/80 text-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">串流錯誤</h1>
          <div></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-red-600 mb-2">找不到串流</h2>
              <p className="text-gray-600 mb-4">請檢查串流 URL 是否正確</p>
              <Button onClick={handleGoBack} variant="outline">
                返回主頁面
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* 頂部控制欄 */}
      <div className="bg-black/50 backdrop-blur-sm py-3 px-4 flex items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="hover:bg-white/10 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">{streamName}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 連線狀態 */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-md ${
            connectionStatus === 'connected' ? 'bg-green-600/20 text-green-400' :
            connectionStatus === 'connecting' ? 'bg-orange-600/20 text-orange-400' :
            connectionStatus === 'error' ? 'bg-red-600/20 text-red-400' :
            'bg-gray-600/20 text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-orange-400 animate-pulse' :
              connectionStatus === 'error' ? 'bg-red-400' :
              'bg-gray-400'
            }`} />
            <span className="text-sm">
              {isReconnecting ? '重連中...' :
               connectionStatus === 'connected' ? '已連線' :
               connectionStatus === 'connecting' ? '連接中...' :
               connectionStatus === 'error' ? '連線錯誤' : '未連線'}
            </span>
          </div>
          
          {/* 重連按鈕 */}
          {connectionStatus === 'error' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualReconnect}
              disabled={isReconnecting}
              className="hover:bg-white/10 text-white"
            >
              <RotateCcw className={`h-5 w-5 ${isReconnecting ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          {/* 音頻控制 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="hover:bg-white/10 text-white"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          {/* 全螢幕按鈕 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hover:bg-white/10 text-white"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* 主要視頻區域 */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={isMuted}
            preload="metadata"
            className="w-full h-full object-contain rounded-lg shadow-2xl"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
            onError={(e) => {
              console.error('StreamDetail 視頻錯誤:', e)
              setConnectionStatus('error')
              setErrorMessage('視頻播放錯誤')
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
                  console.warn('StreamDetail canPlay時播放失敗:', err)
                })
              }
            }}
          />

          {/* 載入動畫 */}
          {(isLoading || isReconnecting) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20 rounded-lg">
              <canvas 
                ref={loadingCanvasRef} 
                width={160} 
                height={160} 
                style={{ width: 100, height: 100, borderRadius: 16 }} 
              />
              <div className="mt-4 text-lg text-white text-center">
                {isReconnecting ? '重新連線中...' : '載入中...'}
              </div>
            </div>
          )}

          {/* 錯誤顯示 */}
          {connectionStatus === 'error' && errorMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20 rounded-lg">
              <Card className="w-96">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">連線錯誤</h3>
                  <p className="text-gray-600 mb-4">{errorMessage}</p>
                  <div className="flex space-x-2 justify-center">
                    <Button onClick={handleManualReconnect} disabled={isReconnecting}>
                      重新連線
                    </Button>
                    <Button onClick={handleGoBack} variant="outline">
                      返回主頁面
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 