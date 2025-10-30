export const enableStatusRecord:Record<string, string> = {
    '1': '活跃',
    '0': '暂停',
    'active': '活跃',
    'inactive': '暂停',
  };

  export const siteStatusRecord:Record<number, string> = {
    0: '暂无',
    1: '驻场',
    2: '寄修',
    3: '驻场+寄修',
  };

  // 维修方式
  export const repairMethodRecord:Record<number, string> = {
    1: '驻场',
    2: '寄修',
    3: '对发',
  };
    export const repairMethodOptions = [
      { label: '驻场', value: 1 },
      { label: '寄修', value: 2 },
      { label: '对发', value: 3 },
    ]


export const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
    '在架': 'success',
    '维修': 'warning',
    '报废': 'error',
    '下架':'info',
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
    [UserStatus.Active]: '在职',
    [UserStatus.Leave]: '离职',
    [UserStatus.Disabled]: '停用'
  };


export const roleTagMap: Record<number, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
    3: 'success',
    2: 'warning',
    4: 'error',
    1:'info',
  };

export const roleRecord:Record<number, string> = {
    1: '管理员',
    2: '售后管理',
    3: '运维人员',
    4: '维修人员',
  };

export const statusOptionsMap:Record<number, string> = {
    9: '已修复',
    10: '未修复',
    11: '报废',
    0:'其他'
  };
export  const statusOptions = [
    { label: "已修复", value: 9 },
    { label: "未修复", value: 10 },
    { label: "报废", value: 11 }
  ]


  