import re

with open('src/views/repairRecordsDetail/index.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Add i18n import and setup
if "import { useI18n } from 'vue-i18n';" not in content:
    content = content.replace("import { useRoute } from \"vue-router\"", "import { useRoute } from \"vue-router\"\n  import { useI18n } from 'vue-i18n';")
    content = content.replace("const route = useRoute();", "const route = useRoute();\n  const { t } = useI18n();")

replacements = {
    # template text
    r'>编辑<': r'>{{ t("page.repairRecordsDetail.edit") }}<',
    r'>保存<': r'>{{ t("page.repairRecordsDetail.save") }}<',
    r'>取消<': r'>{{ t("page.repairRecordsDetail.cancel") }}<',
    r'title="基础信息"': r':title="t(\'page.repairRecordsDetail.baseInfo\')"',
    r'>日期<': r'>{{ t("page.repairRecordsDetail.date") }}<',
    r'>工单编号<': r'>{{ t("page.repairRecordsDetail.workOrderNo") }}<',
    r'>维修类型<': r'>{{ t("page.repairRecordsDetail.repairType") }}<',
    r'>维修站点<': r'>{{ t("page.repairRecordsDetail.repairStation") }}<',
    r'title="设备信息"': r':title="t(\'page.repairRecordsDetail.deviceInfo\')"',
    r'>整机 SN<': r'>{{ t("page.repairRecordsDetail.wholeMachineSN") }}<',
    r'>控制板 SN<': r'>{{ t("page.repairRecordsDetail.controlBoardSN") }}<',
    r'>电源 SN<': r'>{{ t("page.repairRecordsDetail.powerSN") }}<',
    r'>板1 SN<': r'>{{ t("page.repairRecordsDetail.board1SN") }}<',
    r'>板2 SN<': r'>{{ t("page.repairRecordsDetail.board2SN") }}<',
    r'>板3 SN<': r'>{{ t("page.repairRecordsDetail.board3SN") }}<',
    r'title="维修详情"': r':title="t(\'page.repairRecordsDetail.repairDetail\')"',
    r'>维修部件<': r'>{{ t("page.repairRecordsDetail.repairComponent") }}<',
    r'>额外操作<': r'>{{ t("page.repairRecordsDetail.extraOperations") }}<',
    r'>初测不良原因<': r'>{{ t("page.repairRecordsDetail.defectReason") }}<',
    r'>不良代码L2<': r'>{{ t("page.repairRecordsDetail.defectCodeL2") }}<',
    r'>不良代码L3<': r'>{{ t("page.repairRecordsDetail.defectCodeL3") }}<',
    r'>位号信息<': r'>{{ t("page.repairRecordsDetail.positionInfo") }}<',
    r'>查证缺陷<': r'>{{ t("page.repairRecordsDetail.verifyDefect") }}<',
    r'>维修部位图片<': r'>{{ t("page.repairRecordsDetail.repairImage") }}<',
    r'title="图片预览"': r':title="t(\'page.repairRecordsDetail.imagePreview\')"',
    r'title="维修进程"': r':title="t(\'page.repairRecordsDetail.repairProcess\')"',
    r'>开始时间<': r'>{{ t("page.repairRecordsDetail.startTime") }}<',
    r'>结束时间<': r'>{{ t("page.repairRecordsDetail.endTime") }}<',
    r'>维修状态<': r'>{{ t("page.repairRecordsDetail.repairStatus") }}<',
    r'>维修人员<': r'>{{ t("page.repairRecordsDetail.repairer") }}<',

    r'placeholder="请输入电源SN"': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterPowerSN\')"',
    r'placeholder="请输入板1 码"': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterBoard1SN\')"',
    r'placeholder="请输入板2 码 "': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterBoard2SN\')"',
    r'placeholder="请输入板3 码 "': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterBoard3SN\')"',
    r'placeholder="请输入其他项"': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterOther\')"',
    r'placeholder="请输入不良代码L2"': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterDefectCodeL2\')"',
    r'placeholder="请输入不良代码L3"': r':placeholder="t(\'page.repairRecordsDetail.pleaseEnterDefectCodeL3\')"',
    r'button-text="上传图片"': r':button-text="t(\'page.repairRecordsDetail.uploadImage\')"',
    
    r"message.success\('修改成功'\)": r"message.success(t('page.repairRecordsDetail.saveSuccess'))",
    r"console.error\('获取详情数据失败:', error\)": r"console.error(t('page.repairRecordsDetail.getDetailFailed') + ':', error)",
    
    r"const repairTypeOptions = \[": r"import { computed } from 'vue';\n  const repairTypeOptions = computed(() => [",
    r"\{ label: '整机', value: '整机' \}": r"{ label: t('page.repairRecordsDetail.repairTypeWhole'), value: '整机' }",
    r"\{ label: '算力板', value: '算力板' \}": r"{ label: t('page.repairRecordsDetail.repairTypeBoard'), value: '算力板' }",
    r"\]\n\n  const selectThemeOverrides": r"])\n\n  const selectThemeOverrides",
}

for k, v in replacements.items():
    content = re.sub(k, v, content)

with open('src/views/repairRecordsDetail/index.vue', 'w', encoding='utf-8') as f:
    f.write(content)
