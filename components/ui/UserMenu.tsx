import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthService } from '@/lib/authService';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentUser = AuthService.getCurrentUser();

  // 處理點擊外部關閉選單和窗口大小變化
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const updateButtonPosition = () => {
      if (buttonRef.current && isOpen) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    };

    const handleResize = () => {
      updateButtonPosition();
    };

    const handleScroll = () => {
      updateButtonPosition();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      // 初始更新位置
      updateButtonPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // 處理登出
  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await AuthService.logout();
      router.push('/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 獲取用戶顯示名稱
  const getUserDisplayName = () => {
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return '用戶';
  };

  return (
    <>
      {/* 用戶頭像按鈕 */}
      <div className={`relative ${className}`}>
        <Button
          ref={buttonRef}
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 hover:bg-gray-700/80 text-white px-3 py-2 rounded-lg transition-all duration-200 ${
            isOpen ? 'bg-gray-700/60' : ''
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg">
            <User className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-medium hidden sm:block">
            {getUserDisplayName()}
          </span>
          <ChevronDown 
            className={`h-4 w-4 transition-transform duration-200 hidden sm:block ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </Button>
      </div>

      {/* 下拉選單 - 使用 Portal 渲染到 body */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && buttonRect && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed w-56 bg-gray-800 rounded-lg border border-gray-600 shadow-2xl z-[999999] overflow-hidden"
              style={{
                top: buttonRect.bottom + 8,
                right: window.innerWidth - buttonRect.right,
              }}
            >
              {/* 用戶資訊 */}
              <div className="p-4 border-b border-gray-600/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg">
                    <User className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {currentUser?.email || '未知用戶'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 選單項目 */}
              <div className="py-2">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 px-4 py-2 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  登出
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default UserMenu; 