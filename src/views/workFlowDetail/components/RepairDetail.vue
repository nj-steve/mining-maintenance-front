<template>
    <n-config-provider :theme-overrides="selectThemeOverrides">
    <div class="p-4 space-y-6 text-sm">
      <n-card :title="$t('page.workflowDetail.basicInfo')">
        <n-space vertical>
          <n-descriptions :column="2" label-placement="left" bordered size="small" class="text-sm">
            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.date') }}</span></template>
              <n-date-picker size="small" class="text-sm" v-model:formatted-value="form.date" type="date" value-format="yyyy-MM-dd" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.orderNo') }}</span></template>
              <n-input size="small" class="text-sm" disabled v-model:value="form.work_order_no" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.model') }}</span></template>
              <n-input size="small" class="text-sm" disabled v-model:value="form.machine_model" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairStation') }}</span></template>
              <n-select size="small" class="text-sm" disabled v-model:value="form.repairStation" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.macAddress') }}</span></template>
              <n-input size="small" class="text-sm" v-model:value="form.mac_address" />
            </n-descriptions-item>
          </n-descriptions>
        </n-space>
      </n-card>

      <!-- 设备信息 -->
      <n-card :title="$t('page.workflowDetail.deviceInfo')">
        <n-descriptions :column="1" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.machineSN') }}</span></template>
            <n-input size="small" class="text-sm" disabled v-model:value="form.device_sn" />
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.controlBoardSN') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.control_sn" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.powerSN') }}</span></template>
            <div>
               <n-input size="small" class="text-sm" v-model:value="form.power_sn" :placeholder="$t('page.workflowDetail.inputPowerSN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.board1SN') }}</span></template>
            <div>
               <n-input size="small" class="text-sm" v-model:value="form.board_sn_1" :placeholder="$t('page.workflowDetail.inputBoard1SN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.board2SN') }}</span></template>
            <div>
               <n-input size="small" class="text-sm" v-model:value="form.board_sn_2" :placeholder="$t('page.workflowDetail.inputBoard2SN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.board3SN') }}</span></template>
            <div>
               <n-input size="small" class="text-sm" v-model:value="form.board_sn_3" :placeholder="$t('page.workflowDetail.inputBoard3SN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 维修详情 -->
      <n-card :title="$t('page.workflowDetail.repairDetail')">
        <n-descriptions :column="1" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairComponent') }}</span></template>
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <n-checkbox-group v-model:value="selectedComponents">
                <n-space>
                  <n-checkbox
                    v-for="opt in computedComponentOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </n-space>
              </n-checkbox-group>
              <n-input
                v-if="selectedComponents.includes('其他')"
                v-model:value="otherComponent" size="small" class="text-sm"
                :placeholder="$t('page.workflowDetail.inputOtherItem')"
                style="max-width: 200px;"
              />
            </div>
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.extraOperations') }}</span></template>
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <n-checkbox-group v-model:value="selectedExtraOperations">
                <n-space>
                  <n-checkbox
                    v-for="opt in computedExtraOperationOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </n-space>
              </n-checkbox-group>
            </div>
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.defectReason') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.defect_reason" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.defectCode2') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.defect_code_2" :placeholder="$t('page.workflowDetail.inputDefectCode2')" />
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.defectCode3') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.defect_code_3" :placeholder="$t('page.workflowDetail.inputDefectCode3')" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.positionInfo') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.position" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.verifyDefect') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.verify_defect" />
          </n-descriptions-item>


          <n-descriptions-item class="text-sm">
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairPartImage') }}</span></template>
            <div class="text-sm text-gray-600">
              <QiniuImageUpload
                v-model:images="form.images"
                :max="10"
                :button-text="$t('page.workflowDetail.uploadImage')"
                @uploaded="(url: string) => form.images.push(url)"
                @removed="(url: string) => form.images = form.images.filter(u => u !== url)"
              />
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
      <n-modal v-model:show="previewVisible" preset="card" :title="$t('page.workflowDetail.imagePreview')" style="width: 800px;">
        <div style="display:flex; justify-content:center; align-items:center;">
          <img :src="previewSrc" :alt="$t('page.workflowDetail.preview')" style="max-width:100%; max-height:70vh; object-fit:contain;" />
        </div>
      </n-modal>

      <!-- 维修进程 -->
      <n-card :title="$t('page.workflowDetail.repairProcess')">
        <n-descriptions :column="2" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.startTime') }}</span></template>
            <n-date-picker size="small" class="text-sm" v-model:formatted-value="form.start_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.endTime') }}</span></template>
            <n-date-picker size="small" class="text-sm" v-model:formatted-value="form.end_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairStatus') }}</span></template>
            <n-select size="small" class="text-sm" v-model:value="form.repair_result" :options="computedRepairResultOptions" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ $t('page.workflowDetail.repairer') }}</span></template>
            <n-input size="small" class="text-sm" v-model:value="form.repairer_name" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4 mt-4">
        <n-button type="primary" @click="save">{{ $t('page.workflowDetail.save') }}</n-button>
      </div>
    </div>
    </n-config-provider>
  </template>

  <script setup lang="ts">
  import { ref, onMounted, watch, computed } from "vue"
  import { useI18n } from 'vue-i18n';
  import { useRoute } from "vue-router"
  import dayjs from 'dayjs';
  import { useMessage } from 'naive-ui';
  import { NCard, NDescriptions, NDescriptionsItem, NInput, NButton, NDatePicker, NSelect, NDynamicInput, NSpace, NCheckbox, NCheckboxGroup, NModal, NConfigProvider } from "naive-ui"
  import type { GlobalThemeOverrides } from 'naive-ui'
  import { fetchRepairDetailsByFaults, createRepairDetails,updateRepairDetails } from '@/service/api/repair'
  import QiniuImageUpload from '@/components/upload/QiniuImageUpload.vue'
  import { useAuthStore } from '@/store/modules/auth';

  const { t } = useI18n();
  const authStore = useAuthStore();
  const hasRole=!authStore.userInfo.roles.includes('3')
  const isAdmin=authStore.userInfo.roles.includes('1') // 超管
  const isRead=authStore.userInfo.roles.includes('5') // 只读用户


  const props = defineProps<{
    repairData?: any
    detailData?: any
  }>()

  const emit = defineEmits(['success', 'close'])

  const route = useRoute();
  const message = useMessage()
  // const id = route.params.id; // 用它去请求详情数据
  const id = ref((props.repairData?.id || route.params.id) as string);

  watch(() => props.repairData?.id, (newId) => {
    if (newId) {
      id.value = String(newId)
      fetchDetailData()
    }
  })
  const loading = ref(false);
  const imgAuthString = ref("")

  const previewVisible = ref(false)
  const previewSrc = ref('')
  const selectThemeOverrides: GlobalThemeOverrides = {
    Select: {
      fontSizeSmall: '12px',
      optionFontSizeSmall: '12px'
    }
  }

  const form = ref({
    date: dayjs().format('YYYY-MM-DD'),
    work_order_no: props.detailData?.order_no || "",
    machine_model: props.repairData?.model || "",
    repairStation: props.detailData?.station_name,
    repair_result: props.repairData?.repair_result || 0,
    device_sn: props.repairData?.sn,
    defect_code_2: "",
    defect_code_3: "",
    // boardSN: ["BRD120240118001234556", "BRD220240118001234556", "BRD320240118001234556"],
    repair_component: "",
    defect_reason: "",
    defect_code: "",
    control_sn: "",
    board_sn_1: "",
    board_sn_2: "",
    board_sn_3: "",
    position: "",
    verify_defect: "",
    images: [] as string[],
    repair_image_urls: "",
    start_time: dayjs().format('YYYY-MM-DD HH:mm'),
    end_time: dayjs().format('YYYY-MM-DD HH:mm'),
    // repair_result: 0,
    repairer_name: "",
    power_sn: "",
    motherboard_sn: "",
    mac_address:  "",
    extra_operations: "",
    fault_id: props.repairData?.fault_id || 0,
    repair_station_id: props.detailData?.station_id || 0,
  })

  // 维修部件选项与编辑态状态
  const componentOptions = ['板1', '板2', '板3', '电源', '控制板', '其他']
  const computedComponentOptions = computed(() => [
    { label: t('page.workflowDetail.componentOptions.board1'), value: '板1' },
    { label: t('page.workflowDetail.componentOptions.board2'), value: '板2' },
    { label: t('page.workflowDetail.componentOptions.board3'), value: '板3' },
    { label: t('page.workflowDetail.componentOptions.power'), value: '电源' },
    { label: t('page.workflowDetail.componentOptions.controlBoard'), value: '控制板' },
    { label: t('page.workflowDetail.componentOptions.other'), value: '其他' },
  ])
  const selectedComponents = ref<string[]>([])
  const otherComponent = ref('')

  const componentExtraOperations = ['涂硅脂', '涂三防漆', '换升压模块', '清灰', '贴铝片']
  const computedExtraOperationOptions = computed(() => [
    { label: t('page.workflowDetail.extraOperationOptions.thermalGrease'), value: '涂硅脂' },
    { label: t('page.workflowDetail.extraOperationOptions.conformalCoating'), value: '涂三防漆' },
    { label: t('page.workflowDetail.extraOperationOptions.boostModule'), value: '换升压模块' },
    { label: t('page.workflowDetail.extraOperationOptions.dustCleaning'), value: '清灰' },
    { label: t('page.workflowDetail.extraOperationOptions.aluminumFoil'), value: '贴铝片' },
  ])
  const selectedExtraOperations = ref<string[]>([])

  const computedRepairResultOptions = computed(() => [
    { label: t('business.repairResult.pending'), value: 1 },
    { label: t('business.repairResult.unrepaired'), value: 2 },
    { label: t('business.repairResult.repaired'), value: 3 },
    { label: t('business.repairResult.scrapped'), value: 4 },
  ])

  function save() {
    // console.log("保存数据", form.value)
    // 合成维修部件字符串
    const finalComponents = selectedComponents.value.filter(s => s !== '其他')
    if (selectedComponents.value.includes('其他') && otherComponent.value.trim()) {
      finalComponents.push(otherComponent.value.trim())
    }
    // 合成额外操作字符串
    form.value.extra_operations = selectedExtraOperations.value.join(',')

    form.value.repair_component = finalComponents.join(',')
    form.value.date = dayjs(form.value.date).format('YYYY-MM-DD')
    form.value.start_time = String(form.value.start_time)
    form.value.end_time = String(form.value.end_time)
    form.value.work_order_no=props.detailData?.order_no || ""
    form.value.repairStation=props.detailData?.station_id || ""
    form.value.device_sn=props.repairData?.sn || ""
    // form.value.mac_address=props.repairData?.mac_address || ""
    form.value.repair_station_id=props.detailData?.station_id || 0



    // form.value.fault_id=repairResultMap[form.value.repair_result] || 0

    // console.log("form.value.images", form.value.images)
    // return false
    form.value.repair_image_urls = form.value.images.join(',')
    createRepairDetails(form.value).then(() => {
      message.success(t('page.workflowDetail.addSuccess'))
      emit('success')
    })
  }

  // 获取详情数据
  const fetchDetailData = async () => {
    if (!id) return;

    loading.value = true;
    try {
      const { data, error } = await fetchRepairDetailsByFaults(Number(props.repairData?.fault_id),{});
      // console.log("data",data)
      if (error === null && data !== null) {
        const detail = data; // 假设返回的是数组，取第一个
        form.value = {
          date: detail.Date ? dayjs(detail.Date).format('YYYY-MM-DD') : dayjs(detail.CreatedAt).format('YYYY-MM-DD HH:mm'),
          work_order_no: detail.WorkOrderNo || '',
          machine_model: detail.MachineModel || '',
          repairStation: detail.RepairStationName || '',
          device_sn: detail.DeviceSN || '',
          defect_code_2: detail.DefectCode2 || '',
          defect_code_3: detail.DefectCode3 || '',
          // boardSN: detail.BoardSN ? detail.BoardSN.split(',') : [],
          repair_component: detail.RepairComponent || '',
          defect_reason: detail.DefectReason || '',
          defect_code: detail.DefectCode || '',
          control_sn: detail.ControlSN || '',
          board_sn_1: detail.BoardSN1 || '',
          board_sn_2: detail.BoardSN2 || '',
          board_sn_3: detail.BoardSN3 || '',
          position: detail.Position || '',
          verify_defect: detail.VerifyDefect || '',
          images:detail.RepairImageUrls ? detail.RepairImageUrls.split(',') : [],
          repair_image_urls: detail.RepairImageUrls || '',
          start_time: detail.StartTime ? dayjs(detail.StartTime).format('YYYY-MM-DD HH:mm') : dayjs(detail.CreatedAt).format('YYYY-MM-DD HH:mm'),
          end_time: detail.EndTime ? dayjs(detail.EndTime).format('YYYY-MM-DD HH:mm') : dayjs(detail.CreatedAt).format('YYYY-MM-DD HH:mm'),
          repair_result: detail.RepairResult ?? 1,
          repairer_name: detail.RepairerName || '',
          power_sn: detail.PowerSN || '',
          mac_address: detail.MacAddress || '',
          motherboard_sn: detail.BoardSN || '',
          fault_id: detail.FaultID || 0,
          extra_operations: detail.extra_operations || '',
          repair_station_id: detail.RepairStationID || 0,
        };
        // 初始化组件选择
        const parts = (form.value.repair_component || '').split(',').map(s => s.trim()).filter(Boolean)
        const known = parts.filter(p => componentOptions.includes(p))
        const unknown = parts.filter(p => !componentOptions.includes(p))
        selectedComponents.value = known
        if (unknown.length > 0) {
          if (!selectedComponents.value.includes('其他')) selectedComponents.value.push('其他')
          otherComponent.value = unknown.join(',')
        } else {
          otherComponent.value = ''
        }
        // 初始化额外操作选择
        form.value.extra_operations.split(',').forEach(opt => {
          if (componentExtraOperations.includes(opt)) {
            selectedExtraOperations.value.push(opt)
          }
        })

      }
      else{

      }
    } catch (error) {
      console.error(t('page.workflowDetail.getDetailFailed'), error);
    } finally {
      loading.value = false;
    }
  };


  onMounted(() => {
    fetchDetailData();
  });

  //   const openPreview = (url: string) => {
  //   if (!url) return
  //   previewSrc.value = url
  //   previewVisible.value = true
  // }
  </script>

  <style scoped>
 .n-descriptions.n-descriptions--left-label-align th {
    font-weight: bold;
    width: 140px !important;
  }
  </style>
