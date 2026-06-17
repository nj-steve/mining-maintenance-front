import { localStg } from '@/utils/storage';

const COOKIE_DOMAIN = import.meta.env.DEV
  ? (import.meta.env.VITE_COOKIE_DOMAIN_DEV || '.test.com')
  : (import.meta.env.VITE_COOKIE_DOMAIN || '.datastring.cc');
const COOKIE_PATH = '/';

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';

  const cookies = document.cookie ? document.cookie.split(';') : [];
  const prefix = `${encodeURIComponent(name)}=`;

  for (const raw of cookies) {
    const cookie = raw.trim();
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return '';
}

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined') return;

  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  const domainPart = COOKIE_DOMAIN ? `domain=${COOKIE_DOMAIN}; ` : '';

  document.cookie = `${encodedName}=${encodedValue}; ${domainPart}path=${COOKIE_PATH}; max-age=${maxAgeSeconds};`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;

  const encodedName = encodeURIComponent(name);
  const domainPart = COOKIE_DOMAIN ? `domain=${COOKIE_DOMAIN}; ` : '';
  document.cookie = `${encodedName}=; ${domainPart}path=${COOKIE_PATH}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
}

/** Get token */
export function getToken() {
  return (
    getCookie('access_token') ||
    getCookie('token') ||
    localStg.get('token') ||
    localStorage.getItem('access_token') ||
    ''
  );
}

/** Set token to cookie with specific domain */
export function setTokenCookie(token: string, refreshToken?: string) {
  setCookie('access_token', token);
  setCookie('token', token);
  if (refreshToken) {
    setCookie('refresh_token', refreshToken);
  }
}

/** Remove token cookie from specific domain */
export function removeTokenCookie() {
  removeCookie('access_token');
  removeCookie('refresh_token');
  removeCookie('token');
}

/** Clear auth storage */
export function clearAuthStorage() {
  localStg.remove('token');
  localStg.remove('refreshToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('userInfo');
  removeTokenCookie();
  // 清除所有token
  // 1. 清除 cookie
    // clearAllCookies();

    // 2. 可选：清除 localStorage / sessionStorage
    // localStorage.clear();
    // sessionStorage.clear();

    // 3. 跳转到登录页
    // router.replace("/login");

}

export function clearAllCookies() {
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    // 设置为过期，并指定 path=/
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  }

  console.log("✅ 所有可访问的 cookies 已清除");
}
