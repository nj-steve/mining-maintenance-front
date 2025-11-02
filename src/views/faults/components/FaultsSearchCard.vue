<script setup lang="ts">
// import { ref, watch } from 'vue';
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';  
import { NCard, NButton, NInput, NSelect, NDatePicker, NSwitch } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { repairResultOptions } from '@/constants/business';
import { fetchUser } from '@/service/api';

const serial = defineModel<string>('serial', { default: '' });
const workOrderNo = defineModel<string>('workOrderNo', { default: '' });
const siteId = defineModel<number | null>('siteId', { default: null });
const startDate = defineModel<number | null>('startDate', { default: null });
const endDate = defineModel<number | null>('endDate', { default: null });
const status = defineModel<number | null>('status', { default: null });
const resultStatus = defineModel<number | null>('resultStatus', { default: null });
const salerIdModel = defineModel<number | null>('salerId', { default: null });



const props = defineProps<{
   siteOptions: SelectOption[]; 
  statusOptions: SelectOption[],
  hasRole:boolean
  // salerOptions: SelectOption[]

 }>();
const emit = defineEmits<{ (e: 'search'): void }>();

const expanded = ref(false);
// 使用 ref 保存状态，并实时同步 localStorage 的变化
const onlyMySiteLocal = ref<boolean>(localStorage.getItem('onlyMySite') === 'true');
let onlyMySitePoller: number | null = null;
const readOnlyMySite = () => localStorage.getItem('onlyMySite') === 'true';
const salerMap = ref<Record<number, string>>({});

const fetchUsers = async () => {
  const {data,error} = await fetchUser({
    page: 1,
    page_size: -1,
    status: 1,
    role: 2,
  });
  if(error==null){
    // console.log("data.list",data.list)
    const salerMap_byId = data.list.reduce((acc:any, cur:any) => {
      acc[cur.id] = cur.real_name;
      return acc;
    }, {} as Record<number, string>);
    // console.log("salerMap_byId",salerMap_byId)
    salerMap.value = salerMap_byId;

    // editForm.value.saler_id = data[0].id;
  }else{
    // message.error('获取用户失败:' +error);
  }
}

const salerOptions = computed(() => {
  return Object.entries(salerMap.value).map(([id, name]) => ({ label: name, value: Number(id) }));
});

onMounted(() => {
  if(props.hasRole){
    fetchUsers();
  }
});

onMounted(() => {
  const update = () => {
    const val = readOnlyMySite();
    if (onlyMySiteLocal.value !== val) {
      onlyMySiteLocal.value = val;
    }
  };
  // 初始化一次
  update();
  // 在同一标签页内轮询以捕获 setItem 引发的变化
  onlyMySitePoller = window.setInterval(update, 250);
  // 监听其它标签页/窗口的存储变化
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'onlyMySite') {
      update();
    }
  });
});

onUnmounted(() => {
  if (onlyMySitePoller !== null) {
    clearInterval(onlyMySitePoller);
    onlyMySitePoller = null;
  }
});

// 根据是否勾选“我的场地”，清空售后专员筛选
watch(onlyMySiteLocal, (newVal) => {
  if (newVal) {
    salerIdModel.value = null;
  }
});

function onSearch() {
  emit('search');
}

function toggleExpand() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <NCard size="small" :bordered="false" class="faults-search-card">
    <template #header>
      <!-- <span></span> -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; align-items: center;">
      <NInput
        v-model:value="serial"
        size="medium"
        placeholder="请输入机器SN"
        clearable
        style="width: 100%"
      />
      <NInput
        v-model:value="workOrderNo"
        size="medium"
        placeholder="请输入工单号"
        clearable
        style="width: 100%"
      />
       <NSelect
        size="medium"
        v-model:value="status"
        :options="props.statusOptions"
        placeholder="流转状态"
        clearable
        style="width: 100%"
      />
      <NSelect
        size="medium"
        v-model:value="resultStatus"
        :options="repairResultOptions"
        placeholder="维修状态"
        clearable
        style="width: 100%"
      />
       <NSelect 
        v-show="!onlyMySiteLocal && props.hasRole"
        v-model:value="salerIdModel" 
        :options="salerOptions" 
        placeholder="售后专员" 
        size="medium"
        clearable 
        style="width: 90%; font-size: 12px;"
      />
      </div>
      <div v-if="expanded" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; align-items: center; margin-top: 8px;">
      <NDatePicker
        v-model:value="startDate"
        type="date"
        placeholder="开始时间"
        clearable
        size="medium"
        style="width: 100%"
      />

      <NDatePicker
        v-model:value="endDate"
        type="date"
        size="medium"
        placeholder="结束时间"
        clearable
        style="width: 100%"
      />
      <NSelect
        size="medium"
        v-model:value="siteId"
        :options="props.siteOptions"
        placeholder="请选择场地"
        v-if="hasRole"
        class="site-select"
        clearable
        filterable
        style="width: 100%"
      />
      <div>
      <!-- <NSwitch v-model:value="onlyMySite" size="medium" />
    <span style="font-size: 12px; margin-left: 4px;">我的场地</span> -->
    </div>
     
    </div>
    </template>
    <template #header-extra>
      <div style="display: flex; justify-content: flex-end;margin-left: 20px;  gap: 12px;">
        <NButton type="primary" size="medium" @click="onSearch">搜索</NButton>
        <NButton size="medium" quaternary @click="toggleExpand">{{ expanded ? '折叠' : '展开' }}</NButton>
      </div>
    </template>

   

  

    <!-- 移除底部按钮容器，按钮固定在右上角 -->
  </NCard>
</template>

<style scoped>
</style>