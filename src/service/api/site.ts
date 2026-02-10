import { request } from '../request';


export function fetchDashboard() {
  return request({
    url: '/api/dashboard',
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

// 获取场地历史数据
export function fetchSitesHistory(id: number) {
  return request({
    url: '/api/sites/history/' + id,
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

// orders_site 工单场地【维修账户】
// /api/orders_site/:id
export function fetchOrdersSite(params: {[key: string]: any }) {
  return request({
    url: '/api/orders_site',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}

// 场地每日日报.只有运维人员可上传
export function postSiteReport(params: {[key: string]: any }) {
  return request({
    url: '/api/sites/report',
    method: 'post',
    data:params // 这里会拼接到 URL ?page=1&limit=10
  });
}
// 日报列表
export function fetchSiteReport(params: {[key: string]: any }) {
  return request({
    url: '/api/sites/report',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}
// 编辑日报
export function updateSiteReport(id:number, params: {[key: string]: any }) {
  return request({
    url: '/api/sites/report/' + id,
    method: 'put',
    data: params
  });
}

// 我的场地
export function getSiteReport(params: {[key: string]: any }) {
  return request({
    url: '/api/sites/report_site/',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}

// 我的场地 id: site_id
// on_shelf_wait_repair_count
export function UpdateSiteHistory(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/sites/history/' + id,
    method: 'put',
    data: params
  });
}
