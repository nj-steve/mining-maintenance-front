<template>
  <!-- <div class="mb-2"> -->
  <NCard size="medium"  :bordered="false" class="faults-search-card text-sm text-gray-500">
     <template #header>
      <!-- 工单编号 -->
       <div class="text-sm text-gray-500" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; align-items: center;">
      <NInput 
        v-model:value="serialModel" 
        placeholder="工单号" 
        clearable 
        size="small"
        class="text-sm text-gray-500"
        style="width: 95%;"
      />
      <!-- 场地筛选 -->
       <div class="relative" style="width: 95%;">
         <NButton 
         size="small" class="!rounded-button whitespace-nowrap w-full flex justify-between items-center" @click="showSiteFilter = !showSiteFilter"> 
           <span class="truncate">{{ getSelectedSiteLabel() }}</span>
           <Icon icon="ant-design:down-outlined" class="ml-2 text-xs" />
         </NButton> 
         <div v-if="showSiteFilter" class="site-filter-dropdown absolute left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-10 border border-gray-200 p-4 min-w-[300px]"> 
           <div class="font-medium text-gray-900 mb-3">选择场地</div> 
           <NInput size="small" placeholder="搜索场地..." class="mb-3" v-model:value="siteNameFilter" /> 
           <div class="max-h-60 overflow-y-auto"> 
             <div 
               v-for="site in filteredSiteOptions" 
               :key="String(site.value)" 
               class="flex items-center py-2 hover:bg-gray-50 rounded px-2" 
             > 
               <input 
                 type="checkbox" 
                 :id="`site-${site.value}`" 
                 class="h-4 w-4 text-blue-600 rounded border-gray-300" 
                 :checked="isSiteSelected(Number(site.value))" 
                 @change="toggleSiteSelection(Number(site.value))" 
               /> 
               <label :for="`site-${site.value}`" class="ml-2 text-gray-700 cursor-pointer flex-grow">{{ site.label }}</label> 
             </div> 
           </div> 
           <div class="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200 gap-2"> 
             <NButton size="small" @click="showSiteFilter = false">取消</NButton> 
             <NButton size="small" type="primary" @click="applySiteFilter">应用</NButton> 
           </div> 
         </div> 
       </div>
      
      <!-- 维修站筛选 -->
      <NSelect 
        v-if="hasRole"
        v-model:value="stationIdModel" 
        :options="stationOptions" 
        placeholder="请选择维修站" 
        clearable 
        filterable
        size="small"
        class="text-sm text-gray-500"
        style="width: 95%;"
      />
        <NSelect 
        v-model:value="orderStatusModel" 
        :options="statusOptions" 
        placeholder="工单状态" 
        size="small"
        clearable 
        class="text-sm text-gray-500"
        style="width: 90%;"
      />
      </div>
     </template>
    <div v-show="!collapsed" class="text-sm text-gray-500" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; align-items: center; margin-top: 8px;">
      <NSelect 
        v-show="!onlyMySiteLocal && hasRole"
        v-model:value="salerIdModel" 
        :options="salerOptions" 
        placeholder="售后专员" 
        size="small"
        clearable 
        class="text-sm text-gray-500"
        style="width: 90%;"
      />
      <!-- 开始时间 -->
      <NDatePicker 
        v-model:value="startDateModel" 
        type="date" 
        placeholder="开始时间" 
        clearable 
        size="small"
        class="text-sm text-gray-500"
        style="width: 100%;"
      />
      <!-- 结束时间 -->
      <NDatePicker 
        v-model:value="endDateModel" 
        type="date" 
        size="small"
        placeholder="结束时间" 
        clearable 
        class="text-sm text-gray-500"
        style="width: 100%;"
      />
      <!-- 工单状态 -->
       

    </div>
    <template #header-extra>
      <div class="text-sm text-gray-500" style="display: flex; justify-content: flex-end; gap: 12px; align-items: center;">
        <!-- 查询按钮 -->
      <NButton type="primary" size="small" class="text-sm text-white" @click="emit('search')">查询</NButton>
      <NButton size="small" class="text-sm text-gray-500" @click="emit('reset')">重置</NButton>
       <NButton quaternary size="small" class="text-sm text-gray-500" @click="collapsed = !collapsed">
        {{ collapsed ? '展开' : '收起' }}
      </NButton>
      </div>
    </template>
  </NCard>
  
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';  

import { NCard, NInput, NSelect, NDatePicker, NButton } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { fetchUser } from '@/service/api';
import { Icon } from '@iconify/vue';
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

// 场地筛选相关逻辑
const showSiteFilter = ref(false);
const siteNameFilter = ref('');
const tempSelectedSiteId = ref<number | null>(null); // 临时选中的场地ID，目前只支持单选，若要多选需改为数组

const filteredSiteOptions = computed(() => {
  if (!siteNameFilter.value) return props.siteOptions;
  return props.siteOptions.filter(site => 
    String(site.label).toLowerCase().includes(siteNameFilter.value.toLowerCase())
  );
});

const getSelectedSiteLabel = () => {
  if (!siteIdModel.value) return '场地筛选';
  const site = props.siteOptions.find(s => s.value === siteIdModel.value);
  return site ? String(site.label) : '场地筛选';
};

const isSiteSelected = (id: number) => {
  // 如果尚未应用，显示临时选择；否则显示当前生效的选择
  const current = showSiteFilter.value ? (tempSelectedSiteId.value ?? siteIdModel.value) : siteIdModel.value;
  return current === id;
};

const toggleSiteSelection = (id: number) => {
  if (tempSelectedSiteId.value === id) {
    tempSelectedSiteId.value = null; // 取消选择
  } else {
    tempSelectedSiteId.value = id; // 选中
  }
};

const applySiteFilter = () => {
  siteIdModel.value = tempSelectedSiteId.value;
  showSiteFilter.value = false;
};

// 监听弹窗打开，初始化临时选中状态
watch(showSiteFilter, (val) => {
  if (val) {
    tempSelectedSiteId.value = siteIdModel.value;
    siteNameFilter.value = '';
  }
});

// 点击外部关闭下拉框 (简单实现，实际可能需要更复杂的点击监听)
const closeSiteFilter = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    // showSiteFilter.value = false; // 暂时注释，避免与内部点击冲突，需要更精确的判断或使用 vueuse/onClickOutside
  }
};

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  if(!props.hasRole){
    return;
  }
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
  hasRole?: boolean;
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
