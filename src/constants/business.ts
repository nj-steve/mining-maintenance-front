export const enableStatusRecord:Record<string, string> = {
    '1': '活跃',
    '0': '暂停',
    'active': '活跃',
    'inactive': '暂停',
  };

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



  