import { useState, useEffect, type ReactNode } from "react"
import { X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    const baseClass = "h-screen bg-white p-6 shadow-lg transition-all duration-300 ease-in-out";
    
    if (isMobile) {
      // 手機端：覆蓋模式
      return cn(
        baseClass,
        "fixed top-0 right-0 z-50",
        isOpen ? "w-[260px]" : "w-0 p-0 overflow-hidden"
      );
    } else {
      // 桌面端：推移模式
      return cn(
        baseClass,
        "border-l border-gray-200",
        isOpen ? "w-[400px]" : "w-0 p-0 overflow-hidden"
      );
    }
  };

  return (
    <>
      {/* 手機端專用的遮罩層 */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    
      {/* 控制面板 */}
      <div className={getPanelClassName()}>
        {isOpen && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Control Panel</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100/80"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-8rem)]">
              {children}
            </div>
          </>
        )}
      </div>
    </>
  )
}
