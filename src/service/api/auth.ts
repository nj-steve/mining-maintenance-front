import { request } from '../request';

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
export function fetchCompanies(params: { role?: number;}) {
  return request({
    // url: '/auth/login',
    url:'/api/users/get_users_companies',
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
    url: '/api/users/',
    method: 'post',
    data:params
  });
}

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    // url: '/auth/login',
    url:'/api/login',
    method: 'post',
    data: {
      userName,
      password
    }
  });
}

/** Get user info */
export function fetchGetUserInfo(id:number) {
  return request<Api.Auth.UserInfo>(
    { 
      // url: '/auth/getUserInfo' 
      url: '/api/users/'+id 

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
