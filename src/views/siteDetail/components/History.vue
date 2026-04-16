<script setup lang="ts">
import { onMounted, ref, computed, h } from 'vue';
import { useMessage, NDataTable, NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { useRoute } from 'vue-router';
import { fetchSitesHistory } from '@/service/api/site';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();
const historyData = ref<any[]>([]);

const columns = computed(() => [
  {
    title: t('page.siteDetail.date'),
    key: 'date',
    width: 180,
    render: (row: any) => {
      const d = row.date ?? '';
      if (typeof d === 'string') return d.split('T')[0];
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const da = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      }
      return '';
    }
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:100px;' },
        [
          t('page.siteDetail.faultCount'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.fault24hCountTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'fault_count',
    width: 120,
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          t('page.miningSite.inLogistics'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.inLogisticsTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'in_logistics_count',
    width: 120,
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          t('page.miningSite.repairingCount'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.repairingCountTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'repairing',
    width: 120,
  },
    // { title: () =>
    //   h(
    //     'div',
    //     { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
    //     [
    //       t('page.faults.onShelfWaitRepairCount'),
    //       h(
    //         NTooltip,
    //         { placement: 'top' },
    //         {
    //           default: () => t('page.faults.onShelfWaitRepairCountTooltip'),
    //           trigger: () =>
    //             h(Icon, {
    //               icon: 'ant-design:question-circle-outlined',
    //               width: 14,
    //               height: 14,
    //               color: '#999',
    //               style: 'cursor:pointer;'
    //             })
    //         }
    //       )
    //     ]
    //   ), key: 'on_shelf_wait_repair_count'},
  {
    title:() =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:180px;' },
        [
          t('page.miningSite.waitRepairCount'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.waitRepairCountTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'wait_repair_count',
    width: 120,
    // render: (row: any) => h('span', (row.wait_repair_count+row.on_shelf_wait_repair_count)?.toLocaleString?.() || '0') },
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:150px;' },
        [
          t('page.miningSite.pendingShelf'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.pendingShelfTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'wait_on_shelf_count',
    width: 150,
  },
   {
    title:  () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          t('page.miningSite.netFaultCount'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.netFaultCountTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'wait_on_shelf_count',
    width: 120,
    render: (row: any) => row.in_logistics_count + row.repairing + row.wait_repair_count+ row.wait_on_shelf_count,
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          t('page.miningSite.scrappedCount'),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.scrappedCountTooltip'),
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'scrapped_count',
    width: 120,
  },
]);
const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

onMounted(async () => {
  try {
    const { data, error } = await fetchSitesHistory(Number(route.params.id));
    console.log('historyData', data);
    historyData.value = [];
    if (!error && Array.isArray(data) && data.length > 0) {
      historyData.value = data;
      pagination.value.itemCount = data.length;
    }
  } catch (e) {
    console.error(t('page.siteDetail.loadHistoryFailed'), e);
  }
});
</script>

<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <NDataTable
      :data="historyData"
      :columns="columns"
      :pagination="pagination"
      @update:page="(p:number) => (pagination.page = p)"
      @update:pageSize="(ps:number) => (pagination.pageSize = ps)"
      :row-key="(row: any) => row.id"
    />
  </div>
</template>

