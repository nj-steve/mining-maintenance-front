import { request } from '../request';

export interface Miner {
  serial_number?: string;
  miner_type?: string;
  Site?: number;
  sale?: number;
  swap?: number;
  scrap?: number;
  asset?: number;
  online?: number;
  repairing?: number;
  transfer?: number;
  hashRate?: string | number;
  [key: string]: unknown;
}


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

