import { useState, useEffect, type ReactNode } from "react"
import { X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ControlPanelProps {
  children: ReactNode
}

export default function ControlPanel({ children }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 監聽 ESC 鍵關閉面板
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <>
      {/* 漢堡選單按鈕 */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed right-4 top-4 z-50 hover:bg-gray-100/80"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* 遮罩層 */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 z-40" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* 側邊面板 */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white p-6 shadow-lg transform transition-all duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
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
      </div>
    </>
  )
}
