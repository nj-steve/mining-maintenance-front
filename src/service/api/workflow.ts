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


export function fetchOrders(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/orders',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}

// 修改矿机
// /api/faults/:id 
export function updateOrders(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/orders/'+id,
    method: 'put',
    data:params
  });
}

