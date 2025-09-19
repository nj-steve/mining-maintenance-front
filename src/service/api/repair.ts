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


export function fetchRepairStations(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/repair_stations',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}
// 维修明细列表
export function fetchRepairDetails(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/repair_details',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}

// 修改矿机
// /api/faults/:id 
export function updateFaults(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/repair_stations/'+id,
    method: 'put',
    data:params
  });
}

