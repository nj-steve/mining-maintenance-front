import { request } from '../request';


export function fetchSites(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/sites',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}

// 修改矿机
// /api/sites/:id 
export function updateSites(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/sites/'+id,
    method: 'put',
    data:params
  });
}

