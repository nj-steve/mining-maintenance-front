<template>
  <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
    <!-- 日期选择 -->
    <NDatePicker
      v-model:formatted-value="dateModel"
      value-format="yyyy-MM-dd"
      type="date"
      clearable
      size="medium"
      style="width: 160px"
      @update:value="emit('search')"
    />

    <!-- 场地名称搜索 -->
    <NInput
      v-model:value="serialModel"
      @change="emit('search')"
      :placeholder="t('page.miningSite.searchBar.placeholder.siteName')"
      clearable
      style="width: 240px"
      size="medium"
    />

    <!-- 售后专员下拉搜索 -->
    <NSelect
      v-model:value="salerIdModel"
      :options="salerOptions"
      clearable
      filterable
      :placeholder="t('page.miningSite.searchBar.placeholder.afterSalesSpecialist')"
      style="width: 200px"
      size="medium"
      @update:value="emit('search')"
    />

    <!-- 站点状态下拉搜索 -->
    <NSelect
      v-model:value="siteStatusModel"
      :options="siteStatusOptions"
      clearable
      filterable
      :placeholder="t('page.miningSite.searchBar.placeholder.siteStatus')"
      style="width: 200px"
      size="medium"
      @update:value="emit('search')"
    />

    <!-- 绑定工单类型下拉搜索 -->
    <NSelect
      v-model:value="bindTypeModel"
      :options="bindTypeOptions"
      clearable
      filterable
      :placeholder="t('page.miningSite.searchBar.placeholder.bindType')"
      style="width: 200px"
      size="medium"
      @update:value="emit('search')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NInput, NSelect, NDatePicker } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  date: string | null;
  serial: string;
  salerId: number | null;
  siteStatus: number | null;
  bindType: string | null;
  salerOptions: SelectOption[];
  siteStatusOptions: SelectOption[];
  bindTypeOptions: SelectOption[];
  borderBindTypeOptions: SelectOption[];
}>();

const emit = defineEmits<{
  (e: 'update:date', v: string | null): void;
  (e: 'update:serial', v: string): void;
  (e: 'update:salerId', v: number | null): void;
  (e: 'update:siteStatus', v: number | null): void;
  (e: 'update:bindType', v: string | null): void;
  (e: 'update:borderBindType', v: string | null): void;
  (e: 'search'): void;
}>();

const dateModel = computed({
  get: () => props.date,
  set: v => emit('update:date', v)
});

const serialModel = computed({
  get: () => props.serial,
  set: v => emit('update:serial', v)
});

const salerIdModel = computed({
  get: () => props.salerId,
  set: v => emit('update:salerId', v as number | null)
});

const siteStatusModel = computed({
  get: () => props.siteStatus,
  set: v => emit('update:siteStatus', v as number | null)
});

const bindTypeModel = computed({
  get: () => props.bindType,
  set: v => emit('update:bindType', v as string | null)
});
</script>

<style scoped>
</style>
