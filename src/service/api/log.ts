import { request } from '../request';

export interface OperationLog {
  id: number;
  user_id: number;
  user_name: string;
  module: string;
  operation_type: string;
  target_table: string;
  target_id: string;
  request_method: string;
  request_url: string;
  request_params: string;
  before_data: string;
  after_data: string;
  ip_address: string;
  user_agent: string;
  status: number;
  error_message: string;
  create_time: string;
}

export function fetchOperationLogs(params: { page?: number; page_size?: number; [key: string]: any }) {
  return request({
    url: '/api/operation_logs',
    method: 'get',
    params
  });
}
