<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NButton, NInput, NSelect, NDatePicker } from 'naive-ui';
import type { SelectOption } from 'naive-ui';

const serial = defineModel<string>('serial', { default: '' });
const workOrderNo = defineModel<string>('workOrderNo', { default: '' });
const siteId = defineModel<number | null>('siteId', { default: null });
const startDate = defineModel<number | null>('startDate', { default: null });
const endDate = defineModel<number | null>('endDate', { default: null });
const status = defineModel<number | null>('status', { default: null });

const props = defineProps<{ siteOptions: SelectOption[]; statusOptions: SelectOption[],hasRole:boolean }>();
const emit = defineEmits<{ (e: 'search'): void }>();

const expanded = ref(false);

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
        placeholder="状态"
        clearable
        style="width: 100%"
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
     
    </div>
    </template>
    <template #header-extra>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <NButton type="primary" size="medium" @click="onSearch">搜索</NButton>
        <NButton size="medium" quaternary @click="toggleExpand">{{ expanded ? '折叠' : '展开' }}</NButton>
      </div>
    </template>

   

  

    <!-- 移除底部按钮容器，按钮固定在右上角 -->
  </NCard>
</template>

<style scoped>
</style>