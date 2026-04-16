const fs = require('fs');

let content = fs.readFileSync('src/views/repairRecordsDetail/index.vue', 'utf8');

const reps = [
  ['>编辑<', '>{{ t("page.repairRecordsDetail.edit") }}<'],
  ['>保存<', '>{{ t("page.repairRecordsDetail.save") }}<'],
  ['>取消<', '>{{ t("page.repairRecordsDetail.cancel") }}<'],
  ['title="基础信息"', ':title="t(\'page.repairRecordsDetail.baseInfo\')"'],
  ['>日期<', '>{{ t("page.repairRecordsDetail.date") }}<'],
  ['>工单编号<', '>{{ t("page.repairRecordsDetail.workOrderNo") }}<'],
  ['>维修类型<', '>{{ t("page.repairRecordsDetail.repairType") }}<'],
  ['>维修站点<', '>{{ t("page.repairRecordsDetail.repairStation") }}<'],
  ['title="设备信息"', ':title="t(\'page.repairRecordsDetail.deviceInfo\')"'],
  ['>整机 SN<', '>{{ t("page.repairRecordsDetail.wholeMachineSN") }}<'],
  ['>控制板 SN<', '>{{ t("page.repairRecordsDetail.controlBoardSN") }}<'],
  ['>电源 SN<', '>{{ t("page.repairRecordsDetail.powerSN") }}<'],
  ['>板1 SN<', '>{{ t("page.repairRecordsDetail.board1SN") }}<'],
  ['>板2 SN<', '>{{ t("page.repairRecordsDetail.board2SN") }}<'],
  ['>板3 SN<', '>{{ t("page.repairRecordsDetail.board3SN") }}<'],
  ['title="维修详情"', ':title="t(\'page.repairRecordsDetail.repairDetail\')"'],
  ['>维修部件<', '>{{ t("page.repairRecordsDetail.repairComponent") }}<'],
  ['>额外操作<', '>{{ t("page.repairRecordsDetail.extraOperations") }}<'],
  ['>初测不良原因<', '>{{ t("page.repairRecordsDetail.defectReason") }}<'],
  ['>不良代码L2<', '>{{ t("page.repairRecordsDetail.defectCodeL2") }}<'],
  ['>不良代码L3<', '>{{ t("page.repairRecordsDetail.defectCodeL3") }}<'],
  ['>位号信息<', '>{{ t("page.repairRecordsDetail.positionInfo") }}<'],
  ['>查证缺陷<', '>{{ t("page.repairRecordsDetail.verifyDefect") }}<'],
  ['>维修部位图片<', '>{{ t("page.repairRecordsDetail.repairImage") }}<'],
  ['title="图片预览"', ':title="t(\'page.repairRecordsDetail.imagePreview\')"'],
  ['title="维修进程"', ':title="t(\'page.repairRecordsDetail.repairProcess\')"'],
  ['>开始时间<', '>{{ t("page.repairRecordsDetail.startTime") }}<'],
  ['>结束时间<', '>{{ t("page.repairRecordsDetail.endTime") }}<'],
  ['>维修状态<', '>{{ t("page.repairRecordsDetail.repairStatus") }}<'],
  ['>维修人员<', '>{{ t("page.repairRecordsDetail.repairer") }}<'],

  ['placeholder="请输入电源SN"', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterPowerSN\')"'],
  ['placeholder="请输入板1 码"', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterBoard1SN\')"'],
  ['placeholder="请输入板2 码 "', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterBoard2SN\')"'],
  ['placeholder="请输入板3 码 "', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterBoard3SN\')"'],
  ['placeholder="请输入其他项"', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterOther\')"'],
  ['placeholder="请输入不良代码L2"', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterDefectCodeL2\')"'],
  ['placeholder="请输入不良代码L3"', ':placeholder="t(\'page.repairRecordsDetail.pleaseEnterDefectCodeL3\')"'],
  ['button-text="上传图片"', ':button-text="t(\'page.repairRecordsDetail.uploadImage\')"'],

  ["message.success('修改成功')", "message.success(t('page.repairRecordsDetail.saveSuccess'))"],
  ["console.error('获取详情数据失败:', error)", "console.error(t('page.repairRecordsDetail.getDetailFailed') + ':', error)"],

  [`  const repairTypeOptions = [
    { label: '整机', value: '整机' },
    { label: '算力板', value: '算力板' }
  ]`, `  const repairTypeOptions = computed(() => [
    { label: t('page.repairRecordsDetail.repairTypeWhole'), value: '整机' },
    { label: t('page.repairRecordsDetail.repairTypeBoard'), value: '算力板' }
  ])`],

  [`<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.repair_type }}</span></template>`, `<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.repair_type === '整机' ? t('page.repairRecordsDetail.repairTypeWhole') : form.repair_type === '算力板' ? t('page.repairRecordsDetail.repairTypeBoard') : form.repair_type }}</span></template>`],

  [`<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.repair_component }}</span></template>`, `<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ getTranslatedComponentString(form.repair_component) }}</span></template>`],

  [`<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ form.extra_operations }}</span></template>`, `<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ getTranslatedExtraOperationString(form.extra_operations) }}</span></template>`],

  [`<n-checkbox
                    v-for="opt in componentOptions"
                    :key="opt"
                    :label="opt"
                    :value="opt"
                  />`, `<n-checkbox
                    v-for="opt in componentOptions"
                    :key="opt"
                    :label="getTranslatedComponentLabel(opt)"
                    :value="opt"
                  />`],

  [`<n-checkbox
                    v-for="opt in componentExtraOperations"
                    :key="opt"
                    :label="opt"
                    :value="opt"
                  />`, `<n-checkbox
                    v-for="opt in componentExtraOperations"
                    :key="opt"
                    :label="getTranslatedExtraOperationLabel(opt)"
                    :value="opt"
                  />`],
                  
  [`<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ repairResultMap[Number(form.repair_result)] }}</span></template>`, `<template v-if="!isEdit"><span class="text-sm text-gray-600">{{ getTranslatedRepairResult(form.repair_result) }}</span></template>`],
  [`<n-select v-else size="small" class="text-sm" v-model:value="form.repair_result" :options="repairResultOptions" />`, `<n-select v-else size="small" class="text-sm" v-model:value="form.repair_result" :options="translatedRepairResultOptions" />`]
];

reps.forEach(([from, to]) => {
  content = content.split(from).join(to);
});

// Now inject the helper functions right after componentExtraOperations declaration
const helpers = `
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
`;

content = content.replace(
  "const selectedExtraOperations = ref<string[]>([])", 
  "const selectedExtraOperations = ref<string[]>([])\n" + helpers
);

fs.writeFileSync('src/views/repairRecordsDetail/index.vue', content, 'utf8');

