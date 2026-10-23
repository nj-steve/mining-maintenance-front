import { $t } from '@/locales';

export const enableStatusRecord:Record<string, string> = {
    '1': $t('business.enableStatus.active'),
    '0': $t('business.enableStatus.inactive'),
    'active': $t('business.enableStatus.active'),
    'inactive': $t('business.enableStatus.inactive'),
  };

  export const siteStatusRecord:Record<string, string> = {
    '0': $t('business.siteStatus.none'),
    '1': $t('business.siteStatus.onsite'),
    '2': $t('business.siteStatus.sendRepair'),
    '3': $t('business.siteStatus.onsiteAndSendRepair'),
  };

  // 故障编码 → 标签文案 + 颜色（SN 异常记录）
  // key 使用「归一化后的别名」，兼容后端返回英文 key / 中文 / 数字码
  export const faultAbnormalCodeMap:Record<string, { label: string; type: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' }> = {
    // 算力板
    hashboard: { label: $t('business.faultAbnormalCode.hashBoard'), type: 'error' },
    hashboards: { label: $t('business.faultAbnormalCode.hashBoard'), type: 'error' },
    '算力板': { label: $t('business.faultAbnormalCode.hashBoard'), type: 'error' },
    '1': { label: $t('business.faultAbnormalCode.hashBoard'), type: 'error' },
    // 传感器
    sensor: { label: $t('business.faultAbnormalCode.sensor'), type: 'warning' },
    sensors: { label: $t('business.faultAbnormalCode.sensor'), type: 'warning' },
    '传感器': { label: $t('business.faultAbnormalCode.sensor'), type: 'warning' },
    '2': { label: $t('business.faultAbnormalCode.sensor'), type: 'warning' },
    // 温度
    temperature: { label: $t('business.faultAbnormalCode.temperature'), type: 'warning' },
    temp: { label: $t('business.faultAbnormalCode.temperature'), type: 'warning' },
    '温度': { label: $t('business.faultAbnormalCode.temperature'), type: 'warning' },
    '3': { label: $t('business.faultAbnormalCode.temperature'), type: 'warning' },
    // 风扇
    fan: { label: $t('business.faultAbnormalCode.fan'), type: 'info' },
    fans: { label: $t('business.faultAbnormalCode.fan'), type: 'info' },
    '风扇': { label: $t('business.faultAbnormalCode.fan'), type: 'info' },
    '4': { label: $t('business.faultAbnormalCode.fan'), type: 'info' },
    // 电源
    power: { label: $t('business.faultAbnormalCode.power'), type: 'error' },
    psu: { label: $t('business.faultAbnormalCode.power'), type: 'error' },
    '电源': { label: $t('business.faultAbnormalCode.power'), type: 'error' },
    '5': { label: $t('business.faultAbnormalCode.power'), type: 'error' },
    // 老化
    aging: { label: $t('business.faultAbnormalCode.aging'), type: 'primary' },
    age: { label: $t('business.faultAbnormalCode.aging'), type: 'primary' },
    '老化': { label: $t('business.faultAbnormalCode.aging'), type: 'primary' },
    '6': { label: $t('business.faultAbnormalCode.aging'), type: 'primary' },
    // 内存
    memory: { label: $t('business.faultAbnormalCode.memory'), type: 'primary' },
    ram: { label: $t('business.faultAbnormalCode.memory'), type: 'primary' },
    '内存': { label: $t('business.faultAbnormalCode.memory'), type: 'primary' },
    '7': { label: $t('business.faultAbnormalCode.memory'), type: 'primary' },
    // 网络
    network: { label: $t('business.faultAbnormalCode.network'), type: 'info' },
    net: { label: $t('business.faultAbnormalCode.network'), type: 'info' },
    '网络': { label: $t('business.faultAbnormalCode.network'), type: 'info' },
    '8': { label: $t('business.faultAbnormalCode.network'), type: 'info' },
  };

  // 归一化：去空格、转小写，便于查表
  export function normalizeFaultCode(code: unknown): string {
    return String(code ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');
  }

  // 数值 → Tag 颜色分级（数值越大越刺眼）
  // thresholds: [阈值1, 阈值2, ...]，按顺序从小到大匹配
  export function getCountTagType(
    count: number,
    thresholds: number[] = [1, 5, 10]
  ): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
    const n = Number(count) || 0;
    if (n <= 0) return 'default';
    if (n >= (thresholds[2] ?? 10)) return 'error';
    if (n >= (thresholds[1] ?? 5)) return 'warning';
    if (n >= (thresholds[0] ?? 1)) return 'info';
    return 'default';
  }

  // 查表：直接命中 → 归一化命中 → 关键字模糊命中
  export function getFaultAbnormalCodeMeta(code: unknown) {
    const raw = String(code ?? '').trim();
    if (!raw) return null;
    const direct = faultAbnormalCodeMap[raw];
    if (direct) return direct;
    const normalized = normalizeFaultCode(raw);
    const byNormalized = faultAbnormalCodeMap[normalized];
    if (byNormalized) return byNormalized;
    // 模糊匹配：包含关键字即命中（hash_board → hashboard）
    const hit = Object.entries(faultAbnormalCodeMap).find(([key]) => normalized.includes(key));
    return hit ? hit[1] : null;
  }

  // 维修方式
  export const repairMethodRecord:Record<number, string> = {
    1: $t('business.repairMethod.onsite'),
    2: $t('business.repairMethod.sendRepair'),
    3: $t('business.repairMethod.exchange'),
  };
    export const repairMethodOptions = [
      { label: $t('business.repairMethod.onsite'), value: 1 },
      { label: $t('business.repairMethod.sendRepair'), value: 2 },
      { label: $t('business.repairMethod.exchange'), value: 3 },
    ]
    // 维修结果
    export const repairResultMap:Record<number, string> = {
    3: $t('business.repairResult.repaired'),
    2: $t('business.repairResult.unrepaired'),
    4: $t('business.repairResult.scrapped'),
    1:$t('business.repairResult.pending')
  };
    export const repairResultOptions = [
      { label: $t('business.repairResult.pending'), value:1 },
      { label: $t('business.repairResult.unrepaired'), value:2  },
      { label: $t('business.repairResult.repaired'), value:3  },
      { label: $t('business.repairResult.scrapped'), value: 4 },
    ]

    export const repairTypeOptions = [
      { label: $t('business.repairType.wholeMachine'), value:"整机" },// 1整机
      { label: $t('business.repairType.hashBoard'), value:"算力板" },// 2算力板
    ]


export const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
    [$t('business.tagMap.onShelf')]: 'success',
    [$t('business.tagMap.repairing')]: 'warning',
    [$t('business.tagMap.scrapped')]: 'error',
    [$t('business.tagMap.offShelf')]: 'info',
  };

  export enum UserStatus {
    Active = 1,
    Leave = 0,
    Disabled = -1,
  }


export const userStatusMap: Record<number, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
  [UserStatus.Active]: 'success',
  [UserStatus.Leave]: 'error',
  [UserStatus.Disabled]: 'warning',
};

export const userStatusRecord:Record<number, string> = {
    // 1: '在职',
    // 0: '离职',
    // -1: "停用"
    [UserStatus.Active]: $t('business.userStatus.active'),
    [UserStatus.Leave]: $t('business.userStatus.leave'),
    [UserStatus.Disabled]: $t('business.userStatus.disabled')
  };


export const roleTagMap: Record<number, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
    3: 'success',
    2: 'warning',
    4: 'error',
    1:'info',
  };

export const roleRecord:Record<number, string> = {
    1: $t('business.role.admin'),
    2: $t('business.role.afterSales'),
    3: $t('business.role.operation'),
    4: $t('business.role.maintenance'),
    5: $t('business.role.readOnly'),
  };


// export  const statusOptions = [
//     { label: "已修复", value: 9 },
//     { label: "未修复", value: 10 },
//     { label: "报废", value: 11 }
//   ]


