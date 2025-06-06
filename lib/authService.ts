// 認證服務 - 處理用戶登入、註冊和token管理
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AuthError {
  error: string;
  error_description: string;
}

// 安全的瀏覽器環境檢測，避免 hydration 錯誤
const isBrowser = typeof window !== 'undefined';

// 檢測是否在開發環境且使用本地端點
const isLocalDev = isBrowser && window.location.hostname === 'localhost';
const SUPABASE_ENDPOINT = process.env.NEXT_PUBLIC_SUPABASE_API_URL || process.env.SUPABASE_API_URL || "http://streamcamkeelong.mooo.com"

// 如果是本地開發環境，使用 API 代理路由避免 CORS 問題
const API_BASE_URL = isLocalDev ? '/api/auth' : `${SUPABASE_ENDPOINT}/auth/v1`;

// 只在瀏覽器環境中輸出日誌，避免 hydration 錯誤
if (isBrowser) {
  console.log('SUPABASE_ENDPOINT:', SUPABASE_ENDPOINT)
  console.log('API_BASE_URL:', API_BASE_URL)
  console.log('isLocalDev:', isLocalDev)
}

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Token 管理
export class TokenManager {
  private static readonly TOKEN_KEY = 'monitor_hub_auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'monitor_hub_refresh_token';
  private static readonly USER_KEY = 'monitor_hub_user';

  static saveToken(authResponse: AuthResponse): void {
    if (isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, authResponse.access_token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refresh_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    }
  }

  static getToken(): string | null {
    if (isBrowser) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (isBrowser) {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static getUser(): any | null {
    if (isBrowser) {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  static clearTokens(): void {
    if (isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static isAuthenticated(): boolean {
    // 在服務器端總是返回 false，避免 hydration 錯誤
    if (!isBrowser) return false;
    return !!this.getToken();
    // return true;
  }
}

// 認證API服務
export class AuthService {
  /**
   * 用戶註冊
   */
  static async signup(email: string, password: string): Promise<AuthResponse> {
    try {
      const headers: Record<string, string> = isLocalDev ? {
        'Content-Type': 'application/json',
      } : {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.message || '註冊失敗');
      }

      // 註冊成功後自動保存token
      TokenManager.saveToken(data);
      
      return data;
    } catch (error) {
      console.error('註冊錯誤:', error);
      throw error;
    }
  }

  /**
   * 用戶登入
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // 根據是否使用代理路由決定 URL 和 headers
      const loginUrl = isLocalDev ? `${API_BASE_URL}/login` : `${API_BASE_URL}/token?grant_type=password`;
      const headers: Record<string, string> = isLocalDev ? {
        'Content-Type': 'application/json',
      } : {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      };

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.message || '登入失敗');
      }

      // 登入成功後自動保存token
      TokenManager.saveToken(data);
      
      return data;
    } catch (error) {
      console.error('登入錯誤:', error);
      throw error;
    }
  }

  /**
   * 登出
   */
  static async logout(): Promise<void> {
    try {
      const token = TokenManager.getToken();
      
      // 向後端發送登出請求
      if (token) {
        try {
          const headers: Record<string, string> = isLocalDev ? {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          } : {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          };

          await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers,
          });
        } catch (apiError) {
          // 即使API調用失敗，也要清除本地token
          console.warn('登出API調用失敗，但仍會清除本地token:', apiError);
        }
      }
      
      // 清除本地存儲的token
      TokenManager.clearTokens();
      
      console.log('用戶已登出');
    } catch (error) {
      console.error('登出錯誤:', error);
      throw error;
    }
  }

  /**
   * 檢查認證狀態 - 避免 hydration 錯誤
   */
  static isAuthenticated(): boolean {
    // 在服務器端總是返回 false，避免 hydration 錯誤
    return TokenManager.isAuthenticated();
  }

  /**
   * 獲取當前用戶信息
   */
  static getCurrentUser(): any | null {
    return TokenManager.getUser();
  }

  /**
   * 獲取認證標頭（用於API請求）
   */
  static getAuthHeaders(): Record<string, string> {
    const token = TokenManager.getToken();
    return token ? {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_KEY,
    } : {
      'apikey': SUPABASE_KEY,
    };
  }
} 