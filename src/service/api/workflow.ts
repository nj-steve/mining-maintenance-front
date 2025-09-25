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

// 获取订单详情
export function fetchOrdersDetail(id:number) {
  return request({
    url: '/api/orders/'+id,
    method: 'get',
  });
}

// 创建工单
/* {
  "date": "string",
  "fault_ids": [
    0
  ],
  "order_no": "string",
  "site_id": 0
}*/
export function createOrder(params: {[key: string]: any }) {
  return request({
    url: '/api/orders',
    method: 'post',
    data:params
  });
}

// 修改工单
// /api/faults/:id 
export function updateOrders(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/orders/'+id,
    method: 'put',
    data:params
  });
}

// 状态列表
// /api/orders/status
// type: filter (1: fault status, 2: order status)
export function fetchOrdersStatus(params: {[key: string]: any }) {
  return request({
    url: '/api/data/fault_order_status',
    method: 'get',
    params
  });
}

// 物流列表
// /api/orders/status
// type: filter (1: fault status, 2: order status)
export function fetchOrdersLogistics() {
  return request({
    url: '/api/data/logistics',
    method: 'get'
  });
}

// 批量派工单
// /api/:id/dispatch
export function dispatchOrders(params: {[key: string]: any }) {
  return request({
    url: '/api/orders/dispatch',
    method: 'post',
    data:params
  });
}

