<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog, NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchUser, updateUser, createUser } from '@/service/api/auth';
import { roleTagMap, roleRecord, userStatusMap, userStatusRecord } from "@/constants/business"

interface User {
  id?: number;                  // 主键ID（编辑时需要）
  Username: string;              // 用户名
  ContactPhone: string;         // 联系电话
  Company: string;               // 公司
  Role: number;                  // 角色：1-管理员，2-售后管理，3-运维人员，4-维修人员
  Email: string;                 // 邮箱
  StartDate: string;            // 入职日期 (YYYY-MM-DD)
  AssignedCompanyID?: number;  // 分配的公司/站点/维修站 ID（可选）
  Status?: number;               // 状态：1-在职，0-离职（可选）
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
const editForm = ref<User>({
  id: undefined,
  Username: '',
  ContactPhone: '',
  Company: '',
  Role: 1,
  Email: '',
  StartDate: '',
  AssignedCompanyID: undefined,
  Status: 1
});



// 打开添加弹框
const handleOpenAdd = () => {
  dialogMode.value = 'add';
  editForm.value = {
    Username: '',
    ContactPhone: '',
    Company: '',
    Role: 1,
    Email: '',
    StartDate: '',
    AssignedCompanyID: undefined,
    Status: 1
  };
  
  // editForm.value = {
  //   id: undefined,
  //   Faults_type_id: 0,
  //   status_id: 0,
  //   serial_number: ''
  // };
  showModal.value = true;
};

// 打开编辑弹框
const handleOpenEdit = (row: User) => {
  dialogMode.value = 'edit';
  editForm.value = { ...row }; // 拷贝一份
  console.log("editForm.value",editForm.value)
  showModal.value = true;
};

// 保存（新增/编辑共用）
const handleSave = async () => {
  try {
    if (dialogMode.value === 'add') {
      const res = await createUser(editForm.value);
      if (res.response?.data?.msg === "success") {
        message.success('添加成功！');
        fetchData();
      } else {
        message.error('添加失败: ' + res.response?.data?.msg);
      }
    } else {
      const res = await updateUser(editForm.value.id!, editForm.value);
      if (res.response?.data?.msg === "success") {
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
  { title: '姓名', key: 'Username', width: 200 },
  { title: '角色类型', key: 'Role', render: (row: any ) => {
    const label = roleRecord[row.Role] || '未知';
    return h(NTag, {type: roleTagMap[row.Role] }, () => label)
  }},
  { title: '联系电话', key: 'ContactPhone'},
  { title: '邮箱', key: 'Email'},
  { title: '所属公司', key: 'Company' },
  { title: '入职时间', key: 'StartDate' },
  { title: '状态', key: 'Status', 
    render: (row: any ) => {
      const label = userStatusRecord[row.Status] || '未知';
      return h(NTag, {type: userStatusMap[row.Status] }, () => label)
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
        <NInput v-model:value="editForm.Username" placeholder="请输入姓名" />
      </NFormItem>

      <NFormItem label="角色类型">
        <NSelect
          v-model:value="editForm.Role"
          :options="modelOptions"
          placeholder="请选择角色类型"
          clearable
        />
      </NFormItem>

      <NFormItem label="联系电话">
        <NInput v-model:value="editForm.ContactPhone" placeholder="请输入联系电话" />
      </NFormItem>

      <NFormItem label="邮箱">
        <NInput v-model:value="editForm.Email" placeholder="请输入邮箱" />
      </NFormItem>

      <NFormItem label="所属公司">
        <NInput v-model:value="editForm.Company" placeholder="请输入所属公司" />
      </NFormItem>

      <NFormItem label="用户状态">
        <NSelect
          v-model:value="editForm.Status"
          :options="statusOptions"
          placeholder="请选择状态"
        />
      </NFormItem>

      <NFormItem label="权限分配">

        <!-- <NSelect v-model:value="editForm.role" placeholder="请输入权限分配" /> -->
      </NFormItem>
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