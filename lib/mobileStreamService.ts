'use client';

import Hls from 'hls.js/dist/hls.js';

export interface MobileStreamServiceConfig {
  onError?: (message: string) => void;
  onLoading?: (loading: boolean) => void;
  onReady?: () => void;
  onConnectionLost?: () => void;
  onReconnecting?: () => void;
}

class MobileStreamService {
  private hls: Hls | null = null;
  private h265Player: any | null = null;
  private config: MobileStreamServiceConfig = {};
  private video: HTMLVideoElement | null = null;
  private streamUrl: string = '';
  private isDestroyed: boolean = false;
  private playCheckInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures: number = 0;
  private hasFirstPlay: boolean = false; // 追蹤是否已經成功播放過
  
  // 新增：重連控制
  private lastReconnectTime: number = 0;
  private reconnectCooldown: number = 5000; // 5秒重連冷卻時間
  private isReconnecting: boolean = false;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  private lastPlayTime: number = 0;
  private stallDetectionTimeout: NodeJS.Timeout | null = null;
  
  // 手機端專用配置 - minimal intervention
  private readonly mobileConfig = {
    maxRetries: 3, // 增加重試次數
    retryDelay: 5000,
    networkRetryDelay: 3000,
    stallDetectionDelay: 10000, // 10秒無播放視為停滯
  };

  constructor(config: MobileStreamServiceConfig = {}) {
    this.config = config;
  }

  private addNoCacheParam(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}&mobile=1`;
  }

  private async detectStreamCodec(url: string): Promise<boolean> {
    try {
      const resp = await fetch(this.addNoCacheParam(url), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      const txt = await resp.text();
      return txt.toLowerCase().includes('h265') || txt.toLowerCase().includes('hevc');
    } catch (error) {
      console.warn('手機端編解碼器檢測失敗:', error);
      return false; // 預設為H264
    }
  }

  // 新增：智能連線監控 - 偵測播放異常並自動重連
  private startConnectionMonitoring() {
    this.stopConnectionMonitoring()
    
    console.log('手機端啟動智能連線監控')
    
    // 每2秒檢查一次播放狀態
    this.connectionMonitorInterval = setInterval(() => {
      if (this.isDestroyed || !this.video || this.isReconnecting) return
      
      const currentTime = this.video.currentTime
      const now = Date.now()
      
      // 檢查是否有播放進度
      if (currentTime > 0) {
        this.lastPlayTime = now
        this.consecutiveFailures = 0 // 重置失敗計數
      } else if (this.hasFirstPlay && (now - this.lastPlayTime) > this.mobileConfig.stallDetectionDelay) {
        // 如果已經播放過但現在停滯超過10秒，視為連線異常
        console.warn('手機端偵測到播放停滯，準備重連')
        this.handleConnectionLoss()
      }
      
      // 檢查視頻是否意外暫停
      if (this.hasFirstPlay && this.video.paused && !this.video.ended) {
        console.warn('手機端偵測到意外暫停')
        this.video.play().catch(() => {
          console.warn('恢復播放失敗，可能需要重連')
          this.handleConnectionLoss()
        })
      }
    }, 2000)
  }

  private stopConnectionMonitoring() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval)
      this.connectionMonitorInterval = null
    }
    if (this.stallDetectionTimeout) {
      clearTimeout(this.stallDetectionTimeout)
      this.stallDetectionTimeout = null
    }
  }

  // 新增：處理連線中斷
  private handleConnectionLoss() {
    if (this.isReconnecting || this.isDestroyed) return
    
    const now = Date.now()
    if (now - this.lastReconnectTime < this.reconnectCooldown) {
      console.log(`手機端重連冷卻中，剩餘 ${Math.ceil((this.reconnectCooldown - (now - this.lastReconnectTime)) / 1000)} 秒`)
      return
    }
    
    this.lastReconnectTime = now
    this.isReconnecting = true
    this.consecutiveFailures++
    
    console.log(`手機端開始重連 (第 ${this.consecutiveFailures} 次)`)
    
    // 通知UI顯示重連狀態
    this.config.onConnectionLost?.()
    this.config.onReconnecting?.()
    this.config.onLoading?.(true)
    
    // 如果重連次數過多，停止嘗試
    if (this.consecutiveFailures > this.mobileConfig.maxRetries) {
      console.error('手機端重連次數超過限制，停止重連')
      this.config.onError?.('連線失敗次數過多，請檢查網路連線')
      this.config.onLoading?.(false)
      this.isReconnecting = false
      return
    }
    
    // 執行重連
    this.performReconnect()
  }

  // 新增：執行重連
  private async performReconnect() {
    try {
      console.log('手機端執行重連...')
      
      // 清理現有連線
      if (this.hls) {
        this.hls.destroy()
        this.hls = null
      }
      if (this.h265Player) {
        this.h265Player.destroy()
        this.h265Player = null
      }
      
      // 重置視頻元素
      if (this.video) {
        this.video.pause()
        this.video.src = ''
        this.video.load()
      }
      
      // 等待一下再重新初始化
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (this.isDestroyed) return
      
      // 重新初始化串流
      const isH265 = await this.detectStreamCodec(this.streamUrl)
      const url = this.streamUrl.endsWith('/index.m3u8') ? this.streamUrl : `${this.streamUrl}/index.m3u8`
      const noCacheUrl = this.addNoCacheParam(url)
      
      if (isH265) {
        await this.initH265Stream(this.video!, noCacheUrl)
      } else {
        await this.initMobileHLSStream(this.video!, noCacheUrl)
      }
      
      console.log('手機端重連成功')
      this.isReconnecting = false
      this.config.onLoading?.(false)
      
    } catch (error) {
      console.error('手機端重連失敗:', error)
      this.isReconnecting = false
      this.config.onError?.(`重連失敗: ${error}`)
      this.config.onLoading?.(false)
      
      // 如果還有重連機會，設置下次重連
      if (this.consecutiveFailures <= this.mobileConfig.maxRetries) {
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.handleConnectionLoss()
          }
        }, this.mobileConfig.retryDelay)
      }
    }
  }

  async initializeStream(video: HTMLVideoElement, streamUrl: string): Promise<void> {
    this.video = video;
    this.streamUrl = streamUrl;
    this.isDestroyed = false;
    this.hasFirstPlay = false; // 重置播放狀態
    this.isReconnecting = false; // 重置重連狀態
    this.consecutiveFailures = 0; // 重置失敗計數
    this.lastPlayTime = Date.now(); // 初始化播放時間
    
    this.config.onLoading?.(true);
    this.config.onError?.("");

    // 清理之前的監控
    this.stopConnectionMonitoring();

    try {
      const isH265 = await this.detectStreamCodec(streamUrl);
      const url = streamUrl.endsWith('/index.m3u8') ? streamUrl : `${streamUrl}/index.m3u8`;
      const noCacheUrl = this.addNoCacheParam(url);

      if (isH265) {
        await this.initH265Stream(video, noCacheUrl);
      } else {
        await this.initMobileHLSStream(video, noCacheUrl);
      }

      // 啟動連線監控
      this.startConnectionMonitoring();
      console.log('手機端串流初始化完成，連線監控已啟動')
    } catch (error: any) {
      console.error('手機端初始化錯誤:', error);
      this.config.onError?.(`初始化錯誤: ${error.message}`);
      this.config.onLoading?.(false);
    }
  }

  private async initH265Stream(video: HTMLVideoElement, streamUrl: string) {
    if (this.h265Player) {
      this.h265Player.destroy();
    }

    const player = new (window as any).H265webjs({
      player: video,
      url: streamUrl,
      useWorker: true,
      workerFile: 'https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/worker.js'
    });

    player.on('ready', () => {
      this.config.onLoading?.(false);
      this.config.onReady?.();
      this.hasFirstPlay = true;
      console.log('手機端H265播放器就緒');
    });

    player.on('error', (e: any) => {
      this.config.onError?.(`H265 播放錯誤: ${e}`);
      this.config.onLoading?.(false);
    });

    this.h265Player = player;
  }

  private async initMobileHLSStream(video: HTMLVideoElement, url: string) {
    // 優先使用原生HLS播放（iOS Safari）
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      this.initMobileNativeHLS(video, url);
    } else if (Hls.isSupported()) {
      this.initMobileHlsJs(video, url);
    } else {
      video.src = url;
      this.config.onError?.('此瀏覽器不支援 HLS 播放');
      this.config.onLoading?.(false);
    }
  }

  private initMobileNativeHLS(video: HTMLVideoElement, url: string) {
    video.src = url;
    video.playsInline = true;
    video.muted = true;
    // 改善黑畫面問題：設定preload為metadata
    video.preload = 'metadata';
    
    const eventHandlers = {
      loadedmetadata: () => {
        console.log('手機端原生HLS元數據已載入');
        // 直接自動播放，不需要用戶交互
        video.muted = true;
        video.playsInline = true;
        video.play().catch(err => {
          console.warn('loadedmetadata時播放失敗:', err);
        });
      },
      
      canplay: () => {
        console.log('手機端原生HLS可以播放');
        this.config.onLoading?.(false);
        this.config.onReady?.();
        // 如果還沒開始播放，立即嘗試播放
        if (video.paused && !this.hasFirstPlay) {
          video.play().catch(err => {
            console.warn('canplay時播放失敗:', err);
          });
        }
      },
      
      error: (e: Event) => {
        console.error('手機端原生HLS載入錯誤', e);
        // 移除錯誤訊息顯示
        this.config.onLoading?.(false);
      },
      
      play: () => {
        if (!this.hasFirstPlay) {
          this.hasFirstPlay = true;
          console.log('手機端首次播放成功');
        }
        this.config.onLoading?.(false);
      },
      
      // 處理黑畫面問題：當視頻暫停時嘗試重新播放
      pause: () => {
        if (!video.ended && this.hasFirstPlay) {
          console.log('手機端視頻意外暫停，嘗試恢復播放');
          setTimeout(() => {
            if (!video.ended && video.paused) {
              video.play().catch(err => {
                console.warn('恢復播放失敗:', err);
              });
            }
          }, 100);
        }
      },
      
      // 處理載入停滯問題
      stalled: () => {
        console.log('手機端播放停滯，嘗試重新載入');
        if (!this.hasFirstPlay) {
          setTimeout(() => {
            video.load();
            video.play().catch(err => {
              console.warn('stalled時播放失敗:', err);
            });
          }, 1000);
        }
      },
      
      // 簡化emptied事件處理
      emptied: () => {
        console.log('手機端媒體被清空');
        this.hasFirstPlay = false;
      }
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler as EventListener);
    });

    (video as any)._mobileStreamEventHandlers = eventHandlers;
  }

  private initMobileHlsJs(video: HTMLVideoElement, url: string) {
    // 手機端優化的HLS.js配置 - 更保守的設定
    const hls = new Hls({ 
      enableWorker: false, // 手機端關閉worker以避免兼容性問題
      lowLatencyMode: false, // 關閉低延遲模式以提高穩定性
      maxBufferLength: 10, // 進一步減少緩衝區大小
      maxMaxBufferLength: 20,
      maxBufferSize: 20 * 1000 * 1000, // 20MB
      maxBufferHole: 2, // 增加容錯
      highBufferWatchdogPeriod: 5,
      nudgeOffset: 0.1,
      nudgeMaxRetry: 3,
      maxStarvationDelay: 6,
      maxLoadingDelay: 6,
      minAutoBitrate: 0,
      // 手機端專用請求配置
      xhrSetup: (xhr) => {
        xhr.timeout = 15000; // 增加超時時間
        xhr.setRequestHeader('Cache-Control', 'no-cache');
      }
    });
    
    // 改善黑畫面問題：設定video屬性
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    
    hls.attachMedia(video);
    
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('手機端HLS.js媒體已附加');
      hls.loadSource(url);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('手機端HLS.js清單已解析');
      // 直接自動播放
      video.muted = true;
      video.playsInline = true;
      video.play().catch(err => {
        console.warn('manifest parsed時播放失敗:', err);
      });
    });

    hls.on(Hls.Events.FRAG_LOADED, () => {
      this.config.onLoading?.(false);
    });

    hls.on(Hls.Events.ERROR, (_: any, data: any) => {
      console.error('手機端HLS.js錯誤:', data);
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('手機端網絡錯誤 - 讓HLS自己處理');
            // 移除錯誤訊息顯示，簡化處理
            setTimeout(() => {
              if (!this.isDestroyed && this.hls && this.video) {
                // 檢查HLS是否還在工作，但不顯示錯誤
                if (this.video.readyState === 0) {
                  console.warn('網絡連接不穩定，但不顯示錯誤訊息');
                }
              }
            }, 10000);
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('手機端媒體錯誤 - 嘗試單次恢復');
            try {
              hls.recoverMediaError();
            } catch (e) {
              console.error('手機端媒體錯誤恢復失敗', e);
              // 移除錯誤訊息顯示
            }
            break;
          default:
            console.error('手機端其他錯誤', data);
            // 移除錯誤訊息顯示
            break;
        }
      } else {
        // 非致命錯誤，完全忽略，讓HLS自己處理
        console.log('手機端HLS.js非致命錯誤 - 忽略:', data.type);
      }
    });

    // 處理播放事件
    video.addEventListener('play', () => {
      if (!this.hasFirstPlay) {
        this.hasFirstPlay = true;
        console.log('手機端HLS.js首次播放成功');
      }
    });

    // 處理黑畫面問題
    video.addEventListener('canplay', () => {
      console.log('手機端HLS.js可以播放');
      if (video.paused && !this.hasFirstPlay) {
        video.play().catch(err => {
          console.warn('canplay時播放失敗:', err);
        });
      }
    });

    this.hls = hls;
  }

  destroy() {
    this.isDestroyed = true;
    
    // 停止連線監控
    this.stopConnectionMonitoring();
    
    // 清理事件監聽器
    if (this.video && (this.video as any)._mobileStreamEventHandlers) {
      const handlers = (this.video as any)._mobileStreamEventHandlers;
      Object.entries(handlers).forEach(([event, handler]) => {
        this.video?.removeEventListener(event, handler as EventListener);
      });
      delete (this.video as any)._mobileStreamEventHandlers;
    }
    
    // 清理HLS播放器
    if (this.hls) {
      try {
        this.hls.destroy();
      } catch (error) {
        console.warn('HLS銷毀時發生錯誤:', error);
      }
      this.hls = null;
    }
    
    // 清理H265播放器
    if (this.h265Player) {
      try {
        this.h265Player.destroy();
      } catch (error) {
        console.warn('H265播放器銷毀時發生錯誤:', error);
      }
      this.h265Player = null;
    }
    
    // 清理video元素
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
      this.video = null;
    }
    
    this.streamUrl = '';
    this.consecutiveFailures = 0;
    this.hasFirstPlay = false;
  }
}

export default MobileStreamService; 