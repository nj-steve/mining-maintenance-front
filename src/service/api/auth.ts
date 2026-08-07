import { request } from '../request';

// 获取单个用户列表
export function fetchUserDetail(id:number) {
  return request({
    // url: '/auth/login',
    url:'/api/users/'+id,
    method: 'get',
  });
}

// 获取用户列表
export function fetchUser(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    // url: '/auth/login',
    url:'/api/users',
    method: 'get',
    params
  });
}

// 根据角色 获取公司列表
// /users/get_users_companies
export function fetchCompanies(params: { role?: string;}) {
  return request({
    // url: '/auth/login',
    url:'/api/users/companies',
    method: 'get',
    params
  });
}


// /repair_stations/post_repair_stations_import_repair_details

// 修改用户
// /api/faults/:id
export function updateUser(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/users/'+id,
    method: 'put',
    data:params
  });
}

// 创建用户
// /api/faults/:id
export function createUser(params: {[key: string]: any }) {
  return request({
    url: '/api/users',
    method: 'post',
    data:params
  });
}

// 获取外部用户列表
export function fetchExternalUsers() {
  return request({
    url: '/api/external/users',
    method: 'get'
  });
}

// 绑定外部用户
export function bindExternalUser(data: { admin_id: string ; role: number; username?: string; assigned_company_id?: string | string[] }) {
  return request({
    url: '/api/external/users',
    method: 'post',
    data
  });
}

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, md5Password: string, password2: string) {
  // console.log("login", userName, password);
  return request<Api.Auth.LoginToken>({
    // url: '/auth/login',
    url:'/api/login',
    method: 'post',
    data: {
      userName,
      password: md5Password,
      password2
    }
  });
}

/** Get user info
 * 获取角色，token
 * 验证角色，token
*/
export function fetchGetUserInfo(params?: { group_id?: string | number }) {
  return request<Api.Auth.UserInfo>(
    {
      // url: '/auth/getUserInfo'
      url: '/api/getUserInfo',
      method: 'get',
      params
    });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
