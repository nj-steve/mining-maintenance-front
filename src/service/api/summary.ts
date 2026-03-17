import { request } from '../request';

// /api/repair_statistics
/*
 * 获取维修统计数据
 * @param params - 统计参数
 * @param params.start_date - 开始日期，格式：YYYY-MM-DD
 * @param params.end_date - 结束日期，格式：YYYY-MM-DD
 * @param params.dimension - 统计维度：`site`（场地）或 `station`（网点）
 */
export function fetchRepairStatistics(dimension: 'site' | 'station',start_date: string,end_date: string) {
  return request({
    url: '/api/repair_statistics',
    method: 'get',
    params: {
      dimension,
      start_date,
      end_date,
    }
  });
}

// /api/repair_statistics/machine_models
/*
 * 获取机型故障占比统计数据
 * @param params - 统计参数
 * @param params.start_date - 开始日期，格式：YYYY-MM-DD
 * @param params.end_date - 结束日期，格式：YYYY-MM-DD
 * @param params.dimension - 统计维度：`site`（场地）或 `station`（网点）
 */
export function fetchMachineModelStatistics(dimension: 'site' | 'station',start_date: string,end_date: string) {
  return request({
    url: '/api/repair_statistics/machine_models',
    method: 'get',
    params: {
      dimension,
      start_date,
      end_date,
    }
  });
}

// /api/repair_statistics/repair_components
/*
 * 获取损坏部件排行统计数据
 * @param params - 统计参数
 * @param params.start_date - 开始日期，格式：YYYY-MM-DD
 * @param params.end_date - 结束日期，格式：YYYY-MM-DD
 * @param params.dimension - 统计维度：`site`（场地）或 `station`（网点）
 */
export function fetchRepairComponentsStatistics(dimension: 'site' | 'station',start_date: string,end_date: string) {
  return request({
    url: '/api/repair_statistics/repair_components',
    method: 'get',
    params: {
      dimension,
      start_date,
      end_date,
    }
  });
}
