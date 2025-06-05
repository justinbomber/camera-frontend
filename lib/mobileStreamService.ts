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
  private hasFirstPlay: boolean = false;

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

  // 移除所有自動重連機制

  async initializeStream(video: HTMLVideoElement, streamUrl: string): Promise<void> {
    this.video = video;
    this.streamUrl = streamUrl;
    this.isDestroyed = false;
    this.hasFirstPlay = false;
    
    this.config.onLoading?.(true);
    this.config.onError?.("");

    try {
      const isH265 = await this.detectStreamCodec(streamUrl);
      const url = streamUrl.endsWith('/index.m3u8') ? streamUrl : `${streamUrl}/index.m3u8`;
      const noCacheUrl = this.addNoCacheParam(url);

      if (isH265) {
        await this.initH265Stream(video, noCacheUrl);
      } else {
        await this.initMobileHLSStream(video, noCacheUrl);
      }

      console.log('手機端串流初始化完成，無自動恢復機制')
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
      
      // 移除自動播放恢復機制
      pause: () => {
        console.log('手機端視頻暫停');
      },
      
      stalled: () => {
        console.log('手機端播放停滯');
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
        // 移除所有自動恢復機制，只記錄錯誤
        console.error('手機端HLS.js致命錯誤，類型:', data.type);
        this.config.onError?.(`串流錯誤: ${data.type}`);
        this.config.onLoading?.(false);
      } else {
        // 非致命錯誤，只記錄但不處理
        console.log('手機端HLS.js非致命錯誤:', data.type);
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
    this.hasFirstPlay = false;
  }
}

export default MobileStreamService; 