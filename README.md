# H.265 HLS 視頻播放器

這是一個基於 React 的視頻播放器元件，支持播放 H.265 (HEVC) 編碼的 HLS 視頻流。

## 功能特點

- 支持 H.265 (HEVC) 編碼的 HLS 流播放
- 基於 h265web.js 提供 H.265 解碼能力
- 同時保留對標準 H.264 HLS 流的支持（使用 hls.js）
- 支持自動重試連接和錯誤處理
- 提供載入狀態和錯誤提示
- 與現有的視頻網格系統完全集成

## 安裝依賴

確保已安裝 h265web.js 用於 H.265 解碼：

```bash
npm install h265web.js --save
```

或者通過 CDN 引入：

```html
<script src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/h265webjs.js"></script>
```

## 使用方法

### 在頁面中引入 h265web.js

```jsx
// 在頁面或佈局文件中添加腳本
import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <script src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/h265webjs.js" />
      </Head>
      {children}
    </>
  );
}
```

### 使用 StreamGrid 顯示 H.265 視頻

```jsx
import StreamGrid from '@/components/stream-grid';

export default function VideoPage() {
  const streams = [
    'http://example.com/camera1',
    'http://example.com/camera2',
    'http://example.com/camera3',
  ];
  
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  
  const handleCellClick = (index) => {
    if (isRemoveMode) {
      // 處理選擇邏輯...
    }
  };
  
  return (
    <div>
      <h1>H.265 攝像頭</h1>
      <StreamGrid 
        streams={streams}
        isRemoveMode={isRemoveMode}
        selectedIndices={selectedIndices}
        isH265={true} // 啟用 H.265 解碼模式
        onCellClick={handleCellClick}
      />
    </div>
  );
}
```

### 單獨使用 StreamCell 組件

```jsx
import StreamCell from '@/components/stream-cell';

export default function SingleCamera() {
  return (
    <div style={{ width: '640px', height: '360px' }}>
      <StreamCell 
        index={0} 
        streamUrl="http://example.com/camera/h265stream"
        isRemoveMode={false}
        isH265={true} // 啟用 H.265 解碼
        onClick={() => console.log('Camera clicked')}
      />
    </div>
  );
}
```

## 工作原理

該播放器根據 `isH265` 屬性自動選擇適合的解碼方式：

- **H.265 模式**: 使用 h265web.js 在 Canvas 上渲染視頻
- **標準模式**: 使用 hls.js 或瀏覽器原生支持播放 H.264 HLS 視頻

## 注意事項

1. H.265 解碼對 CPU 要求較高，特別是在移動設備上
2. 使用 h265web.js 播放可能會導致較高的內存占用
3. 請確保 MediaMTX 流媒體服務器已正確配置為提供 H.265 編碼的 HLS 流
4. 不同瀏覽器和設備的兼容性可能有所不同

## 疑難排解

- 如果視頻無法播放，請檢查控制台錯誤信息
- 確認流 URL 是否正確，並且服務器支持 CORS
- 對於 H.265 播放問題，確保 h265web.js 已正確載入
- 對於卡頓問題，請考慮降低視頻分辨率或使用輔碼流