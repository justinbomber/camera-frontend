"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, WifiOff, Wifi, ChevronUp, ChevronDown } from "lucide-react"
import MobileStreamService from "@/lib/mobileStreamService"
import styles from "./styles.module.css"

interface MobileStreamPlayerProps {
  streams: string[]
  initialStreamIndex?: number
}

export default function MobileStreamPlayer({
  streams,
  initialStreamIndex = 0
}: MobileStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamServiceRef = useRef<MobileStreamService | null>(null)
  const [currentStreamIndex, setCurrentStreamIndex] = useState(initialStreamIndex)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [isStreamListOpen, setIsStreamListOpen] = useState<boolean>(false)
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null)

  const currentStreamUrl = streams[currentStreamIndex]

  // 切換串流
  const switchStream = async (newIndex: number) => {
    if (newIndex === currentStreamIndex || newIndex >= streams.length) return
    
    console.log(`手機端切換串流: ${currentStreamIndex} -> ${newIndex}`)
    
    setCurrentStreamIndex(newIndex)
    setIsStreamListOpen(false)
    setIsLoading(true)
    setErrorMessage("")
    setConnectionStatus('disconnected')
    
    // 銷毀現有連線
    if (streamServiceRef.current) {
      streamServiceRef.current.destroy()
      streamServiceRef.current = null
    }
    
    // 清空視頻元素但不立即reload
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
    }
    
    // 等待適當時間確保清理完成，但不要太長
    setTimeout(async () => {
      if (videoRef.current && streams[newIndex]) {
        try {
          console.log('手機端開始初始化新串流:', streams[newIndex])
          
          streamServiceRef.current = new MobileStreamService({
            onError: (message) => {
              console.error('手機端串流錯誤:', message)
              setConnectionStatus('error')
              setIsLoading(false)
              setErrorMessage(message)
              setIsReconnecting(false)
            },
            onLoading: (loading) => {
              setIsLoading(loading)
              if (!loading) {
                setConnectionStatus('connected')
                setIsReconnecting(false)
              }
            },
            onReady: () => {
              setIsLoading(false)
              setConnectionStatus('connected')
              setErrorMessage("")
              setIsReconnecting(false)
              console.log('手機端串流就緒')
            },
            onConnectionLost: () => {
              console.log('手機端偵測到連線中斷')
              setConnectionStatus('error')
            },
            onReconnecting: () => {
              console.log('手機端開始重連')
              setIsReconnecting(true)
              setIsLoading(true)
              setConnectionStatus('disconnected')
            }
          })
          
          await streamServiceRef.current.initializeStream(videoRef.current, streams[newIndex])
        } catch (error) {
          console.error('手機端切換串流失敗:', error)
          setConnectionStatus('error')
          setIsLoading(false)
          setErrorMessage('切換串流失敗')
        }
      }
    }, 500) // 減少延遲時間到500ms
  }

  // 監聽外部的initialStreamIndex變化
  useEffect(() => {
    if (initialStreamIndex !== currentStreamIndex && initialStreamIndex < streams.length) {
      console.log(`外部要求切換到攝影機 ${initialStreamIndex}`)
      switchStream(initialStreamIndex)
    }
  }, [initialStreamIndex, streams.length])

  // 初始化串流
  useEffect(() => {
    if (!currentStreamUrl) {
      setIsLoading(false)
      setConnectionStatus('disconnected')
      return
    }

    const video = videoRef.current
    if (!video) return

    console.log('手機端初始化串流:', currentStreamUrl)
    
    // 清理現有服務
    if (streamServiceRef.current) {
      streamServiceRef.current.destroy()
      streamServiceRef.current = null
    }

    // 初始化串流服務
    streamServiceRef.current = new MobileStreamService({
      onError: (message) => {
        console.error('手機端串流錯誤:', message)
        setConnectionStatus('error')
        setIsLoading(false)
        setErrorMessage(message)
        setIsReconnecting(false)
      },
      onLoading: (loading) => {
        setIsLoading(loading)
        if (!loading) {
          setConnectionStatus('connected')
          setIsReconnecting(false)
        }
      },
      onReady: () => {
        setIsLoading(false)
        setConnectionStatus('connected')
        setErrorMessage("")
        setIsReconnecting(false)
        console.log('手機端串流就緒')
      },
      onConnectionLost: () => {
        console.log('手機端偵測到連線中斷')
        setConnectionStatus('error')
      },
      onReconnecting: () => {
        console.log('手機端開始重連')
        setIsReconnecting(true)
        setIsLoading(true)
        setConnectionStatus('disconnected')
      }
    })

    // 開始串流，並設置超時保護
    const initTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('手機端串流初始化超時')
        setConnectionStatus('error')
        setIsLoading(false)
      }
    }, 30000) // 30秒超時

    streamServiceRef.current.initializeStream(video, currentStreamUrl)
      .then(() => {
        clearTimeout(initTimeout)
        console.log('手機端串流初始化完成')
      })
      .catch(error => {
        clearTimeout(initTimeout)
        console.error('手機端串流初始化失敗:', error)
        setConnectionStatus('error')
        setIsLoading(false)
      })

    return () => {
      clearTimeout(initTimeout)
      if (streamServiceRef.current) {
        streamServiceRef.current.destroy()
        streamServiceRef.current = null
      }
    }
  }, [currentStreamUrl]) // 只依賴於 currentStreamUrl

  // Canvas loading 動畫
  useEffect(() => {
    if (!isLoading) return
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
      
      // 根據狀態使用不同顏色
      let color = '#3b82f6' // 預設藍色
      if (isReconnecting) {
        color = '#f59e0b' // 重連時使用橙色
      } else if (connectionStatus === 'error') {
        color = '#ef4444' // 錯誤時使用紅色
      }
      
      ctx.beginPath()
      ctx.arc(canvas.width/2, canvas.height/2, 28, 0, Math.PI*2*(0.5 + 0.5*Math.sin(t*2)))
      ctx.strokeStyle = color
      ctx.lineWidth = 6
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
  }, [isLoading, connectionStatus, isReconnecting])

  // 連線狀態指示器
  const getConnectionIcon = () => {
    if (isReconnecting) {
      return (
        <div className="animate-spin">
          <Wifi className="w-4 h-4 text-orange-400" />
        </div>
      )
    }
    
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getCameraName = (index: number) => {
    return `攝影機 ${index + 1}`
  }

  if (streams.length === 0) {
    return (
      <div className={styles.container}>
        <Card className={styles.emptyCard}>
          <CardContent className={styles.emptyContent}>
            <Video className={styles.emptyIcon} />
            <span className={styles.emptyText}>無可用串流</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 主播放區域 */}
      <Card className={styles.playerCard}>
        <CardContent className={styles.playerContent}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            preload="metadata"
            className={styles.video}
            style={{ 
              filter: isLoading ? 'blur(2px)' : 'none'
            }}
            onLoadedMetadata={() => {
              console.log('手機端視頻元數據已載入')
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(err => {
                  console.warn('loadedMetadata時播放失敗:', err);
                });
              }
            }}
            onCanPlay={() => {
              console.log('手機端視頻可以播放')
              setIsLoading(false)
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(err => {
                  console.warn('canPlay時播放失敗:', err);
                });
              }
            }}
            onError={(e) => {
              console.error('手機端視頻播放錯誤:', e)
              setConnectionStatus('error')
            }}
            onPlay={() => {
              console.log('手機端視頻開始播放')
              setConnectionStatus('connected')
              setIsLoading(false)
              setErrorMessage("")
            }}
            onPause={() => {
              if (videoRef.current && !videoRef.current.ended) {
                console.log('手機端視頻意外暫停，嘗試恢復')
                setTimeout(() => {
                  if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
                    videoRef.current.play().catch(err => {
                      console.warn('恢復播放失敗:', err);
                    });
                  }
                }, 100);
              }
            }}
            onStalled={() => {
              console.log('手機端視頻播放停滯')
            }}
            onWaiting={() => {
              console.log('手機端視頻等待資料')
            }}
          />

          {/* 連線狀態指示器 */}
          <div className={styles.statusIndicator}>
            {getConnectionIcon()}
            <span className={styles.statusText}>
              {isReconnecting ? '重連中' :
               connectionStatus === 'connected' ? '已連線' : 
               connectionStatus === 'error' ? '錯誤' : '離線'}
            </span>
          </div>

          {/* 攝影機資訊 */}
          <div className={styles.cameraInfo}>
            <span className={styles.cameraName}>
              {getCameraName(currentStreamIndex)}
            </span>
          </div>

          {/* Loading 動畫 */}
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <canvas 
                ref={loadingCanvasRef} 
                width={120} 
                height={120} 
                className={styles.loadingCanvas}
              />
              <div className={styles.loadingText}>
                {isReconnecting ? '重新連線中...' : '載入中...'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 攝影機切換列表控制按鈕 */}
      <Button
        variant="outline"
        onClick={() => setIsStreamListOpen(!isStreamListOpen)}
        className={styles.toggleButton}
      >
        <span>選擇攝影機</span>
        {isStreamListOpen ? 
          <ChevronUp className={styles.toggleIcon} /> : 
          <ChevronDown className={styles.toggleIcon} />
        }
      </Button>

      {/* 攝影機切換列表 */}
      {isStreamListOpen && (
        <Card className={styles.streamListCard}>
          <CardContent className={styles.streamListContent}>
            <div className={styles.streamList}>
              {streams.map((streamUrl, index) => (
                <Button
                  key={index}
                  variant={index === currentStreamIndex ? "default" : "ghost"}
                  onClick={() => {
                    console.log(`點擊攝影機 ${index + 1}`)
                    switchStream(index)
                  }}
                  className={`${styles.streamButton} ${
                    index === currentStreamIndex ? styles.streamButtonActive : ''
                  }`}
                >
                  {getCameraName(index)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}