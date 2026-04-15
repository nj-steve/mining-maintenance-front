<script setup lang="ts">
// import { ref, watch } from 'vue';
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { NCard, NButton, NInput, NSelect, NDatePicker, NSwitch } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
// import { repairResultOptions } from '@/constants/business';
import { fetchUser } from '@/service/api';
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const computedRepairResultOptions = computed(() => [
  { label: t('business.repairResult.pending'), value: 1 },
  { label: t('business.repairResult.unrepaired'), value: 2 },
  { label: t('business.repairResult.repaired'), value: 3 },
  { label: t('business.repairResult.scrapped'), value: 4 },
]);


const serial = defineModel<string>('serial', { default: '' });
const workOrderNo = defineModel<string>('workOrderNo', { default: '' });
const siteId = defineModel<number | null>('siteId', { default: null });
const startDate = defineModel<number | null>('startDate', { default: null });
const endDate = defineModel<number | null>('endDate', { default: null });
const status = defineModel<number | null>('status', { default: null });
const resultStatus = defineModel<number | null>('resultStatus', { default: null });
const salerIdModel = defineModel<number | null>('salerId', { default: null });
const repairType = defineModel<number | null>('repairType', { default: null });

const props = defineProps<{
   siteOptions: SelectOption[];
  statusOptions: SelectOption[],
  repairTypeOptions?: SelectOption[],
  hasRole:boolean
  // salerOptions: SelectOption[]

 }>();
const emit = defineEmits<{ (e: 'search'): void }>();

const expanded = ref(true);
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

// 场地筛选相关逻辑
const showSiteFilter = ref(false);
const siteNameFilter = ref('');
const tempSelectedSiteId = ref<number | null>(null);

const filteredSiteOptions = computed(() => {
  if (!siteNameFilter.value) return props.siteOptions;
  return props.siteOptions.filter(site =>
    String(site.label).toLowerCase().includes(siteNameFilter.value.toLowerCase())
  );
});

const getSelectedSiteLabel = () => {
  if (!siteId.value) return t('page.faults.searchCard.siteFilter');
  const site = props.siteOptions.find(s => s.value === siteId.value);
  return site ? String(site.label) : t('page.faults.searchCard.siteFilter');
};

const isSiteSelected = (id: number) => {
  // 如果尚未应用，显示临时选择；否则显示当前生效的选择
  const current = showSiteFilter.value ? (tempSelectedSiteId.value ?? siteId.value) : siteId.value;
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
  siteId.value = tempSelectedSiteId.value;
  showSiteFilter.value = false;
};

const clearSiteSelection = () => {
  siteId.value = null;
  tempSelectedSiteId.value = null;
};

// 监听弹窗打开，初始化临时选中状态
watch(showSiteFilter, (val) => {
  if (val) {
    tempSelectedSiteId.value = siteId.value;
    siteNameFilter.value = '';
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

       <!-- <NSelect
        size="medium"
        v-model:value="siteId"
        :options="props.siteOptions"
        placeholder="请选择场地"
        v-if="props.siteOptions.length > 1"
        class="site-select"
        clearable
        filterable
        style="width: 100%"
      /> -->

       <div class="relative" style="width: 95%;" v-if="props.siteOptions.length > 1">
         <NButton
         size="small" class="!rounded-button whitespace-nowrap w-full flex justify-between items-center" @click="showSiteFilter = !showSiteFilter">
           <span class="truncate">{{ getSelectedSiteLabel() }}</span>
           <!-- <Icon icon="ant-design:down-outlined" class="ml-2 text-xs" /> -->
            <Icon
             v-if="siteId"
             icon="ant-design:close-circle-outlined"
             class="ml-2 text-xs text-gray-400 hover:text-gray-600 z-10"
             @click.stop="clearSiteSelection"
           />
           <Icon v-else icon="ant-design:down-outlined" class="ml-2 text-xs" />
         </NButton>
         <div v-if="showSiteFilter" class="site-filter-dropdown absolute left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-10 border border-gray-200 p-4 min-w-[300px]">
           <div class="font-medium text-gray-900 mb-3">{{ t('page.faults.searchCard.selectSite') }}</div>
           <NInput size="small" :placeholder="t('page.faults.searchCard.searchSite')" class="mb-3" v-model:value="siteNameFilter" >

          </NInput>
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
             <NButton size="small" @click="showSiteFilter = false">{{ t('page.faults.searchCard.cancel') }}</NButton>
             <NButton size="small" type="primary" @click="applySiteFilter">{{ t('page.faults.searchCard.apply') }}</NButton>
           </div>
         </div>
       </div>

       <NInput
        v-model:value="workOrderNo"
        size="small"
        :placeholder="t('page.faults.searchCard.inputOrderNo')"
        clearable
        style="width: 100%"
      />
       <NSelect
        size="small"
        v-model:value="status"
        :options="props.statusOptions"
        :placeholder="t('page.faults.searchCard.flowStatus')"
        clearable
        style="width: 100%"
      />
      <NSelect
        size="small"
        v-model:value="resultStatus"
        :options="computedRepairResultOptions"
        :placeholder="t('page.faults.searchCard.repairStatus')"
        clearable
        style="width: 100%"
      />
      <NSelect
        size="small"
        v-model:value="repairType"
        :options="props.repairTypeOptions"
        :placeholder="t('page.faults.searchCard.type')"
        clearable
        style="width: 100%"
      />

      </div>
      <div v-if="expanded" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; align-items: center; margin-top: 8px;">
      <NInput
        v-model:value="serial"
        size="small"
        :placeholder="t('page.faults.searchCard.inputSn')"
        clearable
        style="width: 100%"
      />
       <NSelect
        v-show="!onlyMySiteLocal && props.hasRole"
        v-model:value="salerIdModel"
        :options="salerOptions"
        :placeholder="t('page.faults.searchCard.afterSalesSpecialist')"
        size="small"
        clearable
        style="width: 100%; font-size: 12px;"
      />

      <NDatePicker
        v-model:value="startDate"
        type="date"
        :placeholder="t('page.faults.searchCard.startDate')"
        clearable
        size="small"
        style="width: 100%"
      />

      <NDatePicker
        v-model:value="endDate"
        type="date"
        size="small"
        :placeholder="t('page.faults.searchCard.endDate')"
        clearable
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
        <NButton type="primary" size="small" @click="onSearch">{{ t('page.faults.searchCard.search') }}</NButton>
        <NButton size="small" quaternary @click="toggleExpand">{{ expanded ? t('page.faults.searchCard.collapse') : t('page.faults.searchCard.expand') }}</NButton>
      </div>
    </template>
    <!-- 移除底部按钮容器，按钮固定在右上角 -->
  </NCard>
</template>

<style scoped>
</style>
