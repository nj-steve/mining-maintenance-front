<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { refDebounced, useMediaQuery } from '@vueuse/core';
import { NDataTable, useMessage, NButton, NTag, NModal, NForm, NFormItem, NInput, NSelect, NSpace, useThemeVars } from 'naive-ui';
import UsersIcon from '~icons/ant-design/safety-certificate-outlined';
import SearchIcon from '~icons/ant-design/search-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import BindIcon from '~icons/ant-design/link-outlined';
import AddIcon from '~icons/ant-design/user-add-outlined';
import ManagementStatusSummary from '@/components/custom/ManagementStatusSummary.vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchUser, updateUser, createUser, fetchCompanies, fetchExternalUsers, bindExternalUser } from '@/service/api/auth';
import { roleTagMap, roleRecord, userStatusMap, UserStatus } from "@/constants/business"
import { REG_EMAIL } from '@/constants/reg';
import { useAuthStore } from '@/store/modules/auth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.userInfo.roles.some(role => role === '1' || role === '2'));
const narrowLayout = useMediaQuery('(max-width: 760px)');
const theme = useThemeVars();
const themeStyle = computed(() => ({
  '--management-surface': theme.value.cardColor,
  '--management-line': theme.value.dividerColor,
  '--management-ink': theme.value.textColor1,
  '--management-muted': theme.value.textColor2,
  '--management-accent': theme.value.primaryColor
}));
const groupOptions = computed(() => {
  const groups = authStore.userInfo?.groups || [];
  return groups.map(g => ({ label: g.name, value: String(g.id) }));
});
const defaultGroupIds = () => {
  const id = authStore.activeGroupId || 1;
  return [String(id)];
};

interface Company {
  id: number;
  name: string;
}

interface User {
  id?: number;                  // 主键ID（编辑时需要）
  username: string;              // 用户名
  real_name: string;             // 真实姓名
  contact_phone: string;         // 联系电话
  company_info: Company [];               // 公司
  role: number;                  // 角色：1-管理员，2-售后管理，3-运维人员，4-维修人员
  email: string;                 // 邮箱
  start_date: string;            // 入职日期 (YYYY-MM-DD)
  status?: number;               // 状态：1-在职，0-离职（可选）
  group_id?: string;
  groups?: { id: number; name: string }[];
  company_name?: string;

}

interface EditUser {
  id:number,
  group_id: string[];
  assigned_company_id: string[];
  company: string;
  password: string;
  contact_phone: string;
  email: string;
  role: number;
  start_date: string;
  status: number;
  username: string;
  real_name: string;
}

const message = useMessage();
const tableData = ref<User[]>([]);
const matchingCount = ref<number>();
const loading = ref(true);
const searchName = ref('');
const searchFilter = refDebounced(searchName, 250);
const searchRole = ref<number | null>(null);
const searchStatus = ref<number | null>(null);

const modelOptions = computed(() => Object.entries(roleRecord).map(([value, label]) => ({
  label,
  value: Number(value)
})));
const userStatuses = [
  { value: UserStatus.Active, key: 'active', tone: '#168460' },
  { value: UserStatus.Disabled, key: 'disabled', tone: '#b26713' },
  { value: UserStatus.Leave, key: 'leave', tone: '#bd5268' }
] as const;
const statusOptions = computed(() => userStatuses.map(status => ({
  label: t(`business.userStatus.${status.key}`),
  value: status.value
})));
const statusSummary = computed(() => userStatuses.map(status => ({
  label: t(`business.userStatus.${status.key}`),
  count: tableData.value.filter(row => row.status === status.value).length,
  tone: status.tone
})));
const companyOptions = ref<{ label: string; value: string }[]>([]);

// 分页
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix({ itemCount }) {
    return t('page.users.paginationPrefix', { count: itemCount })
  },
  onChange: page => {
    pagination.value.page = page;
    fetchData();
  },
  onUpdatePageSize: pageSize => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    fetchData();
  }
});

// ---------------- 添加/编辑 弹框 ----------------
const showModal = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');

const editForm = ref<EditUser>({
  id: 0,
  group_id: defaultGroupIds(),
  assigned_company_id: [],
  password: "",
  company: "",
  contact_phone: "",
  email: "",
  role: 1,        // 默认角色，可以根据需求调整
  start_date: "", // 可以用 "" 或 new Date().toISOString()
  status: 0,      // 默认状态
  username: "",
  real_name: ""
});

// 打开添加弹框
const handleOpenAdd = () => {
  dialogMode.value = 'add';
  editForm.value = {
    id: 0,
    group_id: defaultGroupIds(),
    assigned_company_id: [],
    password: "",
    company: "",
    contact_phone: "",
    email: "",
    role: 1,        // 默认角色，可以根据需求调整
    start_date: "", // 可以用 "" 或 new Date().toISOString()
    status: 0,      // 默认状态
    username: "",
    real_name: ""
  };

  // editForm.value = {
  //   id: undefined,
  //   Faults_type_id: 0,
  //   status_id: 0,
  //   serial_number: ''
  // };
  showModal.value = true;
};

function userToEditUser(user: User): EditUser {
  let groupIds: string[] = [];
  if (user.group_id) {
    if (typeof user.group_id === 'string') {
      groupIds = user.group_id.split(',');
    } else if (Array.isArray(user.group_id)) {
      groupIds = (user.group_id as any[]).map(String);
    }
  } else {
    const defaults = defaultGroupIds();
    if (defaults && Array.isArray(defaults)) {
      groupIds = defaults.map(String);
    }
  }

  return {
    id: user.id || 0,
    real_name: user.real_name || "",
    group_id: groupIds,
    assigned_company_id: user.company_info?.map(item => item.id.toString()) || [],
    company: user.company_info?.[0]?.name || "",
    password: "",
    contact_phone: user.contact_phone || "",
    email: user.email || "",
    role: user.role || 1,
    start_date: user.start_date || "",
    status: user.status !== undefined ? user.status : 0,
    username: user.username || ""
  };
}

// 打开编辑弹框
const handleOpenEdit = async(row: User) => {
  dialogMode.value = 'edit';
  console.log("row",row)
  editForm.value = userToEditUser(row);

  // 根据角色加载对应的公司选项
  if (row.role) {
    // getCompanys(row.role);
    console.log("row.role",row.role)
    if(row.role === 5) {
      editForm.value.assigned_company_id = [];
    }else{
      await getCompanys(row.role); // 等待加载完公司选项
      // 再次设置公司ID，确保选中
      editForm.value.assigned_company_id = row.company_info?.map(item => item.id.toString()) || [];
    }
  }

  showModal.value = true;
};

// 保存（新增/编辑共用）
const handleSave = async () => {
  try {
    // 验证表单数据
     // 如果没有传入角色，使用当前表单中的角色
  const currentRole = editForm.value.role;

  if (!editForm.value.group_id || editForm.value.group_id.length === 0) {
    message.error(t('page.users.validation.requireGroup'));
    return;
  }

  // 管理员(1)和售后管理(2)不需要选择公司
  if (!currentRole || currentRole === 1 || currentRole === 2 || currentRole === 5) {
    console.log("当前角色不需要选择公司:", currentRole);
  }else if (!editForm.value.assigned_company_id || editForm.value.assigned_company_id.length === 0) {
      message.error(t('page.users.validation.requireCompany'));
      return;
    }
     if (!editForm.value.username) {
      message.error(t('page.users.validation.requireUsername'));
      return;
    }
    if (!editForm.value.real_name) {
      message.error(t('page.users.validation.requireRealName'));
      return;
    }
    if(!editForm.value.password && dialogMode.value === 'add') {
      message.error(t('page.users.validation.requirePassword'));
      return;
    }
    if (!editForm.value.contact_phone) {
      message.error(t('page.users.validation.requirePhone'));
      return;
    }
    if (!editForm.value.email) {
      message.error(t('page.users.validation.requireEmail'));
      return false;
    }
    if (!REG_EMAIL.test(editForm.value.email.trim())) {
      message.error(t('page.users.validation.invalidEmail'));
      return false;
    }
    if (dialogMode.value === 'add' && !editForm.value.password) {
      message.error(t('page.users.validation.requirePassword'));
      return;
    }


    // if (!editForm.value.start_date) {
    //   message.error('请输入入职时间');
    //   return;
    // }

    // 转换 assigned_company_id 为逗号分隔字符串
    const submitData: any = {
      ...editForm.value,
      group_id: Array.isArray(editForm.value.group_id) ? editForm.value.group_id.join(',') : editForm.value.group_id,
      assigned_company_id: Array.isArray(editForm.value.assigned_company_id)
        ? editForm.value.assigned_company_id.join(',')
        : editForm.value.assigned_company_id
    };

    if (dialogMode.value === 'add') {
      const res = await createUser(submitData);
      // console.log("addUser",res)
      if (res.response?.data?.msg === "Operation successful") {
        message.success(t('page.users.addSuccess'));
        showModal.value = false;
        fetchData();
      }
      //  else {
      //   message.error(t('page.users.addFailed') + ': ' + res.response?.data?.msg);
      // }
    } else {

      const res = await updateUser(editForm.value.id!, submitData);
      // console.log("updateUser",res)
      if (res.response?.data?.msg === "Operation successful") {
        message.success(t('page.users.editSuccess'));
        showModal.value = false;
        fetchData();
      }
      // else {
      //   message.error(t('page.users.editFailed') + ': ' + res.response?.data?.msg);
      // }
    }
  } catch (err) {
    message.error(dialogMode.value === 'add' ? t('page.users.addFailed') : t('page.users.editFailed'));
  } finally {

  }
};

const renderHeaderTitle = (text: string) => h('span', { class: 'management-column-title' }, text);
const userFields = [
  { key: 'real_name', label: 'realName', width: 130 },
  { key: 'contact_phone', label: 'phone', width: 155 },
  { key: 'email', label: 'email', width: 200 },
  { key: 'start_date', label: 'startDate', width: 120 }
] as const;

const columns = computed<DataTableColumns<User>>(() => {
  const result: DataTableColumns<User> = [
    {
      title: () => renderHeaderTitle(t('page.users.columns.username')),
      key: 'username',
      width: narrowLayout.value ? 122 : 166,
      ellipsis: { tooltip: true },
      render: row => h('span', { class: 'management-entity-name' }, row.username || '—')
    },
    {
      title: () => renderHeaderTitle(t('page.users.columns.roleType')),
      key: 'role',
      width: narrowLayout.value ? 116 : 142,
      render: row => h(NTag, {
        class: 'management-status-tag', size: 'small', round: true, bordered: false, type: roleTagMap[row.role] || 'default'
      }, () => roleRecord[row.role] || t('page.users.unknown'))
    },
    {
      title: () => renderHeaderTitle(t('page.users.columns.status')),
      key: 'status',
      width: narrowLayout.value ? 92 : 105,
      render: row => {
        const status = userStatuses.find(item => item.value === row.status);
        return h(NTag, {
          class: 'management-status-tag', size: 'small', round: true, bordered: false, type: status ? userStatusMap[status.value] : 'default'
        }, () => status ? t(`business.userStatus.${status.key}`) : t('page.users.unknown'));
      }
    },
    {
      title: () => renderHeaderTitle(t('page.users.modal.groupLabel')),
      key: 'groups',
      width: 165,
      ellipsis: { tooltip: true },
      render: row => row.groups?.map(group => group.name).filter(Boolean).join(', ') || '—'
    },
    {
      title: () => renderHeaderTitle(t('page.users.columns.company')),
      key: 'company_info',
      width: 180,
      ellipsis: { tooltip: true },
      render: row => row.company_info?.map(company => company.name).filter(Boolean).join(', ') || row.company_name || '—'
    },
    ...userFields.map(field => ({
      title: () => renderHeaderTitle(t(`page.users.columns.${field.label}`)),
      key: field.key,
      width: field.width,
      ellipsis: { tooltip: true },
      render: (row: User) => h('span', { class: 'management-contact' }, row[field.key] || '—')
    }))
  ];
  if (isAdmin.value) {
    result.push({
      title: () => renderHeaderTitle(t('page.users.columns.actions')),
      key: 'actions',
      align: 'center',
      fixed: narrowLayout.value ? undefined : 'right',
      width: 86,
      render: row => h(NButton, {
        type: 'primary', quaternary: true, size: 'small', onClick: () => handleOpenEdit(row)
      }, () => t('page.users.actions.edit'))
    });
  }
  return result;
});
const tableWidth = computed(() => columns.value.reduce((width, column) => width + Number(column.width ?? 0), 0));

let latestRequest = 0;
async function fetchData() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const { data, error } = await fetchUser({
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      real_name: searchFilter.value.trim() || undefined,
      role: searchRole.value ?? undefined,
      status: searchStatus.value ?? undefined
    });
    if (request !== latestRequest) return;
    if (!data || error) throw error;
    tableData.value = data.list ?? [];
    matchingCount.value = Number(data.pagination.total) || 0;
    pagination.value.itemCount = matchingCount.value;
    pagination.value.page = data.pagination.page;
    pagination.value.pageSize = data.pagination.page_size;
  } catch (error) {
    if (request !== latestRequest) return;
    tableData.value = [];
    matchingCount.value = undefined;
    pagination.value.itemCount = 0;
    message.error(t('page.users.loadFailed', { error }));
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

const getCompanys = async (role?: number) => {
  // 如果没有传入角色，使用当前表单中的角色
  const currentRole = role || editForm.value.role;

  // 管理员(1)和售后管理(2)不需要选择公司
  if (!currentRole || currentRole === 1 || currentRole === 2 || currentRole === 5) {
    console.log("当前角色不需要选择公司:", currentRole);
    companyOptions.value = [];
    // 清空已选的公司
    editForm.value.assigned_company_id = [];
    return;
  }

  const params: any = {
    role: currentRole.toString()
  };

  try {
    const { data, error } = await fetchCompanies(params);
    console.log("获取公司数据:", data);

    if (error === null && data) {
      // 根据返回的数据结构更新公司选项
      if (Array.isArray(data)) {
        // 如果直接返回数组
        companyOptions.value = data.map((item: any) => ({
          label: item.name || item.company_name || item.title,
          value: String(item.id ?? item.company_id)
        }));
      } else if (data.list && Array.isArray(data.list)) {
        // 如果返回的是分页格式 { list: [], pagination: {} }
        companyOptions.value = data.list.map((item: any) => ({
          label: item.name || item.company_name || item.title,
          value: String(item.id ?? item.company_id)
        }));
      } else {
        console.warn("未知的数据格式:", data);
        companyOptions.value = [];
      }

      // 清空当前选中的公司，因为角色变了
      editForm.value.assigned_company_id = [];
    } else {
      message.error(t('page.users.fetchCompanyFailed', { error }));
      companyOptions.value = [];
    }
  } catch (err) {
    console.error("获取公司数据异常:", err);
    message.error(t('page.users.fetchCompanyFailed', { error: err }));
    companyOptions.value = [];
  }
};


onMounted(fetchData);
watch([searchFilter, searchRole, searchStatus], () => {
  pagination.value.page = 1;
  void fetchData();
});

// ---------------- 授权外部用户弹框 ----------------
const showBindModal = ref(false);
const loadingExternalUsers = ref(false);
const externalUserOptions = ref<{ label: string; value: string; username: string }[]>([]);
const bindForm = ref<{ admin_id: string | null; role: number | null; assigned_company_id?: string[]; username?: string }>({
  admin_id: null,
  role: null,
  assigned_company_id: [],
  username: undefined
});

const fetchExternalUserList = async () => {
  loadingExternalUsers.value = true;
  try {
    const { data, error } = await fetchExternalUsers();
    if (!error && data) {
      const list = Array.isArray(data) ? data : data.list || data.data || [];
      externalUserOptions.value = list.map((u: any) => ({
        label: u.username ? `${u.username}${u.real_name ? ` (${u.real_name})` : ''}` : (u.real_name || u.id),
        value: String(u.id || u.admin_id),
        username: u.username || ''
      }));
    }
  } catch (e) {
    message.error(t('page.users.fetchExternalFailed'));
  } finally {
    loadingExternalUsers.value = false;
  }
};

const handleOpenBind = () => {
  bindForm.value = {
    admin_id: null,
    role: null,
    assigned_company_id: [],
    username: undefined
  };
  fetchExternalUserList();
  showBindModal.value = true;
};

const handleExternalUserChange = (val: string | null, option: any) => {
  if (option) {
    bindForm.value.username = option.username;
  } else {
    bindForm.value.username = undefined;
  }
};

const getBindCompanys = async (val: number) => {
  bindForm.value.assigned_company_id = [];
  if (!val || val === 1 || val === 2 || val === 5) {
    companyOptions.value = [];
    return;
  }

  try {
    const { data, error } = await fetchCompanies({ role: String(val) });
    if (!error && data) {
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.list && Array.isArray(data.list)) {
        list = data.list;
      }
      companyOptions.value = list.map((item: any) => ({
        label: item.name || item.company_name || item.title,
        value: String(item.id ?? item.company_id)
      }));
    } else {
      companyOptions.value = [];
    }
  } catch (err) {
    companyOptions.value = [];
  }
};

const handleBindSave = async () => {
  if (!bindForm.value.admin_id) {
    message.error(t('page.users.validation.requireExternalUser'));
    return;
  }
  if (!bindForm.value.role) {
    message.error(t('page.users.validation.requireRole'));
    return;
  }

  const role = bindForm.value.role;
  if (role !== 1 && role !== 2 && role !== 5) {
    if (!bindForm.value.assigned_company_id || bindForm.value.assigned_company_id.length === 0) {
      message.error(t('page.users.validation.requireCompany'));
      return;
    }
  }

  try {
    const submitData = {
      admin_id: bindForm.value.admin_id,
      username: bindForm.value.username,
      role: bindForm.value.role,
      assigned_company_id: bindForm.value.assigned_company_id && bindForm.value.assigned_company_id.length > 0
        ? bindForm.value.assigned_company_id
        : undefined
    };

    const { error } = await bindExternalUser(submitData);
    if (!error) {
      message.success(t('page.users.bindSuccess'));
      showBindModal.value = false;
      fetchData();
    }
  } catch(e) {
    message.error(t('page.users.bindFailed'));
  }
};

</script>

<template>
  <div class="management-page users-page" :style="themeStyle">
    <header class="management-heading">
      <div class="management-heading__title">
        <span class="management-heading__icon" aria-hidden="true"><UsersIcon /></span>
        <h1>{{ t('route.users') }}</h1>
      </div>
      <div class="management-heading__actions">
        <NButton size="small" :loading="loading" @click="fetchData">
          <template #icon><RefreshIcon /></template>
          {{ t('common.refresh') }}
        </NButton>
        <NButton v-if="isAdmin" type="primary" secondary size="small" @click="handleOpenBind">
          <template #icon><BindIcon /></template>
          {{ t('page.users.actions.bindUser') }}
        </NButton>
        <NButton v-if="isAdmin" type="primary" size="small" @click="handleOpenAdd">
          <template #icon><AddIcon /></template>
          {{ t('page.users.actions.addUser') }}
        </NButton>
      </div>
    </header>

    <ManagementStatusSummary
      :total="matchingCount"
      :total-label="t('page.users.matchingUsers')"
      :status-label="t('page.users.currentPageStatus')"
      :statuses="statusSummary"
      :loading="loading"
    />

    <div class="management-filters">
      <NInput
        v-model:value="searchName"
        class="management-search"
        size="small"
        clearable
        :placeholder="t('page.users.search.namePlaceholder')"
        :input-props="{ 'aria-label': t('page.users.search.namePlaceholder') }"
      >
        <template #prefix><SearchIcon /></template>
      </NInput>
      <NSelect
        v-model:value="searchRole"
        class="management-select users-role-filter"
        :options="modelOptions"
        :placeholder="t('page.users.search.rolePlaceholder')"
        size="small"
        clearable
      />
      <NSelect
        v-model:value="searchStatus"
        class="management-select users-status-filter"
        :options="statusOptions"
        :placeholder="t('page.users.statusFilter')"
        size="small"
        clearable
      />
    </div>

    <section class="management-table-panel" :aria-label="t('route.users')">
      <NDataTable
        class="management-table"
        flex-height
        remote
        size="small"
        :bordered="false"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="tableWidth"
        :row-key="(row: User) => row.id ?? row.username"
      />
    </section>

<NModal
  v-model:show="showModal"
  style="width: min(700px, calc(100vw - 24px))"
  preset="card"
  :title="dialogMode==='add' ? t('page.users.modal.addTitle') : t('page.users.modal.editTitle')"
>
  <NForm :model="editForm" label-width="100">
    <div class="management-dialog-grid">
      <NFormItem :label="t('page.users.modal.usernameLabel')" required  v-if="dialogMode==='add'">
        <NInput v-model:value="editForm.username" :placeholder="t('page.users.modal.usernamePlaceholder')" />
      </NFormItem>
       <NFormItem :label="t('page.users.modal.usernameLabel')"   v-if="dialogMode==='edit'">
        <NInput v-model:value="editForm.username" disabled :placeholder="t('page.users.modal.usernamePlaceholder')" />
      </NFormItem>
      <NFormItem :label="t('page.users.modal.realNameLabel')" required>
        <NInput v-model:value="editForm.real_name" :placeholder="t('page.users.modal.realNamePlaceholder')" />
      </NFormItem>
      <NFormItem :label="t('page.users.modal.passwordLabel')" required v-if="dialogMode==='add'">
        <NInput v-model:value="editForm.password" type="password" :placeholder="t('page.users.modal.passwordPlaceholder')" />
      </NFormItem>
      <NFormItem :label="t('page.users.modal.passwordEditLabel')" v-else>
        <NInput v-model:value="editForm.password" type="password" :placeholder="t('page.users.modal.passwordPlaceholder')" />
      </NFormItem>

      <NFormItem :label="t('page.users.modal.roleLabel')" required>
        <NSelect
          v-model:value="editForm.role"
          :options="modelOptions"
          :placeholder="t('page.users.modal.rolePlaceholder')"
          @update:value="getCompanys"
          clearable
        />
      </NFormItem>

      <NFormItem :label="t('page.users.modal.groupLabel')" required>
        <NSelect
          v-model:value="editForm.group_id"
          :options="groupOptions"
          :placeholder="t('page.users.modal.groupPlaceholder')"
          multiple
          filterable
          clearable
        />
      </NFormItem>

      <NFormItem :label="t('page.users.modal.phoneLabel')" required>
        <NInput v-model:value="editForm.contact_phone" :placeholder="t('page.users.modal.phonePlaceholder')" />
      </NFormItem>

      <NFormItem :label="t('page.users.modal.emailLabel')" required>
        <NInput v-model:value="editForm.email" :placeholder="t('page.users.modal.emailPlaceholder')" />
      </NFormItem>

        <NFormItem
          v-if="editForm.role !== 1 && editForm.role !== 2"
          :label="t('page.users.modal.companyLabel')"
        >
          <NSelect
            v-model:value="editForm.assigned_company_id"
            :options="companyOptions"
            :placeholder="t('page.users.modal.companyPlaceholder')"
            multiple
            clearable
          />
        </NFormItem>

      <NFormItem :label="t('page.users.modal.statusLabel')" required>
        <NSelect
          v-model:value="editForm.status"
          :options="statusOptions"
          :placeholder="t('page.users.modal.statusPlaceholder')"
        />
      </NFormItem>

    </div>
  </NForm>

  <template #footer>
    <NSpace justify="end">
      <NButton size="medium" type="primary" @click="handleSave">{{ t('page.users.modal.save') }}</NButton>
      <NButton size="medium" @click="showModal = false">{{ t('page.users.modal.cancel') }}</NButton>
    </NSpace>
  </template>
</NModal>

<!-- 授权外部用户弹框 -->
<NModal
  v-model:show="showBindModal"
  style="width: min(500px, calc(100vw - 24px))"
  preset="card"
  :title="t('page.users.modal.bindTitle')"
>
  <NForm :model="bindForm" label-width="100">
    <NFormItem :label="t('page.users.modal.externalUserLabel')" required>
      <NSelect
        v-model:value="bindForm.admin_id"
        :options="externalUserOptions"
        :loading="loadingExternalUsers"
        :placeholder="t('page.users.modal.externalUserPlaceholder')"
        filterable
        clearable
        @update:value="handleExternalUserChange"
      />
    </NFormItem>

    <NFormItem :label="t('page.users.modal.roleLabel')" required>
      <NSelect
        v-model:value="bindForm.role"
        :options="modelOptions"
        :placeholder="t('page.users.modal.rolePlaceholder')"
        @update:value="getBindCompanys"
        clearable
      />
    </NFormItem>

    <NFormItem
      v-if="bindForm.role && bindForm.role !== 1 && bindForm.role !== 2 && bindForm.role !== 5"
      :label="t('page.users.modal.companyLabel')"
      required
    >
      <NSelect
        v-model:value="bindForm.assigned_company_id"
        :options="companyOptions"
        :placeholder="t('page.users.modal.companyPlaceholder')"
        multiple
        clearable
      />
    </NFormItem>
  </NForm>

  <template #footer>
    <NSpace justify="end">
      <NButton size="medium" type="primary" @click="handleBindSave">{{ t('page.users.modal.confirmBind') }}</NButton>
      <NButton size="medium" @click="showBindModal = false">{{ t('page.users.modal.cancel') }}</NButton>
    </NSpace>
  </template>
</NModal>
  </div>
</template>

<style src="@/styles/css/management-list.css"></style>
