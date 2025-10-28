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
        style="width: 100%; font-size: 12px;"
      />
      <!-- 场地筛选 -->
      <NSelect 
        v-model:value="siteIdModel" 
        :options="siteOptions" 
        placeholder="请选择场地" 
        clearable 
        filterable
        size="medium"
        style="width: 100%; font-size: 12px;"
      />
      
      <!-- 维修站筛选 -->
      <NSelect 
        v-model:value="stationIdModel" 
        :options="stationOptions" 
        placeholder="请选择维修站" 
        clearable 
        filterable
        size="medium"
        style="width: 100%; font-size: 12px;"
      />

        <NSelect 
        v-model:value="orderStatusModel" 
        :options="statusOptions" 
        placeholder="工单状态" 
        size="medium"
        clearable 
        style="width: 100%; font-size: 12px;"
      />
      </div>
     </template>
    <div v-show="!collapsed" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; align-items: center; margin-top: 8px;">
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
import { computed, ref } from 'vue';
import { NCard, NInput, NSelect, NDatePicker, NButton } from 'naive-ui';
import type { SelectOption } from 'naive-ui';

const props = defineProps<{
  serial: string;
  siteId: number | null;
  stationId: number | null;
  startDate: number | null;
  endDate: number | null;
  orderStatus: number | undefined;
  siteOptions: SelectOption[];
  stationOptions: SelectOption[];
  statusOptions: SelectOption[];
}>();

const emit = defineEmits<{
  (e: 'update:serial', v: string): void;
  (e: 'update:siteId', v: number | null): void;
  (e: 'update:stationId', v: number | null): void;
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