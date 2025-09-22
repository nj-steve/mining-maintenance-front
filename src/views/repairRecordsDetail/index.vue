<template>
    <div class="p-4 space-y-6">
      <!-- 基础信息 -->
      <n-card title="基础信息">
        <n-space vertical>
          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="日期">
              <template v-if="!isEdit">{{ form.date }}</template>
              <n-date-picker v-else v-model:value="form.date" type="date" :value-format="'yyyy-MM-dd'" />
            </n-descriptions-item>
  
            <n-descriptions-item label="工单编号">
              <template v-if="!isEdit">{{ form.workOrderNo }}</template>
              <n-input v-else v-model:value="form.workOrderNo" />
            </n-descriptions-item>
  
            <n-descriptions-item label="机型">
              <template v-if="!isEdit">{{ form.machineModel }}</template>
              <n-input v-else v-model:value="form.machineModel" />
            </n-descriptions-item>
  
            <n-descriptions-item label="维修站点">
              <template v-if="!isEdit">{{ form.repairStation }}</template>
              <n-input v-else v-model:value="form.repairStation" />
            </n-descriptions-item>
          </n-descriptions>
        </n-space>
      </n-card>
  
      <!-- 设备信息 -->
      <n-card title="设备信息">
        <n-descriptions :column="1" label-placement="left" bordered>
          <n-descriptions-item label="整机SN码">
            <template v-if="!isEdit">{{ form.deviceSN }}</template>
            <n-input v-else v-model:value="form.deviceSN" />
          </n-descriptions-item>
  
          <n-descriptions-item label="电源SN码">
            <template v-if="!isEdit">
              <div v-for="pwr in form.powerSN" :key="pwr">{{ pwr }}</div>
            </template>
            <div v-else>
              <n-dynamic-input v-model:value="form.powerSN" placeholder="请输入电源SN" />
            </div>
          </n-descriptions-item>
  
          <n-descriptions-item label="板卡SN码">
            <template v-if="!isEdit">
              <div v-for="brd in form.boardSN" :key="brd">{{ brd }}</div>
            </template>
            <div v-else>
              <n-dynamic-input v-model:value="form.boardSN" placeholder="请输入板卡SN" />
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
  
      <!-- 维修详情 -->
      <n-card title="维修详情">
        <n-descriptions :column="1" label-placement="left" bordered>
          <n-descriptions-item label="维修部件">
            <template v-if="!isEdit">{{ form.repairComponent }}</template>
            <n-input v-else v-model:value="form.repairComponent" />
          </n-descriptions-item>
  
          <n-descriptions-item label="初测不良原因">
            <template v-if="!isEdit">{{ form.defectReason }}</template>
            <n-input v-else v-model:value="form.defectReason" />
          </n-descriptions-item>
  
          <n-descriptions-item label="不良代码">
            <template v-if="!isEdit">
              <div v-for="code in form.defectCodes" :key="code">{{ code }}</div>
            </template>
            <n-dynamic-input v-else v-model:value="form.defectCodes" placeholder="请输入不良代码" />
          </n-descriptions-item>
  
          <n-descriptions-item label="位号信息">
            <template v-if="!isEdit">{{ form.position }}</template>
            <n-input v-else v-model:value="form.position" />
          </n-descriptions-item>
  
          <n-descriptions-item label="查证缺陷">
            <template v-if="!isEdit">{{ form.verifyDefect }}</template>
            <n-input v-else v-model:value="form.verifyDefect" />
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
          <n-descriptions-item label="维修时间">
            <template v-if="!isEdit">{{ form.repairTime }}</template>
            <n-date-picker v-else v-model:value="form.repairTime" type="datetime" :value-format="'yyyy-MM-dd HH:mm'" />
          </n-descriptions-item>
  
          <n-descriptions-item label="维修状态">
            <template v-if="!isEdit">{{ form.repairStatus }}</template>
            <n-select v-else v-model:value="form.repairStatus" :options="statusOptions" />
          </n-descriptions-item>
  
          <n-descriptions-item label="维修人员">
            <template v-if="!isEdit">{{ form.repairer }}</template>
            <n-input v-else v-model:value="form.repairer" />
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
  
      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4 mt-4">
        <n-button v-if="!isEdit" @click="isEdit = true">编辑</n-button>
        <n-button v-else type="primary" @click="save">保存</n-button>
        <n-button v-if="isEdit" @click="cancel">取消</n-button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from "vue"
  import { useRoute } from "vue-router"
  import { NCard, NDescriptions, NDescriptionsItem, NInput, NButton, NDatePicker, NSelect, NDynamicInput, NUpload, NSpace } from "naive-ui"
  import { fetchRepairDetailsByID } from '@/service/api/repair'
  
  const route = useRoute();
  // const id = route.params.id; // 用它去请求详情数据
  const id = ref(route.params.id as string);
  const loading = ref(false);

  const isEdit = ref(false)
  
  const form = ref({
    date: new Date('2024-01-18').getTime(),
    workOrderNo: "WO2024011800001",
    machineModel: "S19 XP",
    repairStation: "深圳维修中心",
    deviceSN: "SN2024011800001",
    powerSN: ["PWR20240118001234556", "PWR20240118001234557", "PWR20240118001234558"],
    boardSN: ["BRD120240118001234556", "BRD220240118001234556", "BRD320240118001234556"],
    repairComponent: "主板",
    defectReason: "无法开机",
    defectCodes: ["PWR-ERR-001", "VOL-ABN-002"],
    position: "C12, R45, Q78",
    verifyDefect: "主板供电异常",
    images: [
      "https://placehold.co/200x200?text=主板照片",
      "https://placehold.co/200x200?text=电源模块照片",
      "https://placehold.co/200x200?text=风扇照片"
    ],
    repairTime: new Date('2024-01-18 09:30').getTime(),
    repairStatus: "维修完成",
    repairer: "刘工"
  })
  
  const statusOptions = [
    { label: "待维修", value: "待维修" },
    { label: "维修中", value: "维修中" },
    { label: "维修完成", value: "维修完成" }
  ]
  
  function save() {
    console.log("保存数据", form.value)
    isEdit.value = false
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
      console.log("data",data)
      if (error === null && data && data.length > 0) {
        const detail = data[0]; // 假设返回的是数组，取第一个
        form.value = {
          date: detail.Date ? new Date(detail.Date).getTime() : new Date().getTime(),
          workOrderNo: detail.WorkOrderNo || '',
          machineModel: detail.MachineModel || '',
          repairStation: detail.RepairStationName || '',
          deviceSN: detail.DeviceSN || '',
          powerSN: detail.PowerSN ? detail.PowerSN.split(',') : [],
          boardSN: detail.BoardSN ? detail.BoardSN.split(',') : [],
          repairComponent: detail.RepairComponent || '',
          defectReason: detail.DefectReason || '',
          defectCodes: detail.DefectCodes ? detail.DefectCodes.split(',') : [],
          position: detail.Position || '',
          verifyDefect: detail.VerifyDefect || '',
          images: detail.Images ? detail.Images.split(',') : [],
          repairTime: detail.RepairTime ? new Date(detail.RepairTime).getTime() : new Date().getTime(),
          repairStatus: detail.RepairStatus || '',
          repairer: detail.Repairer || ''
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