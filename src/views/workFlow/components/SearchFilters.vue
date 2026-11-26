<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { NButton, NCheckbox, NDatePicker, NInput, NPopover, NSelect } from 'naive-ui';
import DownIcon from '~icons/ant-design/down-outlined';
import SearchIcon from '~icons/ant-design/search-outlined';
import type { SelectOption } from 'naive-ui';
import { fetchUser } from '@/service/api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const salerMap = ref<Record<number, string>>({});
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
  if (!siteIdModel.value) return t('page.workflow.siteFilter');
  const site = props.siteOptions.find(s => s.value === siteIdModel.value);
  return site ? String(site.label) : t('page.workflow.siteFilter');
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

const clearSiteSelection = () => {
  siteIdModel.value = null;
  tempSelectedSiteId.value = null;
};

// 监听弹窗打开，初始化临时选中状态
watch(showSiteFilter, (val) => {
  if (val) {
    tempSelectedSiteId.value = siteIdModel.value;
    siteNameFilter.value = '';
  }
});

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
  (e: 'search'): void;
  (e: 'reset'): void;
}>();

const collapsed = ref(true);

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

<template>
  <section class="order-filters">
    <div class="order-filters__row">
      <div class="order-filters__fields">
        <NInput
          v-model:value="serialModel"
          :placeholder="t('page.workflow.orderNo')"
          :input-props="{ 'aria-label': t('page.workflow.orderNo') }"
          clearable
          size="small"
          @keydown.enter="emit('search')"
        >
          <template #prefix><SearchIcon /></template>
        </NInput>
        <NPopover v-model:show="showSiteFilter" trigger="click" placement="bottom-start">
          <template #trigger>
            <NButton class="order-site-trigger" size="small" :aria-expanded="showSiteFilter">
              <span class="order-site-trigger__text" :title="getSelectedSiteLabel()">{{ getSelectedSiteLabel() }}</span>
              <template #icon><DownIcon /></template>
            </NButton>
          </template>
          <div class="order-site-popover">
            <NInput v-model:value="siteNameFilter" size="small" :placeholder="t('page.workflow.searchSite')" />
            <div class="order-site-popover__options">
              <NCheckbox
                v-for="site in filteredSiteOptions"
                :key="String(site.value)"
                :checked="tempSelectedSiteId === Number(site.value)"
                @update:checked="toggleSiteSelection(Number(site.value))"
              >
                {{ site.label }}
              </NCheckbox>
            </div>
            <div class="order-site-popover__actions">
              <NButton v-if="tempSelectedSiteId !== null" size="small" quaternary @click="tempSelectedSiteId = null">
                {{ t('page.workflow.reset') }}
              </NButton>
              <NButton size="small" @click="showSiteFilter = false">{{ t('page.workflow.cancel') }}</NButton>
              <NButton size="small" type="primary" @click="applySiteFilter">{{ t('page.workflow.apply') }}</NButton>
            </div>
          </div>
        </NPopover>
        <NSelect
          v-if="hasRole"
          v-model:value="stationIdModel"
          :options="stationOptions"
          :placeholder="t('page.workflow.selectStation')"
          clearable
          filterable
          size="small"
        />
        <NSelect
          v-model:value="orderStatusModel"
          :options="statusOptions"
          :placeholder="t('page.workflow.orderStatus')"
          size="small"
          clearable
        />
      </div>
      <div class="order-filters__actions">
        <NButton type="primary" size="small" @click="emit('search')">{{ t('page.workflow.search') }}</NButton>
        <NButton size="small" @click="emit('reset')">{{ t('page.workflow.reset') }}</NButton>
        <NButton quaternary size="small" :aria-expanded="!collapsed" @click="collapsed = !collapsed">
          {{ collapsed ? t('page.workflow.expand') : t('page.workflow.collapse') }}
        </NButton>
      </div>
    </div>

    <div v-show="!collapsed" class="order-filters__extended">
      <NSelect
        v-if="!onlyMySite && hasRole"
        v-model:value="salerIdModel"
        :options="salerOptions"
        :placeholder="t('page.workflow.afterSalesSpecialist')"
        size="small"
        clearable
      />
      <NDatePicker
        v-model:value="startDateModel"
        type="date"
        :placeholder="t('page.workflow.startDate')"
        clearable
        size="small"
      />
      <NDatePicker
        v-model:value="endDateModel"
        type="date"
        :placeholder="t('page.workflow.endDate')"
        clearable
        size="small"
      />
    </div>
  </section>
</template>

<style scoped>
.order-filters {
  padding: 10px 12px;
  border: 1px solid var(--order-line);
  border-radius: 10px;
  background: var(--order-surface);
}

.order-filters__row,
.order-filters__actions,
.order-site-popover__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-filters__row,
.order-filters__actions {
  flex-wrap: wrap;
}

.order-filters__fields,
.order-filters__extended {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  min-width: 0;
}

.order-filters__fields {
  flex: 1 1 560px;
}

.order-filters__extended {
  max-width: 600px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--order-line);
}

.order-site-trigger {
  min-width: 0;
  justify-content: space-between;
  flex-direction: row-reverse;
}

.order-site-trigger :deep(.n-button__content),
.order-site-trigger__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-site-trigger :deep(.n-button__icon) {
  margin-inline: 8px 0;
}

.order-site-popover {
  display: grid;
  gap: 8px;
  width: min(260px, calc(100vw - 48px));
}

.order-site-popover__options {
  display: grid;
  gap: 6px;
  max-height: 220px;
  overflow: auto;
}

.order-site-popover__actions {
  justify-content: flex-end;
}

@media (max-width: 700px) {
  .order-filters__fields,
  .order-filters__extended {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
