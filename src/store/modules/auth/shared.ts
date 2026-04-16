import { localStg } from '@/utils/storage';

/** Get token */
export function getToken() {
  return localStg.get('token') || '';
}

/** Set token to cookie with specific domain */
export function setTokenCookie(token: string) {
  const domain = '.datasting.cc';
  document.cookie = `token=${token}; domain=${domain}; path=/; max-age=${60 * 60 * 24 * 7};`;
}

/** Remove token cookie from specific domain */
export function removeTokenCookie() {
  const domain = '.datasting.cc';
  document.cookie = `token=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
}

/** Clear auth storage */
export function clearAuthStorage() {
  localStg.remove('token');
  localStg.remove('refreshToken');
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
