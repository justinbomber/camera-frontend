'use client';

import Hls from 'hls.js/dist/hls.js';

export interface StreamPlayer {
  destroy: () => void;
}

export interface StreamServiceConfig {
  onError?: (message: string) => void;
  onLoading?: (isLoading: boolean) => void;
  onReady?: () => void;
}

class StreamService {
  private hls: Hls | null = null;
  private h265Player: any | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private config: StreamServiceConfig = {};
  private playAttempts: number = 0;
  private maxPlayAttempts: number = 3;
  private readonly playRetryDelay: number = 1500;
  private video: HTMLVideoElement | null = null;
  private streamUrl: string = '';
  private isDestroyed: boolean = false;
  
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private baseReconnectDelay: number = 3000;
  private isReconnecting: boolean = false;
  private hasReachedMaxRetries: boolean = false;

  constructor(config: StreamServiceConfig = {}) {
    this.config = config;
  }

  resetReconnectionState() {
    this.reconnectAttempts = 0;
    this.hasReachedMaxRetries = false;
    this.isReconnecting = false;
    this.playAttempts = 0;
  }

  private clearAllTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private addNoCacheParam(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  }

  private async detectStreamCodec(url: string): Promise<boolean> {
    try {
      const resp = await fetch(this.addNoCacheParam(url), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      const txt = await resp.text();
      return txt.toLowerCase().includes('h265') || txt.toLowerCase().includes('hevc');
    } catch {
      return false;
    }
  }

  private async attemptPlayVideo(video: HTMLVideoElement) {
    this.playAttempts = 0;
    await this.tryPlayWithRetry(video);
  }

  private async tryPlayWithRetry(video: HTMLVideoElement) {
    if (this.hasReachedMaxRetries) return;
    
    try {
      video.muted = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise;
        this.config.onLoading?.(false);
        this.playAttempts = 0;
        
        this.reconnectAttempts = Math.max(0, this.reconnectAttempts - 1);
      }
    } catch (error) {
      console.warn('播放失敗，嘗試重試', error);
      this.playAttempts++;
      
      if (this.playAttempts < this.maxPlayAttempts && !this.hasReachedMaxRetries) {
        setTimeout(() => this.tryPlayWithRetry(video), this.playRetryDelay);
      } else {
        console.error('播放失敗，已達最大重試次數');
        this.config.onLoading?.(false);
      }
    }
  }

  async initializeStream(video: HTMLVideoElement, streamUrl: string): Promise<void> {
    if (this.hasReachedMaxRetries) return;
    
    this.video = video;
    this.streamUrl = streamUrl;
    this.isDestroyed = false;
    
    this.config.onLoading?.(true);
    this.config.onError?.("");

    try {
      const isH265 = await this.detectStreamCodec(streamUrl);
      const url = streamUrl.endsWith('/index.m3u8') ? streamUrl : `${streamUrl}/index.m3u8`;
      const noCacheUrl = this.addNoCacheParam(url);

      if (isH265) {
        await this.initH265Stream(video, noCacheUrl);
      } else {
        await this.initHLSStream(video, noCacheUrl);
      }
    } catch (error: any) {
      console.error('初始化錯誤:', error);
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
      useWorker: true
    });

    player.on('ready', () => {
      this.config.onLoading?.(false);
      this.config.onReady?.();
    });

    player.on('error', (e: any) => {
      this.config.onError?.(`H265 播放錯誤: ${e}`);
      this.config.onLoading?.(false);
    });

    this.h265Player = player;
  }

  private async initHLSStream(video: HTMLVideoElement, url: string) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      this.initNativeHLS(video, url);
    } else if (Hls.isSupported()) {
      this.initHlsJs(video, url);
    } else {
      video.src = url;
      this.config.onError?.('此瀏覽器不支援 HLS');
      this.config.onLoading?.(false);
    }
  }

  private initNativeHLS(video: HTMLVideoElement, url: string) {
    video.src = url;
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    
    const eventHandlers = {
      loadedmetadata: () => {
        console.log('媒體元數據已載入');
        this.attemptPlayVideo(video);
      },
      
      error: (e: Event) => {
        console.error('視頻載入錯誤', e);
        this.config.onLoading?.(false);
        
        if (!this.isDestroyed && !this.hasReachedMaxRetries && !this.isReconnecting) {
          setTimeout(() => this.reconnectStream(), 5000);
        }
      },
      
      stalled: () => {
        console.warn('播放停滯');
      },
      
      waiting: () => {
        console.warn('等待數據');
        this.config.onLoading?.(true);
      },
      
      canplay: () => {
        console.log('可以播放');
        this.config.onLoading?.(false);
        if (video.paused) {
          video.play().catch(err => {
            console.warn('canplay時播放失敗:', err);
          });
        }
      },
      
      pause: () => {
        if (!video.ended && !this.isDestroyed && !this.hasReachedMaxRetries) {
          console.warn('播放意外暫停，嘗試恢復');
          setTimeout(() => {
            if (!this.isDestroyed && video.paused && !video.ended) {
              this.tryPlayWithRetry(video);
            }
          }, 2000);
        }
      },
      
      emptied: () => {
        console.warn('媒體被清空');
      }
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler as EventListener);
    });

    (video as any)._streamEventHandlers = eventHandlers;
  }

  private initHlsJs(video: HTMLVideoElement, url: string) {
    const hls = new Hls({ 
      enableWorker: true, 
      lowLatencyMode: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      maxBufferSize: 60 * 1000 * 1000,
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2,
      nudgeOffset: 0.2,
      nudgeMaxRetry: 3,
      xhrSetup: (xhr) => {
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '0');
      }
    });
    
    hls.attachMedia(video);
    
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(url);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.attemptPlayVideo(video);
    });

    hls.on(Hls.Events.ERROR, (_: any, data: any) => {
      if (data.fatal && !this.hasReachedMaxRetries) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('網絡錯誤，嘗試恢復');
            this.config.onLoading?.(true);
            this.clearAllTimers();
            this.reconnectTimer = setTimeout(() => {
              if (!this.hasReachedMaxRetries) {
                hls.startLoad();
                hls.loadSource(url);
              }
            }, 5000);
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('媒體錯誤，嘗試恢復');
            hls.recoverMediaError();
            break;
          default:
            console.error('無法恢復的錯誤', data);
            this.destroy();
            this.config.onError?.('播放器發生錯誤');
            break;
        }
      }
    });

    video.addEventListener('pause', () => {
      if (!video.ended && !this.hasReachedMaxRetries) {
        console.warn('播放中斷，嘗試恢復');
        setTimeout(() => {
          if (!this.isDestroyed && video.paused && !video.ended) {
            this.tryPlayWithRetry(video);
          }
        }, 2000);
      }
    });

    this.hls = hls;
  }

  private async reconnectStream() {
    if (this.isDestroyed || this.isReconnecting || this.hasReachedMaxRetries) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.hasReachedMaxRetries = true;
      this.config.onError?.('連線不穩定，請檢查網路後手動重新連線');
      this.config.onLoading?.(false);
      this.isReconnecting = false;
      return;
    }

    console.log(`第 ${this.reconnectAttempts} 次重連嘗試`);
    
    try {
      this.cleanupCurrentStream();
      
      const delay = this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 15000)));
      
      if (!this.isDestroyed && this.video && !this.hasReachedMaxRetries) {
        await this.initializeStream(this.video, this.streamUrl);
      }
    } catch (error) {
      console.error('重連失敗', error);
      if (!this.hasReachedMaxRetries) {
        setTimeout(() => this.reconnectStream(), this.baseReconnectDelay);
      }
    } finally {
      this.isReconnecting = false;
    }
  }

  private cleanupCurrentStream() {
    this.clearAllTimers();
    
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    if (this.h265Player) {
      this.h265Player.destroy();
      this.h265Player = null;
    }
    
    if (this.video) {
      this.video.removeAttribute('src');
      this.video.load();
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.isReconnecting = false;
    this.clearAllTimers();
    
    if (this.video && (this.video as any)._streamEventHandlers) {
      const handlers = (this.video as any)._streamEventHandlers;
      Object.entries(handlers).forEach(([event, handler]) => {
        this.video?.removeEventListener(event, handler as EventListener);
      });
      delete (this.video as any)._streamEventHandlers;
    }
    
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.h265Player) {
      this.h265Player.destroy();
      this.h265Player = null;
    }
    
    this.video = null;
    this.streamUrl = '';
  }
}

export default StreamService; 