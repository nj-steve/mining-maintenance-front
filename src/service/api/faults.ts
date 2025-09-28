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


export function fetchFaults(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/faults',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}

// 修改矿机
// /api/faults/:id 
//1: fault status, 2: order status
export function fetchFaultsStatus(params: { type?:number}) {
  return request({
    url: '/api/data/fault_order_status',
    method: 'get',
    params
  });
}

// 修改矿机
// /api/faults/:id 
export function updateFaults(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/faults/'+id,
    method: 'put',
    data:params
  });
}

//fault_order_status
// param :fault_ids:[]
// param :status:number
export function updateFaultsStatus(params: {[key: string]: any }) {
  return request({
    url: '/api/faults/update_status',
    method: 'put',
    data:params
  });
}

// 上传文件批量修改状态
// /api/faults/batch_update_status
// params:
//   order_numbers: string[]
//   status: number
//   file：文件上传
export function batchUpdateStatus(params: {[key: string]: any }) {
  return request({
    url: '/api/faults/batch_update_status',
    method: 'put',
    data:params
  });
}




