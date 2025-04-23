"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Video, XCircle, Check } from "lucide-react"
import * as HlsModule from "hls.js"
const Hls = HlsModule.default || HlsModule

interface StreamCellProps {
  index: number
  streamUrl: string
  isRemoveMode: boolean
  isSelected?: boolean
  isH265?: boolean
  onClick: () => void
}

export default function StreamCell({ index, streamUrl, isRemoveMode, isSelected = false, isH265 = false, onClick }: StreamCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsModule.default | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 處理視頻播放的函數，集中管理播放邏輯
  const attemptPlayVideo = () => {
    if (!videoRef.current) return Promise.reject(new Error("無視頻元素"));
    
    // 設置載入狀態
    setIsLoading(true);
    
    const playPromise = videoRef.current.play();
    
    if (playPromise !== undefined) {
      return playPromise
        .then(() => {
          console.log(`Stream ${index + 1} 開始播放成功`);
          setErrorMessage('');
          setIsLoading(false);
        })
        .catch((error: Error) => {
          console.error(`Stream ${index + 1} 播放錯誤:`, error);
          
          // 過濾掉"播放請求被中斷"的錯誤
          if (!error.message.includes('interrupted') && 
              !error.message.includes('中斷') &&
              !error.message.includes('play() request was interrupted')) {
            setErrorMessage(`播放錯誤: ${error.message}`);
          }
          
          setIsLoading(false);
          return Promise.reject(error);
        });
    }
    
    setIsLoading(false);
    return Promise.resolve();
  };

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    // 先清理舊的 HLS 實例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setErrorMessage('');

    // 確保流URL以 /index.m3u8 結尾
    const hlsUrl = streamUrl.endsWith('/index.m3u8') ? streamUrl : `${streamUrl}/index.m3u8`;
    console.log(`Stream ${index + 1} 正在連接到 ${hlsUrl} (HLS)`);

    // 檢查設備是否原生支持 HLS
    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // 原生支持 HLS (iOS, Safari)
      videoRef.current.src = hlsUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        attemptPlayVideo().catch((err: Error) => {
          console.error("播放失敗:", err);
        });
      });
      videoRef.current.addEventListener('error', () => {
        const error = videoRef.current?.error;
        console.error(`視頻錯誤:`, error);
        setErrorMessage(`視頻載入錯誤: ${error?.message || '未知錯誤'}`);
        setIsLoading(false);
      });
    } 
    else if (Hls.isSupported()) {
      // 使用 Hls.js 播放 (Chrome, Firefox, Edge 等)
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false; // 調整 CORS 設置
        }
      });
      
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log(`HLS 媒體已附加到視頻元素`);
        hls.loadSource(hlsUrl);
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, (_event: any, data: any) => {
        console.log(`HLS 清單已解析，可用品質等級: ${data.levels.length}`);
        attemptPlayVideo().catch((err: Error) => {
          console.error("播放失敗:", err);
        });
      });
      
      hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(`HLS 網絡錯誤:`, data.details);
              setErrorMessage(`網絡錯誤: ${data.details}`);
              // 嘗試恢復網絡錯誤
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(`HLS 媒體錯誤:`, data.details);
              setErrorMessage(`媒體錯誤: ${data.details}`);
              // 嘗試恢復媒體錯誤
              hls.recoverMediaError();
              break;
            default:
              console.error(`HLS 致命錯誤:`, data);
              setErrorMessage(`HLS 錯誤: ${data.details}`);
              hls.destroy();
              break;
          }
        } else {
          console.warn(`HLS 非致命錯誤:`, data);
        }
        setIsLoading(false);
      });
      
      // 保存 hls 實例以便清理
      hlsRef.current = hls;
    } 
    else {
      // 不支持 HLS 的瀏覽器，嘗試直接播放
      console.warn("此瀏覽器不支持 HLS 播放，嘗試直接播放");
      videoRef.current.src = hlsUrl;
      setErrorMessage("此瀏覽器可能不支援 HLS 串流");
    }

    // 創建並管理事件監聽器
    const eventListeners = new Map();
    
    // 播放事件處理
    const handlePlay = () => {
      setErrorMessage('');
      setIsLoading(false);
    };
    
    // 媒體已經可以播放的事件處理
    const handleCanPlayThrough = () => {
      if (videoRef.current && videoRef.current.paused) {
        attemptPlayVideo().catch(() => {
          // 播放失敗，但我們已經在attemptPlayVideo中處理了錯誤
        });
      }
    };
    
    // 錯誤事件處理
    const handleError = () => {
      if (videoRef.current && videoRef.current.error) {
        setErrorMessage(`視頻錯誤: ${videoRef.current.error.message}`);
        setIsLoading(false);
      }
    };

    // 添加所有視頻事件監聽器
    if (videoRef.current) {
      eventListeners.set('play', handlePlay);
      eventListeners.set('canplaythrough', handleCanPlayThrough);
      eventListeners.set('error', handleError);
      
      // 註冊所有事件
      eventListeners.forEach((handler, event) => {
        videoRef.current?.addEventListener(event, handler);
      });
    }

    // 清理函數
    return () => {
      // 移除所有事件監聽器
      if (videoRef.current) {
        eventListeners.forEach((handler, event) => {
          videoRef.current?.removeEventListener(event, handler);
        });
        
        // 停止視頻並清除源
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      
      // 銷毀 HLS 實例
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, index]);

  // 顯示錯誤信息或加載狀態
  const getStatusMessage = () => {
    if (isLoading) {
      return "載入中...";
    }
    
    // 如果有錯誤訊息且不為空字串，則顯示
    if (errorMessage && errorMessage.trim() !== '') {
      // 過濾掉特定錯誤，例如"播放請求被中斷"錯誤
      if (errorMessage.includes('interrupted') || errorMessage.includes('中斷')) {
        return ""; // 不顯示中斷類錯誤
      }
      return errorMessage;
    }
    
    return "";
  };

  // 決定卡片的樣式，根據移除模式和選中狀態
  const getCardClasses = () => {
    let classes = "aspect-video overflow-hidden ";
    
    if (isRemoveMode) {
      if (isSelected) {
        classes += "cursor-pointer ring-2 ring-blue-500 ring-offset-2 bg-blue-50";
      } else {
        classes += "cursor-pointer hover:ring-2 hover:ring-gray-400 hover:ring-offset-1";
      }
    }
    
    return classes;
  };

  return (
    <Card
      className={getCardClasses()}
      onClick={onClick}
    >
      <CardContent className="p-0 h-full flex items-center justify-center relative">
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            loop
            controls={false}
            className="w-full h-full object-cover bg-slate-900" 
          />
          {isRemoveMode && (
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isSelected ? 'opacity-70' : 'opacity-40'}`}>
              {isSelected ? (
                <Check className="w-12 h-12 text-blue-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500 opacity-70" />
              )}
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Stream {index + 1}
          </div>
          {getStatusMessage() && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm">
              {getStatusMessage()}
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </>
      </CardContent>
    </Card>
  );
}
