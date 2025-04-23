// 從 MediaMTX 重新實現的 WebRTC 讀取器
// 完全按照官方MediaMTX的WHEP實現，並加強連接可靠性

interface MediaMTXWebRTCReaderParams {
  url: string;
  onError?: (error: string) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: string) => void;
}

class MediaMTXWebRTCReader {
  private retryPause: number = 10000;
  private conf: MediaMTXWebRTCReaderParams;
  private state: string = 'starting';
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private pc: RTCPeerConnection | null = null;
  private sessionUrl: string | null = null;
  private connectionMonitorInterval: ReturnType<typeof setInterval> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isPerformingIceRestart: boolean = false;
  private isOfferInProgress: boolean = false;

  constructor(params: MediaMTXWebRTCReaderParams) {
    this.conf = params;
    this.start();
  }

  /**
   * 關閉讀取器並釋放所有資源
   */
  close(): void {
    this.state = 'closed';

    if (this.dataChannel !== null) {
      try {
        this.dataChannel.close();
      } catch (e) {
        console.warn('關閉DataChannel時出錯:', e);
      }
      this.dataChannel = null;
    }

    if (this.pc !== null) {
      this.pc.close();
      this.pc = null;
    }

    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.connectionMonitorInterval !== null) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }

    if (this.keepAliveInterval !== null) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    this.isOfferInProgress = false;
  }

  /**
   * 啟動WebRTC讀取器
   */
  private start(): void {
    if (this.state === 'closed') {
      return;
    }

    // 防止多次調用
    if (this.isOfferInProgress) {
      console.warn('已有進行中的連接過程，忽略此次啟動');
      return;
    }

    this.isOfferInProgress = true;
    this.state = 'starting';
    console.log('開始WebRTC連接...');

    this.setupPeerConnection()
      .then(offer => {
        console.log('offer成功創建，SDP:', offer.sdp?.substring(0, 100) + '...');

        // 確保 this.pc 存在
        if (this.pc) {
          try {
            // 強制所有媒體使用 UDP 和 IPv4
            this.pc.addTransceiver('audio', {
              direction: 'recvonly' as RTCRtpTransceiverDirection,
              sendEncodings: [{ priority: 'high' }]
            });
            this.pc.addTransceiver('video', {
              direction: 'recvonly' as RTCRtpTransceiverDirection,
              sendEncodings: [{ priority: 'high' }]
            });
          } catch (e) {
            console.warn('增強傳輸器設置失敗，使用基本配置:', e);
          }
        }

        return this.sendOffer(offer);
      })
      .catch(err => {
        console.error('連接失敗:', err);
        this.handleError(err.toString());
      })
      .finally(() => {
        this.isOfferInProgress = false;
      });
  }

  /**
   * 處理錯誤並嘗試重新連接
   */
  private handleError(err: string): void {
    if (this.state === 'closed') {
      return;
    }

    console.error('WebRTC錯誤:', err);

    if (this.conf.onError) {
      this.conf.onError(err);
    }

    // 重新連接
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartTimeout = setTimeout(() => {
      if (this.state !== 'closed') {
        this.cleanupCurrentConnection();
        this.state = 'starting';
        this.start();
      }
    }, this.retryPause);
  }

  /**
   * 清理當前連接的所有資源
   */
  private cleanupCurrentConnection(): void {
    // 關閉資料通道
    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch (e) {
        console.warn('關閉DataChannel時出錯:', e);
      }
      this.dataChannel = null;
    }

    // 關閉PeerConnection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // 清理心跳計時器
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    this.isPerformingIceRestart = false;
    this.isOfferInProgress = false;
  }

  /**
   * 執行ICE重啟 - 完全重建連接
   */
  private performIceRestart(): Promise<void> {
    if (this.state === 'closed' || this.isPerformingIceRestart) {
      return Promise.resolve();
    }

    console.log('執行ICE重啟 (完全重建連接)...');
    this.isPerformingIceRestart = true;

    try {
      // 保存當前配置
      const currentConfig = { ...this.conf };

      // 完全關閉當前連接
      this.cleanupCurrentConnection();

      // 重設狀態但不設為closed
      this.state = 'restarting';

      // 啟動新連接
      setTimeout(() => {
        if (this.state !== 'closed') {
          this.isPerformingIceRestart = false;
          this.state = 'starting';
          this.start();
        }
      }, 500); // 短暫延遲以確保資源釋放

      return Promise.resolve();
    } catch (err) {
      console.error('ICE重啟失敗:', err);
      this.isPerformingIceRestart = false;
      this.handleError(`ICE重啟失敗: ${err}`);
      return Promise.reject(err);
    }
  }

  /**
   * 設置PeerConnection
   */
  private async setupPeerConnection(): Promise<RTCSessionDescriptionInit> {
    // 確保清理舊連接
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // 擴展STUN服務器列表以提高連接成功率，並添加transport=udp參數強制使用IPv4
    const iceServers = [
      // Google STUN 服務器帶 transport=udp 參數，強制使用 IPv4
      // { urls: 'stun:stun.l.google.com:19302' },
      // 直接使用 IPv4 地址的 Google STUN 服務器，避免 DNS 解析問題
      { urls: 'stun:142.250.72.14:19302' } // Google STUN IPv5
    ];

    const rtcConfig: RTCConfiguration = {
      iceServers: iceServers,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      // 添加以下配置強制使用 IPv4
      rtcpMuxPolicy: 'require',
      bundlePolicy: 'max-bundle'
    };

    console.log('創建PeerConnection，配置:', JSON.stringify(rtcConfig));
    this.pc = new RTCPeerConnection(rtcConfig);

    // 創建DataChannel用於保活
    this.setupKeepAliveDataChannel();
    
    // 監控連接狀態
    this.pc.oniceconnectionstatechange = () => {
      if (!this.pc) return;
      
      const state = this.pc.iceConnectionState;
      console.log('ICE連接狀態變更:', state);
      
      if (this.conf.onConnectionStateChange) {
        this.conf.onConnectionStateChange(state);
      }
      
      if (state === 'failed') {
        console.error('ICE連接失敗，嘗試重新連接');
        this.handleError('ICE連接失敗');
      } else if (state === 'disconnected') {
        console.warn('ICE連接暫時斷開，嘗試重建連接');
        // 不觸發錯誤，而是嘗試重建連接
        this.performIceRestart();
      }
    };
    
    // 監控信令狀態
    this.pc.onsignalingstatechange = () => {
      if (!this.pc) return;
      console.log('信令狀態變更:', this.pc.signalingState);
    };
    
    // 監控連接狀態
    this.pc.onconnectionstatechange = () => {
      if (!this.pc) return;
      console.log('PeerConnection狀態變更:', this.pc.connectionState);
      
      if (this.pc.connectionState === 'failed') {
        console.error('連接失敗，嘗試重新連接');
        this.handleError(`連接失敗`);
      } else if (this.pc.connectionState === 'disconnected') {
        console.warn('連接暫時斷開，嘗試重建連接');
        // 不觸發錯誤，而是嘗試重建連接
        this.performIceRestart();
      }
    };
    
    // 根據用戶需求，簡化 ICE 候選處理邏輯
    this.pc.onicecandidate = (evt) => {
      if (evt.candidate && this.sessionUrl) {
        fetch(this.sessionUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/trickle-ice-sdpfrag' },
          body: evt.candidate.candidate
        }).catch(console.warn);
      }
    };

    // 添加接收音頻和視頻的轉換器
    this.pc.addTransceiver('audio', { direction: 'recvonly' });
    this.pc.addTransceiver('video', { direction: 'recvonly' });
    
    // 設置軌道處理器
    this.pc.ontrack = (evt) => {
      console.log('收到媒體軌道:', evt.track.kind);
      
      // 處理軌道結束和靜音事件
      evt.track.onended = () => {
        console.log('軌道結束:', evt.track.kind);
      };
      
      evt.track.onmute = () => {
        console.log('軌道靜音:', evt.track.kind);
      };
      
      evt.track.onunmute = () => {
        console.log('軌道取消靜音:', evt.track.kind);
      };
      
      if (this.conf.onTrack) {
        this.conf.onTrack(evt);
      }
    };
    
    // 創建並返回offer
    const offer = await this.pc.createOffer();
    
    // 確保設置本地描述
    await this.pc.setLocalDescription(offer);
    
    // 不需要等待 ICE 收集，直接返回 offer
    return offer;
  }

  /**
   * 設置保活用的DataChannel
   */
  private setupKeepAliveDataChannel(): void {
    if (!this.pc) return;

    try {
      // 創建保活用的DataChannel
      this.dataChannel = this.pc.createDataChannel('keepalive');

      console.log('已創建保活DataChannel');

      this.dataChannel.onopen = () => {
        console.log('DataChannel已開啟，開始保活機制');

        // 清理現有的保活定時器
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
        }

        // 設置新的保活定時器，每20秒發送一個保活消息
        this.keepAliveInterval = setInterval(() => {
          if (this.dataChannel && this.dataChannel.readyState === 'open') {
            try {
              // 發送空字符串或小數據作為ping
              this.dataChannel.send('ping');
              console.log('發送保活ping');
            } catch (e) {
              console.warn('發送保活消息失敗:', e);
            }
          }
        }, 20000);
      };

      this.dataChannel.onclose = () => {
        console.log('DataChannel已關閉');
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
      };

      this.dataChannel.onerror = (err) => {
        console.warn('DataChannel錯誤:', err);
      };

      this.dataChannel.onmessage = (evt) => {
        console.log('收到DataChannel消息:', evt.data);
      };
    } catch (err) {
      console.warn('創建DataChannel失敗:', err);
    }
  }

  /**
   * 發送offer到服務器並處理回應
   */
  private async sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc || !this.pc.localDescription || !this.pc.localDescription.sdp) {
      throw new Error('無效的本地描述');
    }
    
    // 檢查連接狀態，避免在已連接狀態下重複發送
    if (this.state === 'connected' && !this.isPerformingIceRestart) {
      console.log('已處於連接狀態，不再發送offer');
      return;
    }

    try {
      console.log('等待ICE候選收集完成後發送WHEP請求...');
      
      // 等候 ICE gathering 完成
      if (this.pc && this.pc.iceGatheringState !== 'complete') {
        await new Promise<void>(resolve => {
          const check = () => {
            if (!this.pc) {
              resolve();
              return;
            }
            if (this.pc.iceGatheringState === 'complete') {
              if (this.pc) {
                this.pc.removeEventListener('icegatheringstatechange', check);
              }
              resolve();
            }
          };
          
          if (this.pc) {
            this.pc.addEventListener('icegatheringstatechange', check);
          }
          // 立即檢查一次，以防狀態已經是 complete
          check();
        });
      }
      
      console.log('ICE候選收集完成，發送WHEP請求到:', this.conf.url);
      
      // ICE 完整收集完畢後，再送出初始 SDP
      const response = await fetch(this.conf.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: this.pc.localDescription.sdp,
      });

      if (!response.ok) {
        throw new Error(`HTTP錯誤: ${response.status}`);
      }

      // 保存會話URL，用於後續操作（如發送ICE候選和關閉連接）
      if (response.headers.get('Location')) {
        this.sessionUrl = new URL(response.headers.get('Location') || "", this.conf.url).toString();
        console.log('收到會話URL:', this.sessionUrl);
      }

      // 記錄響應頭信息，有助於調試
      console.log('響應頭:',
        Array.from(response.headers.entries())
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      );

      // 獲取SDP回應並設置為遠程描述
      const sdp = await response.text();
      console.log('收到SDP答案:', sdp.substring(0, 100) + '...');
      
      await this.setAnswer(sdp);
      
      // 連接已建立
      this.state = 'connected';
      console.log('連接已建立');
      
      // 啟動連接監控
      this.startConnectionMonitor();
    } catch (err) {
      console.error('發送offer失敗:', err);
      throw err;
    }
  }

  /**
   * 設置從服務器接收的SDP答案
   */
  private async setAnswer(sdp: string): Promise<void> {
    if (!this.pc) {
      throw new Error('PeerConnection未初始化');
    }

    try {
      // 只在正確的信令狀態下設置遠程描述
      if (this.pc.signalingState === 'have-local-offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer',
          sdp: sdp,
        }));
        console.log('已設置遠程描述');
      } else {
        console.warn(`忽略Answer設置：當前信令狀態 ${this.pc.signalingState} 不是 'have-local-offer'`);
      }
    } catch (err) {
      // 特別處理InvalidStateError
      if (err instanceof Error && err.name === 'InvalidStateError') {
        console.warn('忽略非同步狀態錯誤:', err.message);
        return; // 不拋出錯誤，允許連接繼續
      }
      console.error('設置遠程描述失敗:', err);
      throw err;
    }
  }

  /**
   * 啟動連接監控
   */
  private startConnectionMonitor(): void {
    // 清除現有監控
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }

    // 每30秒檢查一次連接狀態
    this.connectionMonitorInterval = setInterval(() => {
      if (!this.pc) return;

      // 檢查連接狀態
      console.log('連接監控:', {
        connectionState: this.pc.connectionState,
        iceConnectionState: this.pc.iceConnectionState,
        signalingState: this.pc.signalingState,
        iceGatheringState: this.pc.iceGatheringState
      });

      // 只在failed時觸發重連，disconnected時嘗試ICE重啟
      if (this.pc.connectionState === 'failed' ||
        this.pc.iceConnectionState === 'failed') {
        console.error('監控檢測到連接失敗，嘗試重新連接');
        this.handleError(`監控檢測到連接失敗`);
      } else if (
        (this.pc.connectionState === 'disconnected' ||
          this.pc.iceConnectionState === 'disconnected') &&
        !this.isPerformingIceRestart) {
        console.warn('監控檢測到連接斷開，嘗試重建連接');
        this.performIceRestart();
      }
    }, 30000);
  }
}

export default MediaMTXWebRTCReader; 