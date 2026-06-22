<template>
    <div class="p-4 space-y-6">
      <!-- 基础信息 -->
      <n-card :title="$t('page.workflowDetail.basicInfo')">
        <n-descriptions :column="2" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.orderNo') }}</span></template>
            <span class="text-sm text-gray-600">{{ detailData?.order_no || '-' }}</span>
          </n-descriptions-item>
          <n-descriptions-item>
          <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.orderStatus') }}</span></template>
          <n-tag :type="tagMap[getTranslatedStatus(detailData?.status, detailData?.status_text)] || 'default'" size="small">
            {{ getTranslatedStatus(detailData?.status, detailData?.status_text) || '-' }}
          </n-tag>
        </n-descriptions-item>
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.site') }}</span></template>
            <span class="text-sm text-gray-600">{{ detailData?.site_name || '-' }}</span>
          </n-descriptions-item>
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairStation') }}</span></template>
            <span class="text-sm text-gray-600">{{ detailData?.station_name || '-' }}</span>
          </n-descriptions-item>
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairMethod') }}</span></template>
            <span class="text-sm text-gray-600">{{ repairMethodRecord[detailData?.repair_method as number] || '-' }}</span>
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
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.faultCount') }}</span></template>
            <span class="text-sm text-gray-600">{{ detailData?.fault_count ?? '-' }}</span>
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
          <n-text strong style="font-size: 16px;">{{ $t('page.workflowDetail.faultDeviceList') }}</n-text>
        </template>
      <!-- 故障设备列表 -->
      <n-card title="">
        <n-space justify="space-between" class="mb-2">
            <NConfigProvider :theme-overrides="selectThemeOverrides">
            <NSpace>
              <NInput
                v-model:value="sn"
                size="small"
                class="text-sm"
                :placeholder="$t('page.workflowDetail.inputSN')"
                clearable
                style="width: 180px"
              />
              <NSelect
                size="small"
                class="text-sm"
                v-model:value="status"
                :options="statusOptions"
                :placeholder="$t('page.workflowDetail.flowStatus')"
                clearable
                style="margin-left: 0px; width: 150px"
              />
              <NSelect
                size="small"
                class="text-sm"
                v-model:value="resultStatus"
                :options="computedRepairResultOptions"
                :placeholder="$t('page.workflowDetail.repairStatus')"
                clearable
                style="margin-left: 0px; width: 150px"
              />
            </NSpace>
            </NConfigProvider>
            <NButton  circle size="small" class="text-sm" ghost @click="exportFaultDevicesCsv" :title="$t('page.workflowDetail.exportCSV')"  style="margin-right: 50px;">
          <template #icon>
            <icon-ant-design-download-outlined />
          </template>
            </NButton>
        </n-space>
        <n-data-table :columns="faultDeviceColumns" :data="filteredFaultDevices" :bordered="true" :pagination="faultDevicesPagination" size="small" />
      </n-card>
        </n-tab-pane>
        <n-tab-pane name="logs">
        <template #tab>
          <n-text strong style="font-size: 16px;">{{ $t('page.workflowDetail.operationLog') }}</n-text>
        </template>
        <n-card title="">
          <n-space justify="end" class="mb-2">
            <NButton circle size="medium" ghost @click="exportOperationHistoryCsv" :title="$t('page.workflowDetail.exportCSV')">
              <template #icon>
                <icon-ant-design-download-outlined />
              </template>
            </NButton>
          </n-space>
          <n-data-table :columns="operationHistoryColumns" :data="operationHistory" :bordered="true" :pagination="operationHistoryPagination" size="small" />
        </n-card>
      </n-tab-pane>
    </n-tabs>

    <!-- 设备信息（隐藏） -->
    <n-card v-if="false" :title="$t('page.workflowDetail.deviceInfo')">
      <!-- 原内容保留但隐藏 -->
      <n-descriptions :column="1" label-placement="left" bordered>
        <n-descriptions-item :label="$t('page.workflowDetail.machineSN')">
          <template v-if="!isEdit">{{ form.device_sn }}</template>
          <n-input v-else v-model:value="form.device_sn" />
        </n-descriptions-item>
        <n-descriptions-item :label="$t('page.workflowDetail.controlBoardSN')">
          <template v-if="!isEdit">{{ form.control_sn }}</template>
          <n-input v-else v-model:value="form.control_sn" />
        </n-descriptions-item>
        <n-descriptions-item :label="$t('page.workflowDetail.powerSN')">
          <template v-if="!isEdit">
            <div v-for="pwr in form.powerSN" :key="pwr">{{ pwr }}</div>
          </template>
          <div v-else>
            <n-input v-model:value="form.powerSN" :placeholder="$t('page.workflowDetail.inputPowerSN')" style="width: 100%; margin-bottom: 10px;" />
          </div>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 维修详情（隐藏） -->
    <n-card v-if="false" :title="$t('page.workflowDetail.repairDetail')">
      <n-descriptions :column="1" label-placement="left" bordered>
        <n-descriptions-item :label="$t('page.workflowDetail.repairComponent')">
          <template v-if="!isEdit">{{ form.repair_component }}</template>
          <n-input v-else v-model:value="form.repair_component" />
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 维修进程（隐藏） -->
    <n-card v-if="false" :title="$t('page.workflowDetail.repairProcess')">
      <n-descriptions :column="2" label-placement="left" bordered>
        <n-descriptions-item :label="$t('page.workflowDetail.startTime')">
          <template v-if="!isEdit">{{ form.start_time ? dayjs(form.start_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</template>
          <n-date-picker v-else v-model:formatted-value="form.start_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
        </n-descriptions-item>
        <n-descriptions-item :label="$t('page.workflowDetail.endTime')">
          <template v-if="!isEdit">{{ form.end_time ? dayjs(form.end_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</template>
          <n-date-picker v-else v-model:formatted-value="form.end_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
    <!-- 维修详情弹窗 -->
    <n-drawer v-model:show="showRepairModal" :width="602" placement="right">
      <n-drawer-content :title="$t('page.workflowDetail.repairDetail')">
        <RepairDetail :detail-data="detailData" :repair-data="currentRepair"  @success="handleRepairSuccess" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs';
import { useMessage } from 'naive-ui';
import { NTag } from 'naive-ui';
import { NCard, NDescriptions, NDescriptionsItem, NInput, NButton, NDatePicker, NSelect, NDynamicInput, NUpload, NSpace, NDataTable, NTabs, NTabPane, NConfigProvider, NModal } from "naive-ui"
import type { GlobalThemeOverrides } from 'naive-ui'
import RepairDetail from './components/RepairDetail.vue'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
// import { fetchRepairDetailsByID, updateRepairDetails } from '@/service/api/repair'
import { fetchOrdersDetail, fetchOrdersStatus } from '@/service/api/workflow'
import {  repairMethodRecord } from '@/constants/business'
const route = useRoute();
const message = useMessage()
const { t } = useI18n();
const id = ref(route.params.id as string);
  const loading = ref(false);

  // 详情数据与表格数据
  const detailData = ref<any | null>(null);
  const faultDevices = ref<any[]>([]);
  const operationHistory = ref<any[]>([]);
  const sn = ref('');
  const status = ref<number | null>(null);
  const resultStatus = ref<number | null>(null);
  const rawStatusOptions = ref<{ name: string; id: number }[]>([]);

  const getTranslatedFaultStatus = (name: string | undefined) => {
    if (!name) return '';
    const map: Record<string, string> = {
      '11': t('page.faults.removedSite'),
   '8': t('page.faults.onShelf'),
    '已上架': t('page.faults.onShelf'),
    '10': t('page.faults.inStock'),
    '已入库': t('page.faults.inStock'),
    '9': t('page.faults.waitStock'),
    '待入库': t('page.faults.waitStock'),
    '3': t('page.faults.logisticsOut'),
    '物流发': t('page.faults.logisticsOut'),
    '6': t('page.faults.logisticsIn'),
    '物流进': t('page.faults.logisticsIn'),
    '物流收': t('page.faults.logisticsIn'),
    '4': t('page.faults.repairing'),
    '维修中': t('page.faults.repairing'),
    '5': t('page.faults.repairCompleted'),
    '维修完成': t('page.faults.repairCompleted'),
    '7': t('page.faults.waitShelf'),
    '待上架': t('page.faults.waitShelf'),
    '2': t('page.faults.pending'),
    '待处理': t('page.faults.pending'),
    '1': t('page.faults.newOffShelf'),
    '新下架': t('page.faults.newOffShelf'),

    // Repair Status
    '已修复': t('page.faults.repaired'),
    '报废': t('page.faults.scrapped'),
    '未修好': t('page.faults.unrepaired'),
    '待修复': t('business.repairResult.pending'),
    '待维修': t('page.faults.waitRepair'),

    // Warranty Status
    '短保中': t('business.warrantyStatus.inWarranty'),
    '过保': t('business.warrantyStatus.outOfWarranty'),
    '无': t('business.warrantyStatus.noWarranty'),
    '已过期': t('business.warrantyStatus.expired'),
    };
    return map[name] || name;
  };

  const statusOptions = computed(() => {
    return rawStatusOptions.value.map((item: any) => ({
      label: getTranslatedFaultStatus(item.id) || item.name,
      value: item.id,
    }));
  });

  const computedRepairResultOptions = computed(() => [
    { label: t('business.repairResult.pending'), value: 1 },
    { label: t('business.repairResult.unrepaired'), value: 2 },
    { label: t('business.repairResult.repaired'), value: 3 },
    { label: t('business.repairResult.scrapped'), value: 4 },
  ]);

  const getTranslatedStatus = (status: number | string | undefined, text: string | undefined) => {
    if (text) {
      const map: Record<string, string> = {
        '待处理': t('page.workflow.pending'),
        '处理中': t('page.workflow.processing'),
        '已完成': t('page.workflow.completed'),
        '未解决': t('page.workflow.unresolved'),
        '维修中': t('page.workflow.repairing')
      };
      return map[text] || text;
    }
    return t('page.workflow.unknown');
  }

  const tagMap = computed<Record<string, "primary" | "info" | "success" | "warning" | "error" | "default">>(() => ({
    [t('page.workflow.pending')]: 'warning',
    [t('page.workflow.processing')]: 'primary',
    [t('page.workflow.completed')]: 'success',
    [t('page.workflow.unresolved')]: 'error',
    [t('page.workflow.repairing')]: 'primary',
  }));

  const showRepairModal = ref(false)
  const currentRepair = ref<any>({})

  const handleRepairSuccess = () => {
    showRepairModal.value = false
    fetchDetailData()
  }

  // 让 Select 的小号字号统一为 text-sm（约 12px）
  const selectThemeOverrides: GlobalThemeOverrides = {
    Select: {
      fontSizeSmall: '12px',
      optionFontSizeSmall: '12px'
    }
  }

  // 列定义：故障设备
  const faultDeviceColumns = computed<DataTableColumns<any>>(() => [
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.sequence')), key: 'sequence', width: 80, render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.sequence ?? '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.deviceSN')), key: 'sn', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.sn ?? '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.model')), key: 'model', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.model ?? '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.site')), key: 'site_name', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.site_name ?? '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.flowStatus')), key: 'current_status_text', width: 100,
    render: (row: any) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
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
      };
      const label = getTranslatedFaultStatus(row.current_status_text) || t('page.workflowDetail.unknown');
      return h(NTag, { type: tagMap[row.current_status_text || ''] || 'default', size: 'small', class: 'text-sm' }, () => label)
    }
  },
   { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.repairStatus')), key: 'status_text', width: 100,
    render: (row: any) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '报废': 'error',
        '未修复': 'default',
        '待修复': 'warning',
      };
      const label = getTranslatedFaultStatus(row.repair_result_text) || t('page.workflowDetail.unknown');
      return h(NTag, { type: tagMap[row.repair_result_text || ''] || 'default', size: 'small', class: 'text-sm' }, () => label)
    }
  },
    {
      title: t('page.workflowDetail.canOperate'),
      key: 'can_operate',
      render: (row: any) => {
          return h(
            NButton,
            {
              size: 'tiny',
              type: 'primary',
              ghost: true,
              onClick: () => {
                currentRepair.value = row
                showRepairModal.value = true
              }
            },
            { default: () => t('page.workflowDetail.repairDetailBtn') }
          )
      }
    }
  ]);

  // 列定义：操作日志
  const operationHistoryColumns = computed<DataTableColumns<any>>(() => [
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.time')), key: 'occurred_at', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.occurred_at ? dayjs(row.occurred_at).format('YYYY-MM-DD HH:mm:ss') : '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.operation')), key: 'status_text', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, getTranslatedFaultStatus(row.status_text) || row.status_text || '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.operator')), key: 'operator_name', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.operator_name ?? '-') },
    { title: () => h('span', { class: 'text-sm text-gray-500' }, t('page.workflowDetail.description')), key: 'info', render: (row: any) => h('span', { class: 'text-sm text-gray-600' }, row.info ?? '-') }
  ]);

  const activeTab = ref<'basic' | 'logs'>('basic')
  const operationHistoryPagination = ref<PaginationProps>({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    prefix: (info) => t('page.workflowDetail.totalItems', { count: (info.itemCount ?? operationHistory.value.length) || 0 }),
    onChange: (page: number) => { operationHistoryPagination.value.page = page },
    onUpdatePageSize: (pageSize: number) => { operationHistoryPagination.value.pageSize = pageSize; operationHistoryPagination.value.page = 1 }
  })

  watch(operationHistory, (list) => {
    operationHistoryPagination.value.itemCount = list.length
    operationHistoryPagination.value.page = 1
  })

  const exportOperationHistoryCsv = async () => {
    try {
      const headers = [t('page.workflowDetail.time'), t('page.workflowDetail.operation'), t('page.workflowDetail.operator'), t('page.workflowDetail.description')]
      const toCell = (v: any) => {
        const s = v == null ? '' : String(v)
        const quoted = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return quoted ? `"${escaped}"` : escaped
      }
      const rows = operationHistory.value.map(item => [
        item.occurred_at ? dayjs(item.occurred_at).format('YYYY-MM-DD HH:mm:ss') : '',
        getTranslatedFaultStatus(item.status_text) || item.status_text,
        item.operator_name,
        item.info
      ])
      const csv = [headers, ...rows].map(row => row.map(toCell).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `${t('page.workflowDetail.operationLogExport')}${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success(t('page.workflowDetail.exportSuccess'))
    } catch (err) {
      console.error(t('page.workflowDetail.exportFailed') + ':', err)
      message.error(`${t('page.workflowDetail.exportFailed')}: ${err}`)
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
      console.error(t('page.workflowDetail.getDetailFailed') + ':', error);
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
          rawStatusOptions.value = data;
        }

      }else{
          message.error(`${t('page.workflowDetail.loadFailed')}${error}`);
      }
    } catch (err) {
      message.error(`${t('page.workflowDetail.loadFailed')}${err}`);
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
    prefix: () => t('page.workflowDetail.totalItems', { count: filteredFaultDevices.value.length || 0 }),
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
      const headers = [t('page.workflowDetail.sequence'), t('page.workflowDetail.site'), t('page.workflowDetail.model'), t('page.workflowDetail.deviceSN'), t('page.workflowDetail.flowStatus')]
      const toCell = (v: any) => {
        const s = v == null ? '' : String(v)
        const quoted = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return quoted ? `"${escaped}"` : escaped
      }
      const rows = filteredFaultDevices.value.map(item => [item.sequence, item.site_name, item.model, item.sn, getTranslatedFaultStatus(item.current_status_text) || item.current_status_text])
      const csv = [headers, ...rows].map(row => row.map(toCell).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `${t('page.workflowDetail.faultDeviceExport')}${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success(t('page.workflowDetail.exportSuccess'))
    } catch (err) {
      console.error(t('page.workflowDetail.exportFailed') + ':', err)
      message.error(`${t('page.workflowDetail.exportFailed')}: ${err}`)
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
        prefix: (info) => t('page.workflowDetail.totalItems', { count: (info.itemCount ?? total) || 0 })
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
