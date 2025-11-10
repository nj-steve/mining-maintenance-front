<template>
    <div class="p-4 space-y-6">
      <!-- 基础信息 -->
      <n-card title="基础信息">
        <n-descriptions :column="2" label-placement="left" bordered>
          <n-descriptions-item label="工单编号">
            {{ detailData?.order_no || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="工单状态">
            {{ detailData?.order_status_text || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="场地">
            {{ detailData?.site_name || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="维修站">
            {{ detailData?.station_name || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="维修方式">
            {{ repairMethodRecord[detailData?.repair_method as number] || '-' }}
          </n-descriptions-item>
          <!-- <n-descriptions-item label="维修费用">
            {{ detailData?.repair_cost ?? '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="物流费用">
            {{ detailData?.logistics_cost ?? '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="总费用">
            {{ detailData?.total_cost ?? '-' }}
          </n-descriptions-item> 
          <n-descriptions-item label="付款状态">
            {{ detailData?.settlement_status_text || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="付款日期">
            {{ detailData?.payment_date ? dayjs(detailData.payment_date).format('YYYY-MM-DD') : '-' }}
          </n-descriptions-item>-->
          <n-descriptions-item label="故障机数量">
            {{ detailData?.fault_count ?? '-' }}
          </n-descriptions-item>
          <!-- <n-descriptions-item label="短保内数量">
            {{ detailData?.in_warranty_count ?? '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="短保外数量">
            {{ detailData?.out_of_warranty_count ?? '-' }}
          </n-descriptions-item> 
          <n-descriptions-item label="创建时间">
            {{ detailData?.created_at ? dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ detailData?.updated_at ? dayjs(detailData.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </n-descriptions-item>-->
        </n-descriptions>
      </n-card>
        <!-- 操作日志 -->
      <n-tabs v-model:value="activeTab" type="line">
        <!-- -      <n-card title="基础信息"> -->
      <n-tab-pane name="basic">
        <template #tab>
          <n-text strong style="font-size: 16px;">故障设备列表</n-text>
        </template>
      <!-- 故障设备列表 -->
      <n-card title="">
      <n-space justify="space-between" class="mb-2">
            <NSpace>
              <NInput
                v-model:value="sn"
                size="medium"
                placeholder="请输入机器SN"
                clearable
                style="width: 180px"
              />
              <NSelect
                size="medium"
                v-model:value="status"
                :options="statusOptions"
                placeholder="流转状态"
                clearable
                style="margin-left: 0px; width: 120px"
              />
              <NSelect
                size="medium"
                v-model:value="resultStatus"
                :options="repairResultOptions"
                placeholder="维修状态"
                clearable
                style="margin-left: 0px; width: 120px"
              />
            </NSpace>
            <NButton  circle size="medium" ghost @click="exportFaultDevicesCsv" title="导出 CSV"  style="margin-right: 50px;">
          <template #icon>
            <icon-ant-design-download-outlined />
          </template>
            </NButton>
        </n-space>
        <n-data-table :columns="faultDeviceColumns" :data="filteredFaultDevices" :bordered="true" :pagination="faultDevicesPagination" />
      </n-card>
      </n-tab-pane>
        <n-tab-pane name="logs">
          <template #tab>
            <n-text strong style="font-size: 16px;">操作日志</n-text>
          </template>
          <n-card title="">
            <n-space justify="end" class="mb-2"> 
              <NButton circle size="medium" ghost @click="exportOperationHistoryCsv" title="导出 CSV">
                <template #icon>
                  <icon-ant-design-download-outlined />
                </template>
              </NButton>
            </n-space>
            <n-data-table :columns="operationHistoryColumns" :data="operationHistory" :bordered="true" :pagination="operationHistoryPagination" />
          </n-card>
        </n-tab-pane>
      </n-tabs>


      <!-- 设备信息（隐藏） -->
      <n-card v-if="false" title="设备信息">
        <!-- 原内容保留但隐藏 -->
        <n-descriptions :column="1" label-placement="left" bordered>
          <n-descriptions-item label="整机 SN">
            <template v-if="!isEdit">{{ form.device_sn }}</template>
            <n-input v-else v-model:value="form.device_sn" />
          </n-descriptions-item>
          <n-descriptions-item label="控制板 SN">
            <template v-if="!isEdit">{{ form.control_sn }}</template>
            <n-input v-else v-model:value="form.control_sn" />
          </n-descriptions-item>
          <n-descriptions-item label="电源 SN">
            <template v-if="!isEdit">
              <div v-for="pwr in form.powerSN" :key="pwr">{{ pwr }}</div>
            </template>
            <div v-else>
              <n-input v-model:value="form.powerSN" placeholder="请输入电源SN" style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 维修详情（隐藏） -->
      <n-card v-if="false" title="维修详情">
        <n-descriptions :column="1" label-placement="left" bordered>
          <n-descriptions-item label="维修部件">
            <template v-if="!isEdit">{{ form.repair_component }}</template>
            <n-input v-else v-model:value="form.repair_component" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 维修进程（隐藏） -->
      <n-card v-if="false" title="维修进程">
        <n-descriptions :column="2" label-placement="left" bordered>
          <n-descriptions-item label="开始时间">
            <template v-if="!isEdit">{{ form.start_time ? dayjs(form.start_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</template>
            <n-date-picker v-else v-model:formatted-value="form.start_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>
          <n-descriptions-item label="结束时间">
            <template v-if="!isEdit">{{ form.end_time ? dayjs(form.end_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</template>
            <n-date-picker v-else v-model:formatted-value="form.end_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed, watch, h } from "vue"
  import { useRoute } from "vue-router"
  import dayjs from 'dayjs';
  import { useMessage } from 'naive-ui';
  import { NTag } from 'naive-ui';
  import { NCard, NDescriptions, NDescriptionsItem, NInput, NButton, NDatePicker, NSelect, NDynamicInput, NUpload, NSpace, NDataTable, NTabs, NTabPane } from "naive-ui"
  import type { DataTableColumns, PaginationProps } from 'naive-ui'
  import { fetchRepairDetailsByID, updateRepairDetails } from '@/service/api/repair'
  import { fetchOrdersDetail, fetchOrdersStatus } from '@/service/api/workflow'
  import {  repairMethodRecord } from '@/constants/business'
  import { repairResultOptions } from '@/constants/business';
  const route = useRoute();
  const message = useMessage()
  const id = ref(route.params.id as string);
  const loading = ref(false);

  // 详情数据与表格数据
  const detailData = ref<any | null>(null);
  const faultDevices = ref<any[]>([]);
  const operationHistory = ref<any[]>([]);
  const sn = ref('');
  const status = ref<number | null>(null);
  const resultStatus = ref<number | null>(null);
  const statusOptions = ref<{ label: string; value: number }[]>([]);

  // 列定义：故障设备
  const faultDeviceColumns: DataTableColumns<any> = [
    { title: '序号', key: 'sequence', width: 80 },
    { title: '设备SN', key: 'sn' },
    { title: '机型', key: 'model' },
    { title: '场地', key: 'site_name' },
    { title: '流转状态', key: 'current_status_text', width: 100,
    render: (row: any) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        // '物流出': 'primary',
        // '物流进': 'primary',
        // '维修中': 'info',
        // '维修完成': 'success',
        // '待上架': 'warning',
        // '新下架':'warning',
        '已上架': 'success',
        '已入库': 'success',
        '待入库': 'warning',
        '物流出': 'primary',
        '物流进': 'primary',
        '维修中': 'info',
        '维修完成': 'success',
        '待上架': 'warning',
        '报废': 'error',
        '未修复': 'error',
        '待处理': 'warning',
        // '新下架':'warning',
      };
      const label = row.current_status_text || '未知';
      return h(NTag, {type: tagMap[row.current_status_text || '未知'] }, () => label)
    }
  },
   { title: '维修状态', key: 'status_text', width: 100,
    render: (row: any) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '报废': 'error',
        '未修复': 'default',
        '待修复': 'warning',
      };
      const label = row.repair_result_text || '未知';
      return h(NTag, {type: tagMap[row.repair_result_text || '未知'] }, () => label)
    }
  },
    // { title: '当前状态', key: 'current_status_text',
    //   render: (row: any) => repairResultMap[row.current_status_text] || '-'
    // },
    // { title: '可操作', key: 'can_operate', render: (row: any) => row.can_operate ? '是' : '否' }
  ];

  // 列定义：操作日志
  const operationHistoryColumns: DataTableColumns<any> = [
    { title: '时间', key: 'occurred_at', render: (row: any) => row.occurred_at ? dayjs(row.occurred_at).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { title: '操作', key: 'status_text' },
    { title: '操作人', key: 'operator_name' },
    { title: '说明', key: 'info' }
  ];

  const activeTab = ref<'basic' | 'logs'>('basic')
  const operationHistoryPagination = ref<PaginationProps>({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    prefix: (info) => `共 ${(info.itemCount ?? operationHistory.value.length) || 0} 条`,
    onChange: (page: number) => { operationHistoryPagination.value.page = page },
    onUpdatePageSize: (pageSize: number) => { operationHistoryPagination.value.pageSize = pageSize; operationHistoryPagination.value.page = 1 }
  })

  watch(operationHistory, (list) => {
    operationHistoryPagination.value.itemCount = list.length
    operationHistoryPagination.value.page = 1
  })

  const exportOperationHistoryCsv = async () => {
    try {
      const headers = ['时间', '操作', '操作人', '说明']
      const toCell = (v: any) => {
        const s = v == null ? '' : String(v)
        const quoted = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return quoted ? `"${escaped}"` : escaped
      }
      const rows = operationHistory.value.map(item => [
        item.occurred_at ? dayjs(item.occurred_at).format('YYYY-MM-DD HH:mm:ss') : '',
        item.status_text,
        item.operator_name,
        item.info
      ])
      const csv = [headers, ...rows].map(row => row.map(toCell).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `操作日志_导出_${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success('导出成功，下载已开始')
    } catch (err) {
      console.error('导出失败:', err)
      message.error(`导出失败: ${err}`)
    }
  }
  const isEdit = ref(false)
  
  const form = ref({
    date: dayjs().format('YYYY-MM-DD'),
    work_order_no: "",
    machine_model: "",
    repairStation: Number(route.params.repairStation),
    device_sn: "",
    powerSN: "",
    repair_component: "",
    defect_reason: "",
    defect_code: "",
    control_sn: "",
    board_sn_1: "",
    board_sn_2: "",
    board_sn_3: "",
    position: "",
    verify_defect: "",
    images: [
      ""
    ],
    start_time: dayjs().format('YYYY-MM-DD HH:mm'),
    end_time: dayjs().format('YYYY-MM-DD HH:mm'),
    repair_result: 0,
    repairer_name: "",
    power_sn: "",
    motherboard_sn: ""
  })
  

  // 获取详情数据
  const fetchDetailData = async () => {
    if (!id) return;
    loading.value = true;
    try {
      const { data, error } = await fetchOrdersDetail(Number(id.value));
      if (error === null && data !== null) {
        detailData.value = data;
        faultDevices.value = Array.isArray(data.fault_devices) ? data.fault_devices : [];
        operationHistory.value = Array.isArray(data.operation_history) ? data.operation_history : [];
      }
    } catch (error) {
      console.error('获取详情数据失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // ---------------- 数据获取 ----------------
const fetchOrderStatusData = async (operate_type:"list"|"update") => {
  loading.value = true;
  const params: any = {
   type:1,//故障机状态
   operate_type:operate_type,
  };

  try {
    const {data,error} = await fetchOrdersStatus(params);
    
    if(error==null && data){
      if(operate_type==='list'){
        statusOptions.value = data.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      }
      
    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
};

  onMounted(() => {
    fetchDetailData();
    fetchOrderStatusData('list');
  });
  
  const faultDevicesPagination = ref<PaginationProps>({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    prefix: () => `共 ${filteredFaultDevices.value.length || 0} 条`,
    onUpdatePage: (page: number) => { faultDevicesPagination.value.page = page },
    onUpdatePageSize: (pageSize: number) => { faultDevicesPagination.value.pageSize = pageSize; faultDevicesPagination.value.page = 1 }
  })

  // 过滤后的故障设备列表
  const filteredFaultDevices = computed(() => {
    const snKeyword = sn.value?.trim().toLowerCase();
    const statusVal = status.value;
    const resultVal = resultStatus.value;
    return faultDevices.value.filter((row: any) => {
      const snMatch = !snKeyword || String(row.sn ?? '').toLowerCase().includes(snKeyword);
      const currentStatus = Number(row.current_status ?? row.status ?? NaN);
      const statusMatch = statusVal == null || (Number.isFinite(currentStatus) && currentStatus === Number(statusVal));
      const repairResult = Number(row.repair_result ?? NaN);
      const resultMatch = resultVal == null || (Number.isFinite(repairResult) && repairResult === Number(resultVal));
      return snMatch && statusMatch && resultMatch;
    })
  })

  const pagedFaultDevices = computed(() => {
    const page = faultDevicesPagination.value.page ?? 1
    const pageSize = faultDevicesPagination.value.pageSize ?? 20
    const start = (page - 1) * pageSize
    return filteredFaultDevices.value.slice(start, start + pageSize)
  })

  watch(filteredFaultDevices, (list) => {
    faultDevicesPagination.value.itemCount = list.length
    faultDevicesPagination.value.page = 1
  }, { immediate: true })

  const exportFaultDevicesCsv = async () => {
    try {
      const headers = ['序号', '场地', '机型', '设备SN', '状态']
      const toCell = (v: any) => {
        const s = v == null ? '' : String(v)
        const quoted = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return quoted ? `"${escaped}"` : escaped
      }
      const rows = filteredFaultDevices.value.map(item => [item.sequence, item.site_name, item.model, item.sn, item.status_text])
      const csv = [headers, ...rows].map(row => row.map(toCell).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `故障设备_导出_${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success('导出成功，下载已开始')
    } catch (err) {
      console.error('导出失败:', err)
      message.error(`导出失败: ${err}`)
    }
  }
  const faultDevicesPaginationShow = ref<false | PaginationProps>(false)

  const updateFaultPaginationShow = () => {
    const total = faultDevices.value.length
    const base = faultDevicesPagination.value
    const pageSize = base.pageSize ?? 20
    if (total > pageSize) {
      faultDevicesPaginationShow.value = {
        ...base,
        itemCount: total,
        showSizePicker: total > pageSize,
        prefix: (info) => `共 ${(info.itemCount ?? total) || 0} 条`
      }
    } else {
      faultDevicesPaginationShow.value = false
    }
  }

  watch(
    [faultDevices, () => faultDevicesPagination.value.pageSize],
    () => updateFaultPaginationShow(),
    { immediate: true }
  )
  </script>