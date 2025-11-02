<template>
  <!-- <div class="mb-2"> -->
  <NCard size="medium"  :bordered="false" class="faults-search-card">
     <template #header>
      <!-- 工单编号 -->
       <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; align-items: center;">
      <NInput 
        v-model:value="serialModel" 
        placeholder="工单号" 
        clearable 
        size="medium"
        style="width: 95%; font-size: 12px;"
      />
      <!-- 场地筛选 -->
      <NSelect 
        v-model:value="siteIdModel" 
        :options="siteOptions" 
        placeholder="请选择场地" 
        clearable 
        filterable
        size="medium"
        style="width: 95%; font-size: 12px;"
      />
      
      <!-- 维修站筛选 -->
      <NSelect 
        v-model:value="stationIdModel" 
        :options="stationOptions" 
        placeholder="请选择维修站" 
        clearable 
        filterable
        size="medium"
        style="width: 95%; font-size: 12px;"
      />

        <NSelect 
        v-model:value="orderStatusModel" 
        :options="statusOptions" 
        placeholder="工单状态" 
        size="medium"
        clearable 
        style="width: 90%; font-size: 12px;"
      />
      </div>
     </template>
    <div v-show="!collapsed" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; align-items: center; margin-top: 8px;">
      <NSelect 
        v-show="!onlyMySiteLocal"
        v-model:value="salerIdModel" 
        :options="salerOptions" 
        placeholder="售后专员" 
        size="medium"
        clearable 
        style="width: 90%; font-size: 12px;"
      />
      <!-- 开始时间 -->
      <NDatePicker 
        v-model:value="startDateModel" 
        type="date" 
        placeholder="开始时间" 
        clearable 
        size="medium"
        style="width: 100%; font-size: 12px;"
      />
      <!-- 结束时间 -->
      <NDatePicker 
        v-model:value="endDateModel" 
        type="date" 
        size="medium"
        placeholder="结束时间" 
        clearable 
        style="width: 100%; font-size: 12px;"
      />
      <!-- 工单状态 -->
       

    </div>
    <template #header-extra>
      <div style="display: flex; justify-content: flex-end; gap: 12px; align-items: center;">
        <!-- 查询按钮 -->
      <NButton type="primary" size="medium"  @click="emit('search')">查询</NButton>
      <NButton size="medium"  @click="emit('reset')">重置</NButton>
       <NButton quaternary size="medium" @click="collapsed = !collapsed">
        {{ collapsed ? '展开' : '收起' }}
      </NButton>
      </div>
    </template>
  </NCard>
  
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';  

import { NCard, NInput, NSelect, NDatePicker, NButton, NSwitch } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { fetchUser } from '@/service/api';
import local from '@/locales/langs/zh-cn';
// import local from '@/locales/langs/zh-cn';
const salerMap = ref<Record<number, string>>({});
// import { useAuthStore } from '@/stores/auth';

// 原基于 localStorage 的 computed 不会在同页实时响应，注释并改用 ref + 监听
// const onlyMySiteLocal = computed(() => {
//   console.log("localStorage.getItem('onlyMySite')",localStorage.getItem('onlyMySite'))
//   return localStorage.getItem('onlyMySite') === 'true';
// });
// watch(onlyMySiteLocal, (newVal) => {
//   if (newVal) {
//     salerIdModel.value = null;
//   }
// });

// 使用 ref 保存状态，并实时同步 localStorage 的变化
const onlyMySiteLocal = ref<boolean>(localStorage.getItem('onlyMySite') === 'true');
let onlyMySitePoller: number | null = null;
const readOnlyMySite = () => localStorage.getItem('onlyMySite') === 'true';

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



onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  const {data,error} = await fetchUser({
    page: 1,
    page_size: -1,
    status: 1,
    role: 2,
  });
  if(error==null){
    console.log("data.list",data.list)
    const salerMap_byId = data.list.reduce((acc:any, cur:any) => {
      acc[cur.id] = cur.real_name;
      return acc;
    }, {} as Record<number, string>);
    console.log("salerMap_byId",salerMap_byId)
    salerMap.value = salerMap_byId;

    // editForm.value.saler_id = data[0].id;
  }else{
    // message.error('获取用户失败:' +error);
  }
}

const salerOptions = computed(() => {
  return Object.entries(salerMap.value).map(([id, name]) => ({ label: name, value: Number(id) }));
});
const props = defineProps<{
  serial: string;
  siteId: number | null;
  stationId: number | null;
  startDate: number | null;
  salerId: number | null;
  endDate: number | null;
  orderStatus: number | undefined;
  siteOptions: SelectOption[];
  stationOptions: SelectOption[];
  statusOptions: SelectOption[];
  onlyMySite?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:serial', v: string): void;
  (e: 'update:siteId', v: number | null): void;
  (e: 'update:stationId', v: number | null): void;
  (e: 'update:salerId', v: number | null): void;
  (e: 'update:startDate', v: number | null): void;
  (e: 'update:endDate', v: number | null): void;
  (e: 'update:orderStatus', v: number | undefined): void;
  (e: 'update:onlyMySite', v: boolean): void;
  (e: 'search'): void;
  (e: 'reset'): void;
}>();

// 删除重复的 onlyMySite 计算属性
// const onlyMySite = computed({
//   get: () => props.onlyMySite ?? false,
//   set: v => emit('update:onlyMySite', !!v)
// });
const collapsed = ref(true);
// 初始化内部内存状态，并与 props 同步

const serialModel = computed({
  get: () => props.serial,
  set: v => emit('update:serial', v)
});
const siteIdModel = computed({
  get: () => props.siteId,
  set: v => emit('update:siteId', v as number | null)
});
const stationIdModel = computed({
  get: () => props.stationId,
  set: v => emit('update:stationId', v as number | null)
});
const startDateModel = computed({
  get: () => props.startDate,
  set: v => emit('update:startDate', v as number | null)
});
const salerIdModel = computed({
  get: () => props.salerId,
  set: v => emit('update:salerId', v as number | null)
});
const endDateModel = computed({
  get: () => props.endDate,
  set: v => emit('update:endDate', v as number | null)
});
const orderStatusModel = computed({
  get: () => props.orderStatus,
  set: v => emit('update:orderStatus', v as number | undefined)
});
</script>

<style scoped>
.faults-search-card :deep(.n-card-header__main){
  width: calc(100% - 200px);
}
</style>