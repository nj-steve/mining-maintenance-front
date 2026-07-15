<!-- 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果 -->

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class=" mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ t('page.scrapMachine.title') }}</h1>
      </div>
      <!-- Stats Cards -->
      <ScrapSummaryCards ref="summaryRef" />
      <!-- Filters and Actions -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <ScrapSearchBar
            v-model:sn="filters.sn"
            v-model:siteId="filters.siteId"
            v-model:status="filters.status"
            v-model:scrap_count="filters.scrap_count"
            v-model:order_fields="filters.order_fields"
            v-model:order_type="filters.order_type"
            :site-options="siteOptions"
            @change="handleSearchChange"
          />
          <div v-if="!isRead" class="flex gap-2">
            <button @click="exportExcel" class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md flex items-center">
              <i class="fas fa-download mr-2"></i>
              {{ t('page.scrapMachine.exportData') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  {{ t('page.scrapMachine.scrapNo') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.site') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.model') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.machineSn') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.controlSn') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.board1Sn') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.board2Sn') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.board3Sn') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.powerSn') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.status') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.scrapDate') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ t('page.scrapMachine.scrapCount') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-white">
                  {{ t('page.scrapMachine.action') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in paginatedData" :key="item.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                  {{ item.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.site_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.model }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.sn }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.control_sn }}</span>
                    <Icon
                      :icon="flagIcon(item.control_sn_flag)"
                      :class="flagClass(item.control_sn_flag)"
                      width="16"
                      height="16"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board_sn1 }}</span>
                    <Icon
                      :icon="flagIcon(item.board_sn1_flag)"
                      :class="flagClass(item.board_sn1_flag)"
                      width="16"
                      height="16"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board_sn2 }}</span>
                    <Icon
                      :icon="flagIcon(item.board_sn2_flag)"
                      :class="flagClass(item.board_sn2_flag)"
                      width="16"
                      height="16"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board_sn3 }}</span>
                    <Icon
                      :icon="flagIcon(item.board_sn3_flag)"
                      :class="flagClass(item.board_sn3_flag)"
                      width="16"
                      height="16"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.power_sn }}</span>
                    <Icon
                      :icon="flagIcon(item.power_sn_flag)"
                      :class="flagClass(item.power_sn_flag)"
                      width="16"
                      height="16"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs',
                      item.status === 1 ? 'text-yellow-600 bg-yellow-100' :
                      item.status === 2 ? 'text-blue-600 bg-blue-100' :
                      item.status === 4 ? 'text-green-600 bg-green-100' :
                      'text-purple-600 bg-purple-100'
                    ]"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatYMD(item.scrap_time) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="font-medium text-gray-900">{{ item.scrap_count }} {{ t('page.scrapMachine.times') }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm sticky right-0 bg-white">
                  <div v-if="!isRead" class="flex space-x-2">

                    <!-- <button
                      :class="[
                        'px-3 py-1 text-sm rounded whitespace-nowrap',
                        item.status === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                        item.status === 2 ? 'bg-blue-600 text-white' :
                        item.status === 4 ? 'bg-green-600 text-white' :
                        'bg-purple-600 text-white'
                      ]"
                      :disabled="item.status != 2 || Number(item.scrap_count) === 1"
                      @click="confirmScrap(item)"
                    > -->
                     <button
                      :class="[
                        'px-3 py-1 text-sm rounded whitespace-nowrap',
                        item.status === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                        item.status === 2 ? 'bg-blue-600 text-white' :
                        item.status === 4 ? 'bg-green-600 text-white' :
                        'bg-purple-600 text-white'
                      ]"
                      :disabled="item.status != 2"
                      @click="confirmScrap(item)"
                    >
                    <!-- {{ item.status === 3 ? t('page.scrapMachine.approved') : t('page.scrapMachine.confirmScrap') }} -->
                      {{ item.status >= 3 ? (item.status == 4 ? t('page.scrapMachine.repaired') : t('page.scrapMachine.approved')) : t('page.scrapMachine.confirmScrap') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {{ t('page.scrapMachine.previous') }}
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {{ t('page.scrapMachine.next') }}
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                {{ t('page.scrapMachine.showingRecords', {
                  start: (serverPagination.page - 1) * serverPagination.page_size + 1,
                  end: Math.min(serverPagination.page * serverPagination.page_size, serverPagination.total),
                  total: serverPagination.total
                }) }}
              </p>
              </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">{{ t('page.scrapMachine.previous') }}</span>
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">{{ t('page.scrapMachine.next') }}</span>
                  <i class="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { fetchScrapLists, exportScrapDetail, updateScrapStatus } from '@/service/api/repair'
import {  useMessage, useDialog } from 'naive-ui';
import ScrapSummaryCards from './components/ScrapSummaryCards.vue'
import ScrapSearchBar from './components/ScrapSearchBar.vue'
import {fetchOrdersSite} from '@/service/api';
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/store/modules/auth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const isRead=authStore.userInfo.roles.includes('5') // 只读用户

const message = useMessage();
const dialog = useDialog();
const summaryRef = ref<any>(null)

interface ScrapItemApi {
  id: number
  site_name: string
  model: string
  sn: string
  control_sn: string
  board_sn1: string
  board_sn2: string
  board_sn3: string
  power_sn: string
  status: number
  scrap_time: string
  scrap_count: number
  control_sn_flag: number
  board_sn1_flag: number
  board_sn2_flag: number
  board_sn3_flag: number
  power_sn_flag: number
  sn_flag: number
}

// Data refs
const filteredData = ref<ScrapItemApi[]>([]);
const siteOptions = ref<{ label: string; value: number }[]>([]); // 场地列表
const showSiteDropdown = ref(false);
const showStatusDropdown = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const serverPagination = ref({ page: 1, page_size: 10, pages: 0, total: 0 })

// 搜索筛选（sn、site_id、status）
const filters = reactive<{ sn: string; siteId: number | null;
  status: number | null;
  scrap_count: number | null;
  order_fields: number | null;
  order_type: string | null;
 }>
  ({
  sn: '',
  siteId: null,
  status: null,
  scrap_count: null,
  order_fields: null,
  order_type: null,
})


// 场地下拉选项（由接口数据汇总）
// const siteOptions = computed(() => {
//   const map = new Map<number, string>()
//   filteredData.value.forEach((item: any) => {
//     const id = item?.site_id
//     const name = item?.site_name
//     if (id != null && !map.has(id)) map.set(id, name || String(id))
//   })
//   return Array.from(map.entries()).map(([value, label]) => ({ label, value }))
// })
// 获取场地数据
const fetchSiteData = async () => {
  // console.log("hasRole>>fetchSiteData >> ",hasRole)
  try {
    // 这里需要根据实际的API接口来获取场地数据
    const params: any = {
      enable_all: (!(localStorage.getItem("onlyMySite")==='true'))?1:-1,
    };
    // console.log("params",params)
    const { data, error } = await fetchOrdersSite(params);
    if (!error && data) {
      siteOptions.value = data.map((site: any) => ({
        label: site.Name,
        value: site.ID,
      }));
    }
  } catch (err) {
    message.error(t('page.scrapMachine.fetchSiteDataFailed'));
  }
};

// Toggle dropdowns
// const toggleSiteDropdown = () => {
//   showSiteDropdown.value = !showSiteDropdown.value;
//   showStatusDropdown.value = false;
// };

// const toggleStatusDropdown = () => {
//   showStatusDropdown.value = !showStatusDropdown.value;
//   showSiteDropdown.value = false;
// };

// // Select filters
// const selectSite = (site: string) => {
//   selectedSite.value = site;
//   showSiteDropdown.value = false;
//   currentPage.value = 1;
// };

// const selectStatus = (status: string) => {
//   selectedStatus.value = status;
//   showStatusDropdown.value = false;
//   currentPage.value = 1;
// };

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showSiteDropdown.value = false;
    showStatusDropdown.value = false;
  }
};

async function fetchData() {
  const params: any = { page: currentPage.value, limit: pageSize.value }
  if (filters.sn) params.sn = filters.sn
  if (filters.siteId != null) params.site_id = filters.siteId
  if (filters.status != null) params.status = filters.status
  if (filters.scrap_count != null) params.scrap_count = filters.scrap_count
  if (filters.order_fields != null) params.order_fields = filters.order_fields
  if (filters.order_type != null) params.order_type = filters.order_type

  if (!(authStore.userInfo.roles.includes('3'))) {
    params.enable_all = localStorage.getItem("onlyMySite") === 'true' ? 1 : 0;
  } else {
    params.enable_all = 0;
  }

  const { data, error } = await fetchScrapLists(params)
  if (error == null && data) {
    filteredData.value = Array.isArray(data.list) ? data.list : []
    serverPagination.value = data.pagination || { page: 1, page_size: pageSize.value, pages: 0, total: 0 }
    currentPage.value = serverPagination.value.page || currentPage.value
    pageSize.value = serverPagination.value.page_size || pageSize.value
    // 列表刷新后同步刷新统计数据
    summaryRef.value?.reload?.()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchData()
  fetchSiteData()
});

// 二次确认并更新报废状态为 3（已审批）
async function confirmScrap(item: ScrapItemApi) {
  if (!item || item.status === 3) {
    message.info(t('page.scrapMachine.alreadyApproved'));
    return;
  }

  dialog.warning({
    title: t('page.scrapMachine.confirmAction'),
    content: t('page.scrapMachine.confirmScrapPrompt'),
    positiveText: t('page.scrapMachine.confirm'),
    negativeText: t('page.scrapMachine.cancel'),
    maskClosable: true,
    onPositiveClick: async () => {
      const { error } = await updateScrapStatus({ id: item.id, status: 3 })
      if (error == null) {
        message.success(t('page.scrapMachine.operationSuccess'))
        await fetchData()

      } else {
        message.error(t('page.scrapMachine.operationFailed', { error: String(error) }))
      }
    }
  })
}

// 使用后端分页数据，直接展示当前页数据
const paginatedData = computed(() => filteredData.value);

const totalPages = computed(() => serverPagination.value.pages || 0);

// 将后端状态数值映射为中文标签
// 1: 待处理；2:待审核；3:已审批；4: 已修复
const statusLabel = (status: number) => {
  if (status === 3) return t('page.scrapMachine.approved');
  if (status === 1) return t('page.scrapMachine.pendingProcess');
  if (status === 2) return t('page.scrapMachine.pendingReview');
  if (status === 4) return t('page.scrapMachine.repaired');
  return t('page.scrapMachine.unknown');
};

// SN 标记图标与颜色（0: 未标注 -> 橙色提醒；2: 正常 -> 绿色勾；1: 损坏 -> 红色叉）
function flagIcon(flag: number) {
  return flag === 2
    ? 'mdi:check-circle'
    : flag === 1
    ? 'mdi:close-circle'
    : 'mdi:alert-circle-outline'
}

function flagClass(flag: number) {
  return flag === 2
    ? 'text-green-500'
    : flag === 1
    ? 'text-red-500'
    : 'text-orange-500'
}

// const uniqueSites = computed(() => {
//   return Array.from(new Set(filteredData.value.map(item => item.site_name)));
// });

// const uniqueModels = computed(() => {
//   return Array.from(new Set(filteredData.value.map(item => item.model)));
// });

// const uniqueStatuses = computed(() => {
//   return Array.from(new Set(filteredData.value.map(item => item.status)));
// });

// Pagination controls
const visiblePages = computed(() => {
  const pages: number[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }

  return pages;
});

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    await fetchData()
  }
};

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await fetchData()
  }
};

const goToPage = async (page: number) => {
  currentPage.value = page;
  await fetchData()
};

function handleSearchChange() {
  currentPage.value = 1
  fetchData()
}

// Watch filters as fallback
watch(() => [filters.sn, filters.siteId, filters.status], async () => {
  currentPage.value = 1
  await fetchData()
})
/**
 * 导出当前筛选条件下的报废明细为 Excel（.xls 兼容格式）
 * 通过调用后端 `exportScrapDetail` 接口获取数据并构造 Excel 兼容的 HTML 表格
 */
async function exportExcel() {
  try {
    const params: any = {}
    if (filters.sn) params.sn = filters.sn
    if (filters.siteId != null) params.site_id = filters.siteId
    if (filters.status != null) params.status = filters.status

    const { data, error } = await exportScrapDetail(params)
    if (error != null) {
      window.$message?.error(t('page.scrapMachine.exportFailed', { error: String(error) }))
      return
    }

    const list: any[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
    if (!list.length) {
      window.$message?.warning(t('page.scrapMachine.noDataToExport'))
      return
    }

    const headers = [
      t('page.scrapMachine.scrapNo'),
      t('page.scrapMachine.site'),
      t('page.scrapMachine.model'),
      t('page.scrapMachine.machineSn'),
      t('page.scrapMachine.controlSn'),
      t('page.scrapMachine.board1Sn'),
      t('page.scrapMachine.board2Sn'),
      t('page.scrapMachine.board3Sn'),
      t('page.scrapMachine.powerSn'),
      t('page.scrapMachine.status'),
      t('page.scrapMachine.scrapDate'),
      t('page.scrapMachine.scrapCount')
    ]

    const th = headers.map(h => `<th style="mso-number-format:'\@';border:1px solid #ddd;padding:6px;background:#f5f5f5;">${h}</th>`).join('')
    const rows = list.map((row: any) => {
      const cells = [
        row.id,
        row.site_name,
        row.model,
        row.sn,
        row.control_sn,
        row.board_sn1,
        row.board_sn2,
        row.board_sn3,
        row.power_sn,
        statusLabel(Number(row.status)),
        formatYMD(row.scrap_time),
        row.scrap_count
      ].map(v => `<td style=\"mso-number-format:'\\@';border:1px solid #ddd;padding:6px;\">${v ?? ''}</td>`)
      return `<tr>${cells.join('')}</tr>`
    }).join('')

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>${t('page.scrapMachine.scrapDetailExport')}</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
          <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
            <thead><tr>${th}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `${t('page.scrapMachine.scrapDetailExportFile')}${date}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    window.$message?.success(t('page.scrapMachine.exportSuccess'))
  } catch (err: any) {
    window.$message?.error(t('page.scrapMachine.exportFailed', { error: err?.message || err }))
  }
}

// 将日期格式化为 年-月-日（YYYY-MM-DD）
function formatYMD(input: any) {
  const d = new Date(input)
  if (isNaN(d.getTime())) return input ?? ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

</script>

<style scoped>
/* Custom styles if needed */
</style>
