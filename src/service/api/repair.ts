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

// get /api/scraps/summary 统计数值
export function fetchScrapSummary() {
  return request({
    url: '/api/scraps/summary',
    method: 'get',
  });
}

// /api/scraps
// 报废机列表
export function fetchScrapLists(params: { page?: number; limit?: number; [key: string]: any }) {
  return request({
    url: '/api/scraps',
    method: 'get',
    params // 这里会拼接到 URL ?page=1&limit=10
  });
}


// /api/scraps/info?detail_id=25 
// 维修标注查看
export function fetchScrapsDetailInfo(detail_id: number) {
  return request({
    url: '/api/scraps/info?detail_id='+detail_id,
    method: 'get',
  });
}



// put /api/scraps?detail_id=8'
// 设置/添加 报废设备标注
export function updateRepairDetail(detail_id:number,params: {[key: string]: any }) {
  return request({
    url: '/api/scraps?detail_id='+detail_id,
    method: 'put',
    data:params
  });
}

// /api/scraps/export 导出报废设备标注
export function exportScrapDetail(params: {[key: string]: any }) {
  return request({
    url: '/api/scraps/export',
    method: 'get',
    params
  });
}

// /api/scraps/export 导出报废设备标注
// /api/scraps/status/:id 查看报废设备标注
export function updateScrapStatus(params: {[key: string]: any }) {
  return request({
    url: '/api/scraps/status/'+params.id,
    method: 'put',
    data:{status:params.status}
  });
}

// /api/scraps/info?scrap_id=25 
// 维修标注查看
export function fetchScrapsDetail(scrap_id: number) {
  return request({
    url: '/api/scraps/info?scrap_id='+scrap_id,
    method: 'get',
  });
}






