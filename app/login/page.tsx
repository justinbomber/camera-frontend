'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../lib/authService';
import { useToast, ToastContainer } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import LoadingScreen from '../../components/ui/loading-screen';
import { useDeviceDetection } from '../../lib/deviceUtils';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [signupData, setSignupData] = useState<SignupFormData>({ 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const isMobile = useDeviceDetection();

  // 檢查用戶是否已登入，如果是則重定向
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        console.log('登入頁面: 檢查現有認證狀態');
        const isAuthenticated = AuthService.isAuthenticated();
        
        if (isAuthenticated) {
          console.log('登入頁面: 用戶已登入，重定向到主頁面');
          router.replace('/mainpage');
          return;
        }
        
        console.log('登入頁面: 用戶未登入，顯示登入表單');
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('登入頁面: 認證檢查失敗:', error);
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      error('請填寫所有欄位');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('開始登入流程');
      await AuthService.login(loginData.email, loginData.password);
      console.log('登入成功');
      success('登入成功！');
      
      // 延遲跳轉，讓用戶看到成功訊息，並使用 replace 避免返回到登入頁面
      setTimeout(() => {
        console.log('跳轉到主頁面');
        router.replace('/mainpage');
      }, 1500);
      
    } catch (err: any) {
      console.error('登入失敗:', err);
      error(err.message || '登入失敗，請檢查您的帳號密碼');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      error('請填寫所有欄位');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      error('密碼確認不一致');
      return;
    }

    if (signupData.password.length < 6) {
      error('密碼長度至少需要6個字符');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('開始註冊流程');
      await AuthService.signup(signupData.email, signupData.password);
      console.log('註冊成功');
      success('註冊成功！正在為您登入...');
      
      // 延遲跳轉，讓用戶看到成功訊息，並使用 replace 避免返回到登入頁面
      setTimeout(() => {
        console.log('跳轉到主頁面');
        router.replace('/mainpage');
      }, 1500);
      
    } catch (err: any) {
      console.error('註冊失敗:', err);
      error(err.message || '註冊失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setLoginData({ email: '', password: '' });
    setSignupData({ email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
  };

  // 如果正在檢查認證狀態，顯示 loading 畫面
  if (isCheckingAuth) {
    return <LoadingScreen message="檢查登入狀態..." isMobile={isMobile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-black flex items-center justify-center p-4">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* 主要卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-700/50">
          {/* 標題區域 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg"
            >
              <User className="w-6 h-6 text-gray-900" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? '登入' : '註冊'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? '歡迎來到' : '加入'} <span className="text-yellow-400 font-semibold">monitor.hub</span>
            </p>
          </div>

          {/* 進度條 */}
          <div className="w-full bg-gray-700 rounded-full h-1 mb-8">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-1 rounded-full"
              initial={{ width: "20%" }}
              animate={{ width: isLogin ? "50%" : "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* 表單區域 */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                {/* 電子郵件 */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                    電子郵件
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="pl-10 bg-gray-800 border-yellow-500 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                      placeholder="請輸入您的電子郵件"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 密碼 */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    密碼
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10 pr-10 bg-gray-800 border-yellow-500 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                      placeholder="請輸入您的密碼"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 登入按鈕 */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      登入中...
                    </div>
                  ) : (
                    '登入'
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSignup}
                className="space-y-6"
              >
                {/* 電子郵件 */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300 text-sm font-medium">
                    電子郵件
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="pl-10 bg-gray-800 border-yellow-500 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                      placeholder="請輸入您的電子郵件"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 密碼 */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300 text-sm font-medium">
                    密碼
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="pl-10 pr-10 bg-gray-800 border-yellow-500 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                      placeholder="請輸入密碼（至少6個字符）"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 確認密碼 */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300 text-sm font-medium">
                    確認密碼
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      className="pl-10 bg-gray-800 border-yellow-500 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                      placeholder="請再次輸入密碼"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 註冊按鈕 */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      註冊中...
                    </div>
                  ) : (
                    '註冊'
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* 切換模式 */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              {isLogin ? '沒有帳號？' : '已有帳號？'}
              <button
                onClick={toggleMode}
                disabled={isLoading}
                className="text-yellow-400 hover:text-yellow-300 font-medium ml-1 transition-colors disabled:opacity-50"
              >
                {isLogin ? '建立新帳號' : '立即登入'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* 動畫樣式 */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LoginPage; 