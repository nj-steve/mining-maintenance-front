<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, useMessage, NSpace } from 'naive-ui';
import { updateRepairStation } from '@/service/api/repair';
import { useI18n } from 'vue-i18n';

interface CompanyInfo {
  ID: number;
  Name: string;
  Address: string;
  LegalRepresentative: string;
  KYCStatus: number;
  ContactName: string;
  ContactPhone: string;
  Score: number;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Props {
  show: boolean;
  editData: CompanyInfo | null;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();
const { t } = useI18n();

// 表单数据
const editForm = ref({
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

// 监听编辑数据变化，填充表单
watch(() => props.editData, (newData) => {
  if (newData) {
    editForm.value = {
      address: newData.Address || '',
      contact_name: newData.ContactName || '',
      contact_phone: newData.ContactPhone || '',
      kyc_status: newData.KYCStatus || 0,
      legal_representative: newData.LegalRepresentative || '',
      name: newData.Name || '',
      score: String(newData.Score || 0)
    };
  }
}, { immediate: true });

// 重置表单
const resetForm = () => {
  editForm.value = {
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

// 保存修改
const handleSaveEdit = async () => {
  if (!props.editData) {
    message.error(t('page.repairStation.editDataNotExist'));
    return;
  }
  // 验证表单
  if (!editForm.value.name || !editForm.value.address || !editForm.value.legal_representative || !editForm.value.contact_name || !editForm.value.contact_phone) {
    message.warning(t('page.repairStation.pleaseFillComplete'));
    return;
  }
  try {
    // 转换score为数字类型
    const formData = {
      ...editForm.value,
      score: Number(editForm.value.score) || 0
    };
    const {error} = await updateRepairStation(props.editData.ID, formData);
    if(error===null){
        message.success(t('page.repairStation.editSuccess'));
        handleClose();
        emit('success'); // 通知父组件刷新数据
      }else{
        message.error(t('page.repairStation.editFailed') + ':');
      }
  } catch (err) {
    message.error(t('page.repairStation.editFailed'));
  }finally{

  }
};
</script>

<template>
  <NModal :show="show" @update:show="handleClose" style="width: 600px" preset="card" :title="t('page.repairStation.editStation')">
    <NForm :model="editForm" label-width="120px">
      <NFormItem :label="t('page.repairStation.stationName')" required>
        <NInput v-model:value="editForm.name" :placeholder="t('page.repairStation.pleaseEnterStationName')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.address')" required>
        <NInput v-model:value="editForm.address" :placeholder="t('page.repairStation.pleaseEnterDetailedAddress')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.legalRepresentative')" required>
        <NInput v-model:value="editForm.legal_representative" :placeholder="t('page.repairStation.pleaseEnterLegalRepresentative')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.contactName')" required>
        <NInput v-model:value="editForm.contact_name" :placeholder="t('page.repairStation.pleaseEnterContactName')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.contactPhone')" required>
        <NInput v-model:value="editForm.contact_phone" :placeholder="t('page.repairStation.pleaseEnterContactPhone')" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.kycStatus')">
        <NSelect v-model:value="editForm.kyc_status" :options="kycStatusOptions" />
      </NFormItem>
      <NFormItem :label="t('page.repairStation.score')">
        <NInput v-model:value="editForm.score" :placeholder="t('page.repairStation.pleaseEnterScore')" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace>
        <NButton type="primary" @click="handleSaveEdit" style="margin-right: 10px;" >{{ t('page.repairStation.save') }}</NButton>
        <NButton @click="handleClose">{{ t('page.repairStation.cancel') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
