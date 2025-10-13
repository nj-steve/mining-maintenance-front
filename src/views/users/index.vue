<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog, NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchUser, updateUser, createUser,fetchCompanies } from '@/service/api/auth';
import { roleTagMap, roleRecord, userStatusMap, userStatusRecord } from "@/constants/business"
import { REG_EMAIL } from '@/constants/reg';

interface Company {
  id: number;
  name: string;
}

interface User {
  id?: number;                  // 主键ID（编辑时需要）
  username: string;              // 用户名
  contact_phone: string;         // 联系电话
  company_info: Company [];               // 公司
  role: number;                  // 角色：1-管理员，2-售后管理，3-运维人员，4-维修人员
  email: string;                 // 邮箱
  start_date: string;            // 入职日期 (YYYY-MM-DD)
  status?: number;               // 状态：1-在职，0-离职（可选）
}

interface EditUser {
  id:number,
  assigned_company_id: string;
  company: string;
  contact_phone: string;
  email: string;
  role: number;
  start_date: string;
  status: number;
  username: string;
}

const dialog = useDialog()
const message = useMessage();

const tableData = ref<User[]>([]);
const loading = ref(false);
const searchSerial = ref<string>(''); // 序列号搜索
const searchRole = ref<number>(); // 角色筛选

const modelOptions = ref<{ label: string; value: number }[]>([])
// 状态下拉选项
const statusOptions =  ref<{ label: string; value: number }[]>([])
// 公司下拉选项
const companyOptions = ref<{ label: string; value: string }[]>([])
// const roleCompany=ref<[]>([]); //  获取角色公司id
// [
  // { label: '在架', value: 1 },
  // { label: '维修', value: 2 },
  // { label: '报废', value: 3 },
  // { label: '下架', value: 4 }
// ];


// 分页
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
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
  assigned_company_id: "",
  company: "",
  contact_phone: "",
  email: "",
  role: 1,        // 默认角色，可以根据需求调整
  start_date: "", // 可以用 "" 或 new Date().toISOString()
  status: 0,      // 默认状态
  username: ""
});

// 打开添加弹框
const handleOpenAdd = () => {
  dialogMode.value = 'add';
  editForm.value = {
    id: 0,
    assigned_company_id: "",
    company: "",
    contact_phone: "",
    email: "",
    role: 1,        // 默认角色，可以根据需求调整
    start_date: "", // 可以用 "" 或 new Date().toISOString()
    status: 0,      // 默认状态
    username: ""
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
  return {
    id: user.id || 0,
    assigned_company_id: user.company_info[0].id.toString() || "",
    company: user.company_info[0].name || "",
    contact_phone: user.contact_phone || "",
    email: user.email || "",
    role: user.role || 1,
    start_date: user.start_date || "",
    status: user.status !== undefined ? user.status : 0,
    username: user.username || ""
  };
}

// 打开编辑弹框
const handleOpenEdit = (row: User) => {
  dialogMode.value = 'edit';
  editForm.value =userToEditUser(row)
  // editForm.value = { ...row }; // 拷贝一份
  // console.log("editForm.value",editForm.value)
  
  // 根据角色加载对应的公司选项
  if (row.role) {
    getCompanys(row.role);
  }
  
  showModal.value = true;
};

// 保存（新增/编辑共用）
const handleSave = async () => {
  try {
    // 验证表单数据
     // 如果没有传入角色，使用当前表单中的角色
  const currentRole = editForm.value.role;
  
  // 管理员(1)和售后管理(2)不需要选择公司
  if (!currentRole || currentRole === 1 || currentRole === 2) {
    console.log("当前角色不需要选择公司:", currentRole);
  }else if (!editForm.value.assigned_company_id) {
      message.error('请选择所属公司');
      return;
    }
    if (!editForm.value.contact_phone) {
      message.error('请输入联系电话');
      return;
    }
    if (!editForm.value.email) {
      message.error('请输入邮箱');
      return false;
    }
    if (!REG_EMAIL.test(editForm.value.email.trim())) {
      message.error('邮箱格式不正确');
      return false;
    }
    
    // if (!editForm.value.start_date) {
    //   message.error('请输入入职时间');
    //   return;
    // }

    if (dialogMode.value === 'add') {
      const res = await createUser(editForm.value);
      console.log("addUser",res)
      if (res.response?.data?.msg === "Operation successful") {
        message.success('添加成功！');
        fetchData();
      } else {
        message.error('添加失败: ' + res.response?.data?.msg);
      }
    } else {
      
      const res = await updateUser(editForm.value.id!, editForm.value);
      console.log("updateUser",res)
      if (res.response?.data?.msg === "Operation successful") {
        message.success('修改成功！');
        fetchData();
      } else {
        message.error('修改失败: ' + res.response?.data?.msg);
      }
    }
  } catch (err) {
    message.error(dialogMode.value === 'add' ? '添加失败' : '修改失败');
  } finally {
    showModal.value = false;
  }
};

// ---------------- 表格列 ----------------
const columns: DataTableColumns<User> = [
  { title: '姓名', key: 'username', width: 200 },
  { title: '角色类型', key: 'role', render: (row: any ) => {
    const label = roleRecord[row.role] || '未知';
    return h(NTag, {type: roleTagMap[row.role] }, () => label)
  }},
  { title: '联系电话', key: 'contact_phone'},   
  { title: '邮箱', key: 'email'},
  { title: '所属公司', key: 'company_info',render: (row: any ) => {
    return row.company_info?.[0]?.name || '未知';
  } },
  { title: '入职时间', key: 'start_date' },
  { title: '状态', key: 'status', 
    render: (row: any ) => {
      const label = userStatusRecord[row.status] || '未知';
      return h(NTag, {type: userStatusMap[row.status] }, () => label)
    }
  },
  {
    title: '操作',
    key: 'actions',
    align:'center',
    render: (row: User) => {
      return h(
        NButton,
        {
          type: 'info',
          ghost: true,
          onClick: () => handleOpenEdit(row)
        },
        { default: () => '编辑' }
      )
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  loading.value = true;
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    // username: searchSerial.value || '',
    // role:searchRole.value||undefined
  };
  if (searchSerial.value) params.username = searchSerial.value
  if (searchRole.value) params.role = searchRole.value
  

  try {
    const {data,error} = await fetchUser(params);
    if(error==null){
      tableData.value = data.list;
      pagination.value.itemCount = data.pagination.total;
      pagination.value.page =  data.pagination.page;
      pagination.value.pageSize =  data.pagination.page_size;
    }else{
      message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
};

// ---------------- 数据获取 ----------------
const getCompanys = async (role?: number) => {
  // 如果没有传入角色，使用当前表单中的角色
  const currentRole = role || editForm.value.role;
  
  // 管理员(1)和售后管理(2)不需要选择公司
  if (!currentRole || currentRole === 1 || currentRole === 2) {
    console.log("当前角色不需要选择公司:", currentRole);
    companyOptions.value = [];
    // 清空已选的公司
    editForm.value.assigned_company_id = "";
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
      editForm.value.assigned_company_id = "";
    } else {
      message.error(`加载公司数据失败: ${error}`);
      companyOptions.value = [];
    }
  } catch (err) {
    console.error("获取公司数据异常:", err);
    message.error(`加载公司数据失败: ${err}`);
    companyOptions.value = [];
  }
};


onMounted(() => {
  fetchData()
  // 初始化赋值
  modelOptions.value = Object.entries(roleRecord).map(([key, label]) => ({
    label,                // 角色名称
    value: Number(key)    // 角色 id（数字）
  }))
  statusOptions.value = Object.entries(userStatusRecord).map(([key, label]) => ({
    label,                // 角色名称
    value: Number(key)    // 角色 id（数字）
  }))

  
});
watch([searchSerial,searchRole], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
});

</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <NButton type="primary" ghost size="small" @click="handleOpenAdd"> + 新增人员</NButton>
      <div style="display: flex; align-items: center; gap: 12px;">
        <NSelect v-model:value="searchRole" :options="modelOptions"  placeholder="角色筛选" clearable />
        <NInput v-model:value="searchSerial" @change="fetchData" placeholder="请输入姓名" clearable style="width: 240px" />
      </div>
    </div>

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" remote />

    <!-- 添加/编辑 弹框 -->
     <!-- 添加/编辑 弹框 -->
<NModal
  v-model:show="showModal"
  style="width: 700px"
  preset="card"
  :title="dialogMode==='add' ? '添加用户' : '编辑用户'"
>
  <NForm :model="editForm" label-width="100">
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
      <NFormItem label="姓名">
        <NInput v-model:value="editForm.username" placeholder="请输入姓名" />
      </NFormItem>

      <NFormItem label="角色类型">
        <NSelect
          v-model:value="editForm.role"
          :options="modelOptions"
          placeholder="请选择角色类型"
          @update:value="getCompanys"
          clearable
        />
      </NFormItem>

      <NFormItem label="联系电话">
        <NInput v-model:value="editForm.contact_phone" placeholder="请输入联系电话" />
      </NFormItem>

      <NFormItem label="邮箱">
        <NInput v-model:value="editForm.email" placeholder="请输入邮箱" />
      </NFormItem>

        <NFormItem 
          v-if="editForm.role !== 1 && editForm.role !== 2" 
          label="所属公司"
        >
          <NSelect
            v-model:value="editForm.assigned_company_id"
            :options="companyOptions"
            placeholder="请选择公司"
            clearable
          />
          <!-- <NInput v-model:value="editForm.Company" placeholder="请输入所属公司" /> -->
        </NFormItem>

      <NFormItem label="用户状态">
        <NSelect
          v-model:value="editForm.status"
          :options="statusOptions"
          placeholder="请选择状态"
        />
      </NFormItem>

      <!-- <NFormItem label="权限分配"> -->

        <!-- <NSelect v-model:value="editForm.role" placeholder="请输入权限分配" /> -->
      <!-- </NFormItem> -->
    </div>
  </NForm>

  <template #footer>
    <NButton type="primary" @click="handleSave">保存</NButton>
    <NButton @click="showModal = false">取消</NButton>
  </template>
</NModal>
    <!-- <NModal v-model:show="showModal" style="width: 600px" preset="card" :title="dialogMode==='add' ? '添加用户' : '编辑用户'">
      <NForm :model="editForm" label-width="100">
        <NFormItem label="机型">
          <NSelect v-model:value="editForm.Faults_type_id" :options="modelOptions" />
        </NFormItem>
        <NFormItem label="机器编号">
          <NInput v-model:value="editForm.serial_number" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="editForm.status_id" :options="statusOptions" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton type="primary" @click="handleSave">保存</NButton>
        <NButton @click="showModal = false">取消</NButton>
      </template>
    </NModal> -->
  </div>
</template>