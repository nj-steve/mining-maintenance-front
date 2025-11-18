import { request } from '../request';

// export interface Miner {
//   serial_number?: string;
//   miner_type?: string;
//   Site?: number;
//   sale?: number;
//   swap?: number;
//   scrap?: number;
//   asset?: number;
//   online?: number;
//   repairing?: number;
//   transfer?: number;
//   hashRate?: string | number;
//   [key: string]: unknown;
// }


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

// 维修明细列表
export function exportRepairDetails(params: {[key: string]: any }) {
  return request({
    url: `/api/repair_details/export`,
    method: 'get',
    params

  });
}

// 维修明细列表
export function fetchRepairDetailsByID(id: number) {
  return request({
    url: `/api/repair_details/${id}`,
    method: 'get',
  });
}

// 修改矿机
// /api/faults/:id 
export function updateRepairDetails(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/repair_details/'+id,
    method: 'put',
    data:params
  });
}


// 修改矿机
// /api/repair_stations/:id 
// export function updateRepairStation(id:number,params: {[key: string]: any }) {
//   return request({
//     url: '/api/repair_stations/'+id,
//     method: 'put',
//     data:params
//   });
// }

// /api/repair_stations/:id 
export function createRepairStation(params: {[key: string]: any }) {
  return request({
    url: '/api/repair_stations',
    method: 'post',
    data:params
  });
}
//修改维修站
// /api/repair_stations/:id 
export function updateRepairStation(id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/repair_stations/'+id,
    method: 'put',
    data:params
  });
}

//删除维修站
// /api/repair_stations/:id 
export function deleteRepairStation(id:number) {
  return request({
    url: '/api/repair_stations/'+id,
    method: 'delete',
  });
}

// /api/imgauth/string
// 图片上传私钥
export function getUploadToken(params: {[key: string]: any }) {
  return request({
    url: '/api/getUploadToken',
    method: 'get',
    params
  });
}



