<script setup lang="ts">
import { onMounted, ref, computed,h, onUnmounted } from 'vue';
import { useMessage, NButton, NCard, NSpin, NIcon,NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchSitesHistory } from '@/service/api/site';

const route = useRoute();
const historyData = ref<any[]>([]);
const columns = [
  {
    title: '日期',
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
          '24H故障数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '近24小时导入故障机数',
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
          '物流中',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“物流进+物流出” 机器数',
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
          '在修数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“维修中” 的机器数',
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
    //       '在架待修数',
    //       h(
    //         NTooltip,
    //         { placement: 'top' },
    //         {
    //           default: () => '状态：“在架，等待下架” 故障机数',
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
          '待修数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“未下架+已下架+待处理” 故障机器数',
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
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          '待上架',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“待上架” 的机器数',
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
  },
   {
    title:  () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          '净故障数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '“待修数+寄修数+驻场”',
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
          '预报废数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '维修状态：“报废” 故障机数',
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
];
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
    console.error('加载场地历史数据失败', e);
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

