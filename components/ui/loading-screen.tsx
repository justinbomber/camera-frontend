import { useEffect, useRef } from "react"
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let running = true
    let animationId: number

    const draw = () => {
      if (!running) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = Date.now() / 1000
      
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
  }, [isMobile])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
      {/* 背景粒子效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: isMobile ? 20 : 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-300/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

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
          <h2 className={`font-bold text-gray-800 mb-2 ${
            isMobile ? 'text-xl' : 'text-2xl'
          }`}>
            monitor.hub
          </h2>
          <p className={`text-gray-600 ${
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
          className={`mt-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full ${
            isMobile ? 'h-1 w-32' : 'h-1.5 w-48'
          }`}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  )
} 