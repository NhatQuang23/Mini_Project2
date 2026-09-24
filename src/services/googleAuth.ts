import { Platform } from 'react-native';

export const GOOGLE_CLIENT_ID =
  '611950996668-kabpf27hjmt2le0rn82fqtvl43kb01cg.apps.googleusercontent.com';

export interface GoogleUserInfo {
  email: string;
  name: string;
  avatarUrl?: string;
  id?: string;
}

/**
 * Parses JWT token payload without external dependencies
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Dynamically loads the official Google Identity Services (GSI) script on Web
 */
export function loadGoogleGsiScript(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  const win = window as any;
  if (win.google?.accounts) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const SCRIPT_ID = 'google-gsi-client-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (script) {
      if (win.google?.accounts) {
        resolve(true);
      } else {
        script.addEventListener('load', () => resolve(true));
        script.addEventListener('error', () => resolve(false));
      }
      return;
    }

    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Google Identity Services script');
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

/**
 * Triggers real Google Sign-In using Google OAuth 2.0 Token Client (Popup flow)
 */
export async function promptGoogleSignIn(): Promise<{
  success: boolean;
  user?: GoogleUserInfo;
  error?: string;
}> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return {
      success: false,
      error: 'Google Sign-In is only supported on the Web platform currently.',
    };
  }

  const isLoaded = await loadGoogleGsiScript();
  const win = window as any;

  if (!isLoaded || !win.google?.accounts?.oauth2) {
    return {
      success: false,
      error:
        'Could not load Google Sign-In service. Please check your internet connection and try again.',
    };
  }

  return new Promise((resolve) => {
    try {
      let resolved = false;

      const tokenClient = win.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (resolved) return;
          resolved = true;

          if (tokenResponse?.error) {
            console.error('Google OAuth error:', tokenResponse);
            if (tokenResponse.error === 'access_denied') {
              resolve({
                success: false,
                error: 'Bạn đã hủy đăng nhập Google.',
              });
              return;
            }
            resolve({
              success: false,
              error: `Google OAuth error: ${tokenResponse.error_description || tokenResponse.error}`,
            });
            return;
          }

          if (!tokenResponse?.access_token) {
            resolve({
              success: false,
              error: 'Không nhận được mã xác thực từ Google.',
            });
            return;
          }

          try {
            // Fetch real user info from Google's UserInfo endpoint
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!res.ok) {
              throw new Error(`Google UserInfo API returned status ${res.status}`);
            }

            const profile = await res.json();

            if (!profile?.email) {
              throw new Error('Google did not return an email address');
            }

            resolve({
              success: true,
              user: {
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                avatarUrl: profile.picture,
                id: profile.sub,
              },
            });
          } catch (err: any) {
            console.error('Error fetching Google userinfo:', err);
            resolve({
              success: false,
              error: `Lỗi khi lấy thông tin Google: ${err.message || 'Unknown error'}`,
            });
          }
        },
        error_callback: (err: any) => {
          if (resolved) return;
          resolved = true;
          console.error('Google Token Client error_callback:', err);
          
          let errorMsg = 'Đăng nhập Google thất bại.';
          if (err?.type === 'popup_closed') {
            errorMsg = 'Cửa sổ đăng nhập Google đã bị đóng.';
          } else if (err?.type === 'popup_failed_to_open') {
            errorMsg = 'Trình duyệt đã chặn popup. Vui lòng cho phép popup để đăng nhập.';
          } else if (err?.message) {
            errorMsg = err.message;
          }

          resolve({
            success: false,
            error: errorMsg,
          });
        },
      });

      // Open the real Google OAuth popup
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      console.error('Exception during Google Sign-In:', err);
      resolve({
        success: false,
        error: err.message || 'Không thể khởi tạo đăng nhập Google.',
      });
    }
  });
}
