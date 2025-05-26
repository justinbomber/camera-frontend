import { useState, useEffect, type ReactNode } from "react"
import { X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

  // 根據設備類型決定面板樣式
  const getPanelClassName = () => {
    if (isMobile) {
      // 手機端：覆蓋模式
      return cn(
        styles.panel,
        styles.mobilePanel,
        isOpen ? styles.open : styles.closed
      );
    } else {
      // 桌面端：推移模式
      return cn(
        styles.panel,
        styles.desktopPanel,
        isOpen ? styles.open : styles.closed
      );
    }
  };

  return (
    <>
      {/* 手機端專用的遮罩層 */}
      {isMobile && isOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 桌面端專用的背景模糊遮罩層 */}
      {!isMobile && isOpen && (
        <div 
          className={styles.desktopBackgroundBlur}
          onClick={() => setIsOpen(false)}
        />
      )}
    
      {/* 控制面板 */}
      <div className={getPanelClassName()}>
        {isOpen && (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Control Panel</h2>
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