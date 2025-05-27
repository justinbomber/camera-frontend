import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface LoadingScreenProps {
  message?: string
  isMobile?: boolean
}

export default function LoadingScreen({ 
  message = "載入中...", 
  isMobile = false 
}: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)
  // 固定的粒子配置，避免隨機數導致的 hydration 錯誤
  const [particleData, setParticleData] = useState<Array<{
    left: number
    top: number
    delay: number
  }>>([])

  useEffect(() => {
    // 標記為客戶端渲染並生成粒子數據
    setIsClient(true)
    
    // 只在客戶端生成隨機粒子數據
    const particles = Array.from({ length: isMobile ? 20 : 40 }).map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
    }))
    setParticleData(particles)
  }, [isMobile])

  useEffect(() => {
    if (!isClient) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let running = true
    let animationId: number
    let startTime = performance.now()

    const draw = () => {
      if (!running) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 使用 performance.now() 和 startTime 來計算相對時間，避免 hydration 錯誤
      const t = (performance.now() - startTime) / 1000
      
      // 主圓環
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = isMobile ? 35 : 50
      
      // 漸變色圓環
      const gradient = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
      )
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(0.5, '#8b5cf6')
      gradient.addColorStop(1, '#06b6d4')
      
      // 旋轉的圓環
      ctx.beginPath()
      ctx.arc(
        centerX, 
        centerY, 
        radius, 
        t * 2, 
        t * 2 + Math.PI * 1.5
      )
      ctx.strokeStyle = gradient
      ctx.lineWidth = isMobile ? 4 : 6
      ctx.lineCap = 'round'
      ctx.stroke()
      
      // 內部脈衝圓點
      const pulseRadius = 8 + Math.sin(t * 3) * 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(59, 130, 246, ${0.6 + Math.sin(t * 3) * 0.4})`
      ctx.fill()
      
      animationId = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      running = false
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isMobile, isClient])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 via-gray-800 to-black"
    >
      {/* 背景粒子效果 - 只在客戶端渲染 */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden">
          {particleData.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 主要載入動畫 */}
      <div className="relative z-10 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={isMobile ? 140 : 200}
          height={isMobile ? 140 : 200}
          className="mb-6"
        />
        
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <h2 className={`font-bold text-yellow-400 mb-2 ${
            isMobile ? 'text-xl' : 'text-2xl'
          }`}>
            monitor.hub
          </h2>
          <p className={`text-gray-300 ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            {message}
          </p>
        </motion.div>

        {/* 載入進度指示器 */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
          className={`mt-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full ${
            isMobile ? 'h-1 w-32' : 'h-1.5 w-48'
          }`}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  )
} 