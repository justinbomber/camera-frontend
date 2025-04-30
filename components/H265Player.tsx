"use client"

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'

interface H265PlayerProps {
  videoUrl: string
  width?: number
  height?: number
  token?: string
}

export default function H265Player({ 
  videoUrl, 
  width = 960, 
  height = 540, 
  token = '' 
}: H265PlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const playerInstanceRef = useRef<any>(null)

  useEffect(() => {
    // 確保腳本已載入
    if (typeof window !== 'undefined' && window.H265webjs && playerRef.current) {
      const config = {
        player: playerRef.current,
        width: width,
        height: height,
        token: token,
        extInfo: {
          moovStartFlag: true
        }
      }

      try {
        // 清理舊的播放器實例
        if (playerInstanceRef.current) {
          playerInstanceRef.current.destroy()
        }

        // 創建新的播放器實例
        playerInstanceRef.current = new window.H265webjs(videoUrl, config)
      } catch (error) {
        console.error('初始化 H265 播放器時發生錯誤:', error)
      }
    }

    // 組件卸載時清理
    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy()
          playerInstanceRef.current = null
        } catch (error) {
          console.error('清理 H265 播放器時發生錯誤:', error)
        }
      }
    }
  }, [videoUrl, width, height, token])

  return (
    <Card className="overflow-hidden">
      <div 
        ref={playerRef}
        style={{ width: width, height: height }}
        className="bg-black"
      />
    </Card>
  )
} 