"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Video, XCircle, Check } from "lucide-react"

interface StreamCellMergedProps {
  index: number
  streamUrl: string | null
  isRemoveMode: boolean
  isSelected?: boolean
  onClick: () => void
}

export default function StreamCellMerged({
  index,
  streamUrl,
  isRemoveMode,
  isSelected = false,
  onClick,
}: StreamCellMergedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any | null>(null)
  const h265PlayerRef = useRef<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null)

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  // 判斷 H265 還是 HLS
  const detectStreamCodec = async (url: string): Promise<boolean> => {
    try {
      const resp = await fetch(url)
      const txt = await resp.text()
      return txt.toLowerCase().includes('h265') || txt.toLowerCase().includes('hevc')
    } catch {
      return false
    }
  }

  // 嘗試播放
  const attemptPlayVideo = async () => {
    const video = videoRef.current
    if (!video) return
    setIsLoading(true)
    try {
      await video.play()
      setErrorMessage("")
      setIsLoading(false)
    } catch (err: any) {
      setErrorMessage(`播放錯誤: ${err.message || err}`)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!streamUrl) {
      setIsLoading(false)
      return
    }
    const video = videoRef.current
    let Hls: any = null

    const loadHls = async () => {
      try {
        const HlsModule = await import('hls.js')
        Hls = HlsModule.default
        initPlayer()
      } catch {
        setErrorMessage('無法載入 hls.js')
        setIsLoading(false)
      }
    }

    const initPlayer = async () => {
      const isH265 = await detectStreamCodec(streamUrl)
      const url = streamUrl.endsWith('/index.m3u8') ? streamUrl : `${streamUrl}/index.m3u8`

      if (isH265 && video) {
        if (h265PlayerRef.current) h265PlayerRef.current.destroy()
        const player = new (window as any).H265webjs({ player: video, url: streamUrl, useWorker: true })
        player.on('ready', () => setIsLoading(false))
        player.on('error', (e: any) => {
          setErrorMessage(`H265 播放錯誤: ${e}`)
          setIsLoading(false)
        })
        h265PlayerRef.current = player
      } else if (video) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
          video.addEventListener('loadedmetadata', () => { attemptPlayVideo() })
          video.addEventListener('error', () => {
            setErrorMessage('視頻載入錯誤')
            setIsLoading(false)
          })
        } else if (Hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
          hls.attachMedia(video)
          hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url))
          hls.on(Hls.Events.MANIFEST_PARSED, () => { attemptPlayVideo() })
          hls.on(Hls.Events.ERROR, (_: string, data: any) => {
            if (data.fatal) {
              setIsLoading(true)
              clearReconnectTimer()
              reconnectTimerRef.current = setTimeout(() => hls.loadSource(url), 5000)
            }
          })
          hlsRef.current = hls
        } else {
          video.src = url
          setErrorMessage('此瀏覽器不支援 HLS')
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    setErrorMessage("")
    loadHls()

    return () => {
      clearReconnectTimer()
      if (hlsRef.current) hlsRef.current.destroy()
      if (h265PlayerRef.current) h265PlayerRef.current.destroy()
    }
  }, [streamUrl])

  // Canvas loading 動畫
  useEffect(() => {
    if (!isLoading) return
    const canvas = loadingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let running = true
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = Date.now() / 1000
      ctx.beginPath()
      ctx.arc(canvas.width/2, canvas.height/2, 28, 0, Math.PI*2*(0.5 + 0.5*Math.sin(t*2)))
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 6
      ctx.stroke()
    }
    const loop = () => { draw(); if(running) requestAnimationFrame(loop) }
    loop()
    return () => { running = false }
  }, [isLoading])

  return (
    <Card className="aspect-video w-full h-full overflow-hidden" onClick={onClick}>
      <CardContent className="p-0 relative h-full">
        {/* 資料區塊 */}
        {streamUrl ? (
          <>
            {/* 串流畫面 */}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black" />

            {/* 標題: 一律顯示 */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
              Stream {index + 1}
            </div>

            {/* 移除模式遮罩 */}
            {isRemoveMode && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                {isSelected ? <Check className="w-12 h-12 text-blue-400" /> : <XCircle className="w-12 h-12 text-red-500" />}
              </div>
            )}

            {/* 載入中動畫 */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <canvas ref={loadingCanvasRef} width={120} height={120} style={{ width: 80, height: 80, borderRadius: 12 }} />
              </div>
            )}

            {/* 錯誤訊息 */}
            {errorMessage && !isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm z-30">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full bg-slate-100">
            <Video className="w-12 h-12 mb-2" />
            <span>No Stream</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
