"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Video, XCircle, Check } from "lucide-react"
import * as HlsModule from "hls.js"
import H265webjs from "h265web.js/dist/index"
const Hls = HlsModule.default || HlsModule

interface StreamCellProps {
  index: number
  streamUrl: string
  isRemoveMode: boolean
  isSelected?: boolean
  isH265?: boolean
  isEmpty?: boolean
  onClick: () => void
}

export default function StreamCell({ index, streamUrl, isRemoveMode, isSelected = false, isH265 = false, isEmpty = false, onClick }: StreamCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsModule.default | null>(null)
  const h265PlayerRef = useRef<H265webjs | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  // 檢測串流編碼格式
  const detectStreamCodec = async (url: string): Promise<boolean> => {
    try {
      // 這裡我們使用fetch來獲取m3u8文件的內容
      const response = await fetch(url);
      const content = await response.text();
      
      // 檢查m3u8內容是否包含h265或hevc的標識
      const isH265 = content.toLowerCase().includes('h265') || 
                     content.toLowerCase().includes('hevc');
      
      console.log(`Stream codec detection result: ${isH265 ? 'H265' : 'H264'}`);
      return isH265;
    } catch (error) {
      console.error('Error detecting stream codec:', error);
      return false; // 如果無法檢測，預設為H264
    }
  }

  // 處理視頻播放的函數，集中管理播放邏輯
  const attemptPlayVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    // 設置載入狀態
    setIsLoading(true);
    
    try {
      await video.play();
    } catch (error) {
      console.error(`播放錯誤:`, error);
      setErrorMessage(`播放錯誤: ${error}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!streamUrl || !video) return;

    // 先清理舊的 HLS 實例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setErrorMessage('');

    const initializePlayer = async () => {
      try {
        // 檢測串流編碼格式
        const isStreamH265 = await detectStreamCodec(streamUrl);
        
        if (isStreamH265) {
          // 使用H265Web.js播放
          if (h265PlayerRef.current) {
            h265PlayerRef.current.destroy();
          }
          
          const h265Player = new H265webjs({
            player: video,
            debug: true,
            url: streamUrl,
            useWorker: true,
          });

          h265Player.on('ready', () => {
            console.log('H265 player ready');
            setIsLoading(false);
          });

          h265Player.on('error', (error: any) => {
            console.error('H265 player error:', error);
            setErrorMessage(`H265播放錯誤: ${error}`);
            setIsLoading(false);
          });

          h265PlayerRef.current = h265Player;
        } else {
          // 確保流URL以 /index.m3u8 結尾
          const hlsUrl = streamUrl.endsWith('/index.m3u8') ? streamUrl : `${streamUrl}/index.m3u8`;
          console.log(`Stream ${index + 1} 正在連接到 ${hlsUrl} (HLS)`);

          // 檢查設備是否原生支持 HLS
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // 原生支持 HLS (iOS, Safari)
            video.src = hlsUrl;
            video.addEventListener('loadedmetadata', () => {
              attemptPlayVideo().catch((error: Error) => {
                console.error("播放失敗:", error);
              });
            });
            video.addEventListener('error', (error) => {
              console.error(`視頻錯誤:`, error);
              setErrorMessage(`視頻載入錯誤: ${error?.message || '未知錯誤'}`);
              setIsLoading(false);
            });
          } 
          else if (Hls.isSupported()) {
            let hls: HlsModule.default | null = null;

            const reconnectHLS = () => {
              console.log('嘗試重新連接HLS串流...');
              if (hls) {
                hls.loadSource(hlsUrl);
                hls.startLoad();
              }
            };

            const handleError = (_event: any, data: any) => {
              if (data.fatal) {
                switch(data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error(`HLS 網絡錯誤:`, data.details);
                    setErrorMessage(`網絡錯誤: ${data.details}`);
                    clearReconnectTimer();
                    reconnectTimerRef.current = setTimeout(reconnectHLS, 5000);
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error(`HLS 媒體錯誤:`, data.details);
                    setErrorMessage(`媒體錯誤: ${data.details}`);
                    clearReconnectTimer();
                    reconnectTimerRef.current = setTimeout(reconnectHLS, 5000);
                    break;
                  default:
                    console.error(`HLS 致命錯誤:`, data);
                    setErrorMessage(`HLS 錯誤: ${data.details}`);
                    clearReconnectTimer();
                    reconnectTimerRef.current = setTimeout(reconnectHLS, 5000);
                    break;
                }
              } else {
                console.warn(`HLS 非致命錯誤:`, data);
              }
              setIsLoading(false);
            };

            // 初始化 HLS
            hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
              xhrSetup: (xhr: XMLHttpRequest) => {
                xhr.withCredentials = false;
              }
            });

            hls.attachMedia(video);
            
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              console.log(`HLS 媒體已附加到視頻元素`);
              if (hls) {
                hls.loadSource(hlsUrl);
              }
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log(`HLS 清單已解析`);
              clearReconnectTimer();
              attemptPlayVideo().then(() => {
                if (video.duration) {
                  video.currentTime = video.duration;
                }
              }).catch((err: Error) => {
                console.error("播放失敗:", err);
              });
            });

            hls.on(Hls.Events.ERROR, handleError);
            hlsRef.current = hls;
          } 
          else {
            // 不支持 HLS 的瀏覽器，嘗試直接播放
            console.warn("此瀏覽器不支持 HLS 播放，嘗試直接播放");
            video.src = hlsUrl;
            setErrorMessage("此瀏覽器可能不支援 HLS 串流");
          }
        }
      } catch (error) {
        console.error('Error initializing player:', error);
        setErrorMessage('初始化播放器時發生錯誤');
        setIsLoading(false);
      }
    }

    initializePlayer();

    // 創建並管理事件監聽器
    const eventListeners = new Map();
    
    // 播放事件處理
    const handlePlay = () => {
      setErrorMessage('');
      setIsLoading(false);
    };
    
    // 媒體已經可以播放的事件處理
    const handleCanPlayThrough = () => {
      if (video && video.paused) {
        attemptPlayVideo().catch(() => {
          // 播放失敗，但我們已經在attemptPlayVideo中處理了錯誤
        });
      }
    };
    
    // 錯誤事件處理
    const handleError = () => {
      if (video && video.error) {
        setErrorMessage(`視頻錯誤: ${video.error.message}`);
        setIsLoading(false);
      }
    };

    // 添加所有視頻事件監聽器
    if (video) {
      eventListeners.set('play', handlePlay);
      eventListeners.set('canplaythrough', handleCanPlayThrough);
      eventListeners.set('error', handleError);
      
      // 註冊所有事件
      eventListeners.forEach((handler, event) => {
        video.addEventListener(event, handler);
      });
    }

    // 清理函數
    const cleanup = () => {
      clearReconnectTimer();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (h265PlayerRef.current) {
        h265PlayerRef.current.destroy();
        h265PlayerRef.current = null;
      }
    };

    // 組件卸載時清理
    return cleanup;
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
    let classes = "w-full h-full relative ";
    
    if (isRemoveMode) {
      if (isSelected) {
        classes += "cursor-pointer ring-2 ring-blue-500 ring-offset-2 bg-blue-50 ";
      } else {
        classes += "cursor-pointer hover:ring-2 hover:ring-gray-400 hover:ring-offset-1 ";
      }
    }

    if (isEmpty) {
      classes += "bg-slate-100 border border-slate-200 ";
    }
    
    return classes.trim();
  };

  // 如果是空單元格，顯示占位符
  if (isEmpty) {
    return (
      <div className={getCardClasses()} onClick={onClick}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Video className="w-8 h-8 mb-1" />
            <div className="text-xs">No Stream</div>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Stream {index + 1}
        </div>
      </div>
    );
  }

  return (
    <div className={getCardClasses()} onClick={onClick}>
      <div className="absolute inset-0">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          loop
          controls={false}
          className="w-full h-full object-contain bg-black" 
        />
        {isRemoveMode && (
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isSelected ? 'opacity-70' : 'opacity-40'}`}>
            {isSelected ? (
              <Check className="w-8 h-8 text-blue-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500 opacity-70" />
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
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}
