import { request } from '../request';


export function fetchDashboard() {
  return request({
    url: '/api/statistics/dashboard',
    method: 'get',
  });
}

export function fetchSites(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/sites',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}
// 获取场地详情
export function fetchSitesDetail(id: number) {
  return request({
    url: '/api/sites/' + id,
    method: 'get',
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

