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


// ==================== 故障机导入错误 ====================

// ==================== 故障机导入错误 ====================

// 原始数据（OriginalInfo 解析后的对象）
export interface FaultImportOriginal {
  down_time?: string;
  model?: string;
  sn?: string;
  problem_desc?: string;
}

// 单条错误记录
export interface FaultImportError {
  id: number;
  site_id: number;
  site_name: string;
  line_num: number;
  down_time: string;
  model: string;
  sn: string;
  problem_desc: string;
  error_msg: string;
  original_info: string;                       // 原始 JSON 字符串
  original_info_parsed?: FaultImportOriginal;   // 服务端解析后的对象
  imported_by?: number;
  importer_name: string;
  source_file: string;
  status: 0 | 1 | 2;
  retry_count: number;                         // 重试次数
  last_error_code?: string;                    // 上次错误码
  remark: string;
  processed_by?: number;
  processed_at?: string;
  fixed_by?: number;                           // 修正人
  fixed_at?: string;                           // 修正时间
  created_at?: string;
  updated_at?: string;
}

// 错误码字典（前端用于徽章颜色/文案）
export const FaultImportErrorCodeMap: Record<
  string,
  { color: string; label: string }
> = {
  sn_not_found:    { color: 'red',    label: 'SN 不在资产清单' },
  site_mismatch:   { color: 'orange', label: '场地名不匹配' },
  invalid_status:  { color: 'orange', label: 'SN 历史状态非法' },
  dup_record:      { color: 'red',    label: '记录已存在' },
  bad_time:        { color: 'blue',   label: '下架时间非法' },
  db_error:        { color: 'red',    label: '数据库错误' },
  inserted_ok:     { color: 'green',  label: '已解决' }
};

// 列表查询
export function fetchFaultImportErrors(params: {
  page?: number;
  page_size?: number;
  site_id?: number;
  group_id?: string;          // ← 新增
  status?: 0 | 1 | 2;
  sn?: string;
  start_at?: string;
  end_at?: string;
}) {
  return request<{
    // code: number;
    // msg: string;
    // data: {
      list: FaultImportError[];
      total: number;
      page: number;
      page_size: number;
    // };
  }>({
    url: '/api/faults/import_errors',
    method: 'get',
    params
  });
}

// 提交处理（带 fixed_* 修正字段 + original_info 一致性校验）
export function updateFaultImportError(
  id: number,
  data: {
    status?: 0 | 1 | 2;
    remark?: string;
    // 修正后字段
    sn?: string;           // 修正后 SN
    down_time?: string;    // 修正后下架时间
    model?: string;        // 修正后规格
    problem_desc?: string; // 修正后问题描述
    site_id?: number;        // 修正后场地id
    site_name?: string;      // 修正后场地名
    // 一致性校验
    original_info?: string;      // 与库中 OriginalInfo 比对
  }
) {
  return request<{
      ok: boolean;
      id: number;
      fault_id?: number;          // 转换成功返回新 fault.id
      inserted: boolean;
      validated: boolean;
      error_code: string;
      error?: string;
  }>({
    url: `/api/faults/import_errors/${id}`,
    method: 'put',
    data
  });
}

// 审计历史
export interface FaultImportErrorLog {
  id: number;
  error_id: number;
  action: 'edit' | 'retry' | 'ignore' | 'restore' | 'resolve';
  operator_id?: number;
  operator_name: string;
  before_data: string;        // JSON 字符串
  after_data: string;         // JSON 字符串
  error_msg: string;
  created_at?: string;
}

export function fetchFaultImportErrorLogs(
  id: number,
  params: { page?: number; page_size?: number } = {}
) {
  return request<{

      list: FaultImportErrorLog[];
      total: number;
      page: number;
      page_size: number;
  }>({
    url: `/api/faults/import_errors/${id}/logs`,
    method: 'get',
    params
  });
}





