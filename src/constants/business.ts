import { $t } from '@/locales';

export const enableStatusRecord:Record<string, string> = {
    '1': $t('business.enableStatus.active'),
    '0': $t('business.enableStatus.inactive'),
    'active': $t('business.enableStatus.active'),
    'inactive': $t('business.enableStatus.inactive'),
  };

  export const siteStatusRecord:Record<number, string> = {
    0: $t('business.siteStatus.none'),
    1: $t('business.siteStatus.onsite'),
    2: $t('business.siteStatus.sendRepair'),
    3: $t('business.siteStatus.onsiteAndSendRepair'),
  };

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


