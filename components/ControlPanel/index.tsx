import { useState, useEffect, type ReactNode } from "react"
import { X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./styles.module.css"

interface ControlPanelProps {
  children: ReactNode
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isMobile?: boolean
}

export default function ControlPanel({ 
  children, 
  isOpen, 
  setIsOpen, 
  isMobile = false 
}: ControlPanelProps) {
  // 監聽 ESC 鍵關閉面板
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setIsOpen])

  // 手機端保持原來的滑動模式
  if (isMobile) {
    // 根據設備類型決定面板樣式
    const getPanelClassName = () => {
      return cn(
        styles.panel,
        styles.mobilePanel,
        isOpen ? styles.open : styles.closed
      );
    };

    return (
      <>
        {/* 手機端專用的遮罩層 */}
        {isOpen && (
          <div 
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
          />
        )}
      
        {/* 控制面板 */}
        <div className={getPanelClassName()}>
          {isOpen && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>控制面板</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={styles.closeButton}
                  onClick={() => setIsOpen(false)}
                >
                  <X className={styles.closeIcon} />
                </Button>
              </div>
              <div className={styles.content}>
                {children}
              </div>
            </>
          )}
        </div>
      </>
    )
  }

  // 電腦端使用彈出視窗模式
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="bg-gray-800 rounded-2xl border border-gray-600 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel 標題 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg">
                  <Menu className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">控制面板</h2>
                  <p className="text-gray-400 text-sm">選擇監控地點和攝影機</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Panel 內容 */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 