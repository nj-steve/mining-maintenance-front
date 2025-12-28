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

// 获取矿机
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

//绑定故障机到工单
// api/faults/bind_order
// params:
//   fault_ids: []
//   order_no: string
export function bindFaultsToOrder(params: {[key: string]: any }) {
  return request({
    url: '/api/faults/bind_order',
    method: 'post',
    data:params
  });
}

// 解绑工单
// api/faults/unbind_order
// params:
//   fault_ids: []
export function unbindFaultsToOrder(params: {[key: string]: any }) {
  return request({
    url: '/api/faults/unbind_order',
    method: 'post',
    data:params
  });
}



// 上传文件批量修改状态
// /api/faults/batch_update_status
// params:
//   order_no: string
//   status: number
//   file：文件上传
export function batchUpdateStatus(params: {[key: string]: any }) {
  return request({
    url: '/api/faults/batch_update_status',
    method: 'put',
    data:params
  });
}

// /api/faults/id 
// params:
//   status: number
export function deleteFaultsStatusById(id:number) {
  return request({
    url: '/api/faults/'+id,
    method: 'delete',
  });
}

// /api/faults/id 
// params:
//   status: number
export function exportFaults(params: {[key: string]: any }) {
  return request({
    url: '/api/faults/export',
    method: 'get',
    params
  });
}

// /api/orders/import 导入创建工单
// params:
//   file：文件上传
//   site_id： 场地id
export function importOrders(params: {[key: string]: any }) {
  return request({
    url: '/api/orders/import',
    method: 'post',
    data:params
  });
}

// orders/bind 故障机绑定工单
// params:
//   file: 文件上传
//   order_no: string
export function bindFaultsToOrders(params: {[key: string]: any }) {
  return request({
    url: '/api/orders/bind',
    method: 'post',
    data:params
  });
}






