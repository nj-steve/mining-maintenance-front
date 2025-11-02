<template>
    <div class="p-4 space-y-6">
      <!-- 基础信息 -->
       <div class="flex justify-end gap-4 mt-4">
        <n-button v-if="!isEdit" size="large" type="primary" @click="isEdit = true">编辑</n-button>
        <n-button v-if="isEdit" type="primary" @click="save">保存</n-button>
        <n-button v-if="isEdit" @click="cancel">取消</n-button>
      </div>
      <n-card title="基础信息">
        <n-space vertical>
          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="日期">
              <template v-if="!isEdit">{{ dayjs(form.date).format('YYYY-MM-DD HH:mm:ss') }}</template>
              <n-date-picker v-else v-model:formatted-value="form.date" type="date" value-format="yyyy-MM-dd" />
            </n-descriptions-item>
  
            <n-descriptions-item label="工单编号">
              <template v-if="!isEdit">{{ form.work_order_no }}</template>
              <n-input v-else v-model:value="form.work_order_no" />
            </n-descriptions-item>
  
            <n-descriptions-item label="机型">
              <template v-if="!isEdit">{{ form.machine_model }}</template>
              <n-input v-else v-model:value="form.machine_model" />
            </n-descriptions-item>
  
            <n-descriptions-item label="维修站点">
              <template v-if="!isEdit">{{ form.repairStation }}</template>
              <n-select v-else v-model:value="form.repairStation" />
            </n-descriptions-item>
          </n-descriptions>
        </n-space>
      </n-card>
  
      <!-- 设备信息 -->
      <n-card title="设备信息">
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
              <!-- <n-dynamic-input v-model:value="form.powerSN" placeholder="请输入电源 SN" /> -->
               <n-input v-model:value="form.powerSN" placeholder="请输入电源SN"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
  
          <n-descriptions-item label="板1 SN">
            <template v-if="!isEdit">
              <div>{{ form.board_sn_1 }}</div>
            </template>
            <div v-else>
               <n-input v-model:value="form.board_sn_1" placeholder="请输入板1 码"  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
           <n-descriptions-item label="板2 SN">
            <template v-if="!isEdit">
              <div>{{ form.board_sn_2 }}</div>
            </template>
            <div v-else>
               <n-input v-model:value="form.board_sn_2" placeholder="请输入板2 码 "  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>
           <n-descriptions-item label="板3 SN">
            <template v-if="!isEdit">
              <div>{{ form.board_sn_3 }}</div>
            </template>
            <div v-else>
               <n-input v-model:value="form.board_sn_3" placeholder="请输入板3 码 "  style="width: 100%; margin-bottom: 10px;" />
            </div>
          </n-descriptions-item>

        </n-descriptions>
      </n-card>
  
      <!-- 维修详情 -->
      <n-card title="维修详情">
        <n-descriptions :column="1" label-placement="left" bordered>
          <n-descriptions-item label="维修部件">
            <template v-if="!isEdit">{{ form.repair_component }}</template>
            <n-input v-else v-model:value="form.repair_component" />
          </n-descriptions-item>
  
          <n-descriptions-item label="初测不良原因">
            <template v-if="!isEdit">{{ form.defect_reason }}</template>
            <n-input v-else v-model:value="form.defect_reason" />
          </n-descriptions-item>
  
          <n-descriptions-item label="不良代码L2">
            <template v-if="!isEdit">
              <div>{{ form.defect_code_2 }}</div>
            </template>
            <n-input v-else v-model:value="form.defect_code_2" placeholder="请输入不良代码L2" />
          </n-descriptions-item>
           <n-descriptions-item label="不良代码L3">
            <template v-if="!isEdit">
              <div>{{ form.defect_code_3 }}</div>
            </template>
            <n-input v-else v-model:value="form.defect_code_3" placeholder="请输入不良代码L3" />
          </n-descriptions-item>
  
          <n-descriptions-item label="位号信息">
            <template v-if="!isEdit">{{ form.position }}</template>
            <n-input v-else v-model:value="form.position" />
          </n-descriptions-item>
  
          <n-descriptions-item label="查证缺陷">
            <template v-if="!isEdit">{{ form.verify_defect }}</template>
            <n-input v-else v-model:value="form.verify_defect" />
          </n-descriptions-item>
  
          <n-descriptions-item label="维修部位图片">
            <template v-if="!isEdit">
              <div class="flex gap-2">
                <img v-for="img in form.images" :src="img" :key="img" class="w-24 h-24 object-cover rounded" />
              </div>
            </template>
            <n-upload v-else action="#" list-type="image-card" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
  
      <!-- 维修进程 -->
      <n-card title="维修进程">
        <n-descriptions :column="2" label-placement="left" bordered>
          <n-descriptions-item label="开始时间">
            <template v-if="!isEdit">{{ form.start_time ? dayjs(form.start_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</template>
            <n-date-picker v-else v-model:formatted-value="form.start_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>
           <n-descriptions-item label="结束时间">
            <template v-if="!isEdit">{{ form.end_time ? dayjs(form.end_time).format('YYYY-MM-DD HH:mm:ss') : '' }}</template>
            <n-date-picker v-else v-model:formatted-value="form.end_time" type="datetime" value-format="yyyy-MM-dd HH:mm" />
          </n-descriptions-item>
  
          <n-descriptions-item label="维修状态">
            <template v-if="!isEdit">{{ repairResultMap[Number(form.repair_result)] }}</template>
            <n-select v-else v-model:value="form.repair_result" :options="repairResultOptions" />
          </n-descriptions-item>
  
          <n-descriptions-item label="维修人员">
            <template v-if="!isEdit">{{ form.repairer_name }}</template>
            <n-input v-else v-model:value="form.repairer_name" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
  
      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4 mt-4">
        <!-- <n-button v-if="!isEdit" @click="isEdit = true">编辑</n-button> -->
        <!-- <n-button v-if="isEdit" type="primary" @click="save">保存</n-button> -->
        <!-- <n-button v-if="isEdit" @click="cancel">取消</n-button> -->
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from "vue"
  import { useRoute } from "vue-router"
  import dayjs from 'dayjs';
  import { useMessage } from 'naive-ui';
  import { NCard, NDescriptions, NDescriptionsItem, NInput, NButton, NDatePicker, NSelect, NDynamicInput, NUpload, NSpace } from "naive-ui"
  import { fetchRepairDetailsByID, updateRepairDetails } from '@/service/api/repair'
  import { repairResultOptions, repairResultMap } from '@/constants/business'
  
  const route = useRoute();
  const message = useMessage()
  // const id = route.params.id; // 用它去请求详情数据
  const id = ref(route.params.id as string);
  const loading = ref(false);

  const isEdit = ref(false)
  
  const form = ref({
    date: dayjs().format('YYYY-MM-DD'),
    work_order_no: "",
    machine_model: "",
    repairStation: Number(route.params.repairStation),
    device_sn: "",
    powerSN: "",
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
  
  
  function save() {
    console.log("保存数据", form.value)
    form.value.date = dayjs(form.value.date).format('YYYY-MM-DD')
    form.value.start_time = String(form.value.start_time)
    form.value.end_time = String(form.value.end_time)
    updateRepairDetails(Number(id.value), form.value).then(() => {
      message.success('修改成功')
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
          date: detail.Date ? dayjs(detail.Date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          work_order_no: detail.WorkOrderNo || '',
          machine_model: detail.MachineModel || '',
          repairStation: detail.RepairStationName || '',
          device_sn: detail.DeviceSN || '',
          powerSN: detail.PowerSN || '',
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
          images: detail.Images ? detail.Images.split(',') : [],
          start_time: detail.StartTime ? dayjs(detail.StartTime).format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
          end_time: detail.EndTime ? dayjs(detail.EndTime).format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
          repair_result: detail.RepairResult ?? 1,
          repairer_name: detail.RepairerName || '',
          power_sn: detail.PowerSN || '',
          motherboard_sn: detail.BoardSN || ''
        };
      }
    } catch (error) {
      console.error('获取详情数据失败:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchDetailData();
  });
  </script>