declare module 'h265web.js/dist/index' {
  interface H265webOptions {
    player: HTMLVideoElement;
    debug?: boolean;
    url?: string;
    useWorker?: boolean;
  }

  interface H265web {
    on(event: string, callback: (data?: any) => void): void;
    destroy(): void;
  }

  class H265webjs implements H265web {
    constructor(options: H265webOptions);
    on(event: string, callback: (data?: any) => void): void;
    destroy(): void;
  }

  export default H265webjs;
}

declare global {
  interface Window {
    H265webjs: any
  }
}

export {} 