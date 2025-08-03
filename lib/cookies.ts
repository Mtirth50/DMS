"use client";

/**
 * Cookie utility functions for authentication persistence
 */

export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += `; path=/`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += `; secure`;
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
}

/**
 * Set authentication cookies
 */
export function setAuthCookies(userData: {
  name: string;
  email: string;
  token: string;
  role: string;
  isAdmin: boolean;
}): void {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours expiration

  console.log('Setting auth cookies:', userData);
  const userDataString = JSON.stringify(userData);
  console.log('User data string:', userDataString);
  
  setCookie('auth_user', userDataString, { expires, path: '/' });
  setCookie('auth_token', userData.token, { expires, path: '/' });
  
  // Also verify cookies were set
  console.log('Cookies after set:', document.cookie);
}

/**
 * Get authentication cookies
 */
export function getAuthCookies(): {
  name: string;
  email: string;
  token: string;
  role: string;
  isAdmin: boolean;
} | null {
  const userCookie = getCookie('auth_user');
  console.log('Retrieved user cookie:', userCookie);
  
  if (!userCookie) {
    console.log('No user cookie found');
    return null;
  }

  try {
    const parsed = JSON.parse(userCookie);
    console.log('Parsed user data:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    return null;
  }
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(): void {
  deleteCookie('auth_user');
  deleteCookie('auth_token');
}
