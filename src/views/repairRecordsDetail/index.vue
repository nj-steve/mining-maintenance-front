<template>
    <n-config-provider :theme-overrides="selectThemeOverrides">
    <div class="p-4 space-y-6 text-sm">
      <!-- 基础信息 -->
       <div class="flex justify-end gap-4 mt-4" v-if="!isRead">
        <n-button v-if="!isEdit" size="small" class="text-sm" type="primary" @click="isEdit = true">{{ t("page.repairRecordsDetail.edit") }}</n-button>
        <n-button v-if="isEdit" size="small" class="text-sm" type="primary" @click="save">{{ t("page.repairRecordsDetail.save") }}</n-button>
        <n-button v-if="isEdit" size="small" class="text-sm" @click="cancel">{{ t("page.repairRecordsDetail.cancel") }}</n-button>
      </div>
      <n-card :title="t('page.repairRecordsDetail.baseInfo')">
        <n-space vertical>
          <n-descriptions :column="2" label-placement="left" bordered size="small" class="text-sm">
            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.date") }}</span></template>
              <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ dayjs(form.date).format('YYYY-MM-DD HH:mm:ss') }}</span></template>
              <n-date-picker v-else size="small" class="text-sm" v-model:formatted-value="form.date" type="date" value-format="yyyy-MM-dd" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.workOrderNo") }}</span></template>
              <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.work_order_no }}</span></template>
              <n-input v-else size="small" class="text-sm" v-model:value="form.work_order_no" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.repairType") }}</span></template>
              <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.repair_type === '整机' ? t('page.repairRecordsDetail.repairTypeWhole') : form.repair_type === '算力板' ? t('page.repairRecordsDetail.repairTypeBoard') : form.repair_type }}</span></template>
              <n-select v-else size="small" class="text-sm" v-model:value="form.repair_type" :options="repairTypeOptions" />
            </n-descriptions-item>

            <n-descriptions-item>
              <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.repairStation") }}</span></template>
              <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.repairStation }}</span></template>
              <n-select v-else size="small" class="text-sm" v-model:value="form.repairStation" />
            </n-descriptions-item>
          </n-descriptions>
        </n-space>
      </n-card>

      <!-- 设备信息 -->
      <n-card :title="t('page.repairRecordsDetail.deviceInfo')" v-if="form.repair_type == '整机'">
        <n-descriptions :column="1" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.wholeMachineSN") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.device_sn }}</span></template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.device_sn" />
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.controlBoardSN") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.control_sn }}</span></template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.control_sn" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.powerSN") }}</span></template>
            <template v-if="!isEdit">
              <span class="text-sm text-gray-600">{{ form.power_sn }}</span>
              <!-- <div v-for="pwr in form.powerSN" :key="pwr">{{ pwr }}</div> -->
            </template>
            <div v-else>
              <!-- <n-dynamic-input v-model:value="form.powerSN" placeholder="请输入电源 SN" /> -->
               <n-input size="small" class="text-sm" v-model:value="form.power_sn" :placeholder="t('page.repairRecordsDetail.pleaseEnterPowerSN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.board1SN") }}</span></template>
            <template v-if="!isEdit">
              <span class="text-sm text-gray-600">{{ form.board_sn_1 }}</span>
            </template>
            <div v-else>
               <n-input size="small" class="text-sm" v-model:value="form.board_sn_1" :placeholder="t('page.repairRecordsDetail.pleaseEnterBoard1SN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.board2SN") }}</span></template>
            <template v-if="!isEdit">
              <span class="text-sm text-gray-600">{{ form.board_sn_2 }}</span>
            </template>
            <div v-else>
               <n-input size="small" class="text-sm" v-model:value="form.board_sn_2" :placeholder="t('page.repairRecordsDetail.pleaseEnterBoard2SN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.board3SN") }}</span></template>
            <template v-if="!isEdit">
              <span class="text-sm text-gray-600">{{ form.board_sn_3 }}</span>
            </template>
            <div v-else>
               <n-input size="small" class="text-sm" v-model:value="form.board_sn_3" :placeholder="t('page.repairRecordsDetail.pleaseEnterBoard3SN')"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 维修详情 -->
      <n-card :title="t('page.repairRecordsDetail.repairDetail')">
        <n-descriptions :column="1" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.repairComponent") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ getTranslatedComponentString(form.repair_component) }}</span></template>
            <div v-else style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <n-checkbox-group v-model:value="selectedComponents">
                <n-space>
                  <n-checkbox
                    v-for="opt in componentOptions"
                    :key="opt"
                    :label="getTranslatedComponentLabel(opt)"
                    :value="opt"
                  />
                </n-space>
              </n-checkbox-group>
              <n-input
                v-if="selectedComponents.includes('其他')"
                v-model:value="otherComponent" size="small" class="text-sm"
                :placeholder="t('page.repairRecordsDetail.pleaseEnterOther')"
                style="max-width: 200px;"
              />
            </div>
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.extraOperations") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ getTranslatedExtraOperationString(form.extra_operations) }}</span></template>
            <div v-else style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <n-checkbox-group v-model:value="selectedExtraOperations">
                <n-space>
                  <n-checkbox
                    v-for="opt in componentExtraOperations"
                    :key="opt"
                    :label="getTranslatedExtraOperationLabel(opt)"
                    :value="opt"
                  />
                </n-space>
              </n-checkbox-group>
            </div>
          </n-descriptions-item>

          <!-- 涂硅脂, 涂三防漆, 换升压模块, 清灰, 贴铝片 -->

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.defectReason") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.defect_reason }}</span></template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.defect_reason" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.defectCodeL2") }}</span></template>
            <template v-if="!isEdit">
              <span class="text-sm text-gray-600">{{ form.defect_code_2 }}</span>
            </template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.defect_code_2" :placeholder="t('page.repairRecordsDetail.pleaseEnterDefectCodeL2')" />
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.defectCodeL3") }}</span></template>
            <template v-if="!isEdit">
              <span class="text-sm text-gray-600">{{ form.defect_code_3 }}</span>
            </template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.defect_code_3" :placeholder="t('page.repairRecordsDetail.pleaseEnterDefectCodeL3')" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.positionInfo") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.position }}</span></template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.position" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.verifyDefect") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.verify_defect }}</span></template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.verify_defect" />
          </n-descriptions-item>


          <n-descriptions-item class="text-sm">
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.repairImage") }}</span></template>
            <template v-if="!isEdit">
              <div class="flex gap-2 text-sm text-gray-600">
                <div
                  v-for="img in form.images.filter(Boolean)"
                  :key="img"
                  class="relative w-24 h-24 group"
                >
                  <img :src="img" class="w-24 h-24 object-cover rounded" />
                  <div
                    class="absolute inset-0 rounded bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <n-button text size="small" class="text-sm" @click="previewSrc = img; previewVisible = true">
                      <Icon icon="ant-design:eye-outlined" width="20" height="20" color="#fff" />
                    </n-button>
                  </div>
                </div>
              </div>
            </template>
           <!-- <QiniuImageUpload
             v-else
             :images="form.images"
             :max="10"
             :button-text="t('page.repairRecordsDetail.uploadImage')"
             @uploaded="(url: string) => form.images.push(url)"
             @remove="(url: string) => form.images = form.images.filter(u => u !== url)"
             @update="(urls: string[]) => form.images = urls"
             @update="(urls: string[]) => { if (Array.isArray(urls) && urls.length) form.images = urls.filter(Boolean) }
           /> -->
            <div v-else class="text-sm text-gray-600">
              <QiniuImageUpload
                v-model:images="form.images"
                :max="10"
                :button-text="t('page.repairRecordsDetail.uploadImage')"
                @uploaded="(url: string) => form.images.push(url)"
                @removed="(url: string) => form.images = form.images.filter(u => u !== url)"
              />
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
      <n-modal v-model:show="previewVisible" preset="card" :title="t('page.repairRecordsDetail.imagePreview')" style="width: 800px;">
        <div style="display:flex; justify-content:center; align-items:center;">
          <img :src="previewSrc" alt="预览" style="max-width:100%; max-height:70vh; object-fit:contain;" />
        </div>
      </n-modal>

      <!-- 维修进程 -->
      <n-card :title="t('page.repairRecordsDetail.repairProcess')">
        <n-descriptions :column="2" label-placement="left" bordered size="small" class="text-sm">
          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.startTime") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.start_time ? dayjs(form.start_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</span></template>
            <n-date-picker v-else size="small" class="text-sm" v-model:formatted-value="form.start_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>
           <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.endTime") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.end_time ? dayjs(form.end_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</span></template>
            <n-date-picker v-else size="small" class="text-sm" v-model:formatted-value="form.end_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.repairStatus") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ getTranslatedRepairResult(form.repair_result) }}</span></template>
            <n-select v-else size="small" class="text-sm" v-model:value="form.repair_result" :options="translatedRepairResultOptions" />
          </n-descriptions-item>

          <n-descriptions-item>
            <template #label><span class="text-sm text-gray-500">{{ t("page.repairRecordsDetail.repairer") }}</span></template>
            <template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.repairer_name }}</span></template>
            <n-input v-else size="small" class="text-sm" v-model:value="form.repairer_name" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4 mt-4">
        <!-- <n-button v-if="!isEdit" @click="isEdit = true">{{ t("page.repairRecordsDetail.edit") }}</n-button> -->
        <!-- <n-button v-if="isEdit" type="primary" @click="save">{{ t("page.repairRecordsDetail.save") }}</n-button> -->
        <!-- <n-button v-if="isEdit" @click="cancel">{{ t("page.repairRecordsDetail.cancel") }}</n-button> -->
      </div>
    </div>
    </n-config-provider>
  </template>

  <script setup lang="ts">
  import { ref, onMounted, computed } from "vue"
  import { useRoute } from "vue-router"
  import { useI18n } from 'vue-i18n'
  // @ts-ignore
  import dayjs from 'dayjs';
  import { useMessage } from 'naive-ui';
  import { NCard, NDescriptions, NDescriptionsItem, NInput, NButton, NDatePicker, NSelect, NDynamicInput, NSpace, NCheckbox, NCheckboxGroup, NModal, NConfigProvider, GlobalThemeOverrides } from "naive-ui"
  import { fetchRepairDetailsByID, updateRepairDetails } from '@/service/api/repair'
  import { repairResultOptions, repairResultMap } from '@/constants/business'
  import QiniuImageUpload from '@/components/upload/QiniuImageUpload.vue'
  import { Icon } from '@iconify/vue'
  import { useAuthStore } from '@/store/modules/auth';

  const authStore = useAuthStore();
  const hasRole=!authStore.userInfo.roles.includes('3')
  const isAdmin=authStore.userInfo.roles.includes('1') // 超管
  const isRead=authStore.userInfo.roles.includes('5') // 只读用户

  const route = useRoute();
  const { t } = useI18n();
  const message = useMessage()
  // const id = route.params.id; // 用它去请求详情数据
  const id = ref(route.params.id as string);
  const loading = ref(false);
  const imgAuthString = ref("")

  const isEdit = ref(false)
  const previewVisible = ref(false)
  const previewSrc = ref('')
  const repairTypeOptions = computed(() => [
    { label: t('page.repairRecordsDetail.repairTypeWhole'), value: '整机' },
    { label: t('page.repairRecordsDetail.repairTypeBoard'), value: '算力板' }
  ])

  const selectThemeOverrides: GlobalThemeOverrides = {
    Select: {
      peers: {
        InternalSelection: {
          fontSizeSmall: '12px'
        },
        InternalSelectMenu: {
          optionFontSizeSmall: '12px'
        }
      }
    }
  }

  const form = ref({
    date: dayjs().format('YYYY-MM-DD'),
    work_order_no: "",
    machine_model: "",
    repair_type: "",
    repairStation: Number(route.params.repairStation),
    device_sn: "",
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
    repair_result: 0,
    repairer_name: "",
    power_sn: "",
    motherboard_sn: "",
    extra_operations: ""

  })

  // 维修部件选项与编辑态状态
  const componentOptions = ['板1', '板2', '板3', '电源', '控制板', '其他']
  const selectedComponents = ref<string[]>([])
  const otherComponent = ref('')

  const componentExtraOperations = ['涂硅脂', '涂三防漆', '换升压模块', '清灰', '贴铝片']
  const selectedExtraOperations = ref<string[]>([])

  const getTranslatedComponentLabel = (val: string) => {
    const map: Record<string, string> = {
      '板1': t('page.repairRecordsDetail.componentBoard1'),
      '板2': t('page.repairRecordsDetail.componentBoard2'),
      '板3': t('page.repairRecordsDetail.componentBoard3'),
      '电源': t('page.repairRecordsDetail.componentPower'),
      '控制板': t('page.repairRecordsDetail.componentControlBoard'),
      '其他': t('page.repairRecordsDetail.componentOther'),
    };
    return map[val] || val;
  };

  const getTranslatedExtraOperationLabel = (val: string) => {
    const map: Record<string, string> = {
      '涂硅脂': t('page.repairRecordsDetail.operationSilicone'),
      '涂三防漆': t('page.repairRecordsDetail.operationConformalCoating'),
      '换升压模块': t('page.repairRecordsDetail.operationBoostModule'),
      '清灰': t('page.repairRecordsDetail.operationCleanDust'),
      '贴铝片': t('page.repairRecordsDetail.operationAluminum'),
    };
    return map[val] || val;
  };

  const getTranslatedComponentString = (str: string) => {
    if (!str) return '';
    return str.split(',').map(s => getTranslatedComponentLabel(s.trim())).join(', ');
  };

  const getTranslatedExtraOperationString = (str: string) => {
    if (!str) return '';
    return str.split(',').map(s => getTranslatedExtraOperationLabel(s.trim())).join(', ');
  };

  const getTranslatedRepairResult = (val: number | string) => {
    const map: Record<number, string> = {
      3: t('business.repairResult.repaired'),
      2: t('business.repairResult.unrepaired'),
      4: t('business.repairResult.scrapped'),
      1: t('business.repairResult.pending')
    };
    return map[Number(val)] || '';
  };

  const translatedRepairResultOptions = computed(() => {
    return repairResultOptions.map(opt => ({
      ...opt,
      label: getTranslatedRepairResult(opt.value)
    }));
  });


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
    // console.log("form.value.images", form.value.images)
    // return false
    form.value.repair_image_urls = form.value.images.join(',')
    updateRepairDetails(Number(id.value), form.value).then(() => {
      message.success(t('page.repairRecordsDetail.saveSuccess'))
      isEdit.value = false
    })
  }
  function cancel() {
    isEdit.value = false
  }

  // 获取详情数据
  const fetchDetailData = async () => {
    if (!id) return;

    loading.value = true;
    try {
      const { data, error } = await fetchRepairDetailsByID(Number(id.value));
      // console.log("data",data)
      if (error === null && data !== null) {
        const detail = data; // 假设返回的是数组，取第一个
        form.value = {
          date: detail.Date ? dayjs(detail.Date).format('YYYY-MM-DD') : dayjs(detail.CreatedAt).format('YYYY-MM-DD HH:mm'),
          work_order_no: detail.WorkOrderNo || '',
          machine_model: detail.MachineModel || '',
          repair_type: detail.repair_type || 0,
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
          motherboard_sn: detail.BoardSN || '',
          extra_operations: detail.extra_operations || ''
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
    } catch (error) {
      console.error(t('page.repairRecordsDetail.getDetailFailed') + ':', error);
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
