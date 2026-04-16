<script setup lang="ts">
import { ref, computed } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, useMessage, NSpace } from 'naive-ui';
import { createRepairStation } from '@/service/api/repair';
import { useI18n } from 'vue-i18n';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();
const { t } = useI18n();

// 表单数据
const addForm = ref({
  address: '',
  contact_name: '',
  contact_phone: '',
  kyc_status: 0,
  legal_representative: '',
  name: '',
  score: ''
});

// KYC状态选项
const kycStatusOptions = computed(() => [
  { label: t('page.repairStation.unauthenticated'), value: 0 },
  { label: t('page.repairStation.authenticated'), value: 1 }
]);

// 重置表单
const resetForm = () => {
  addForm.value = {
    address: '',
    contact_name: '',
    contact_phone: '',
    kyc_status: 0,
    legal_representative: '',
    name: '',
    score: ''
  };
};

// 关闭弹框
const handleClose = () => {
  emit('update:show', false);
  resetForm();
};

// 保存添加
const handleSaveAdd = async () => {
  // 验证表单
  if (!addForm.value.name || !addForm.value.address || !addForm.value.legal_representative || !addForm.value.contact_name || !addForm.value.contact_phone) {
    message.warning(t('page.repairStation.pleaseFillComplete'));
    return;
  }
  try {
    // 转换score为数字类型
    const formData = {
      ...addForm.value,
      score: Number(addForm.value.score) || 0
    };
    const {error} = await createRepairStation(formData);
    if(error==null){
        message.success(t('page.repairStation.addSuccess'));
        handleClose();
        emit('success'); // 通知父组件刷新数据
      }
  } catch (err) {
    message.error(t('page.repairStation.addFailed'));
  }finally{

  }
};
</script>

<template>
  <NModal :show="show" @update:show="handleClose" style="width: 600px" preset="card" :title="t('page.repairStation.addStation')">
    <NForm :model="addForm" label-width="120px">
      <NFormItem :label="t('page.repairStation.stationName')" required>
        <NInput v-model:value="addForm.name" :placeholder="t('page.repairStation.pleaseEnterStationName')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.address')" required>
        <NInput v-model:value="addForm.address" :placeholder="t('page.repairStation.pleaseEnterDetailedAddress')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.legalRepresentative')" required>
        <NInput v-model:value="addForm.legal_representative" :placeholder="t('page.repairStation.pleaseEnterLegalRepresentative')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.contactName')" required>
        <NInput v-model:value="addForm.contact_name" :placeholder="t('page.repairStation.pleaseEnterContactName')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.contactPhone')" required>
        <NInput v-model:value="addForm.contact_phone" :placeholder="t('page.repairStation.pleaseEnterContactPhone')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.kycStatus')">
        <NSelect v-model:value="addForm.kyc_status" :options="kycStatusOptions" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.score')">
        <NInput v-model:value="addForm.score" :placeholder="t('page.repairStation.pleaseEnterScore')" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace>
        <NButton type="primary" @click="handleSaveAdd" style="margin-right: 10px;">{{ t('page.repairStation.submit') }}</NButton>
        <NButton @click="handleClose">{{ t('page.repairStation.cancel') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
