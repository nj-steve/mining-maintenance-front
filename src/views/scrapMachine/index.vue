<!-- 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果 -->

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-[1440px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">报废机管理</h1>
        <!-- <p class="text-gray-600">查看和管理所有报废设备信息</p> -->
      </div>
      
      <!-- Stats Cards -->
      <ScrapSummaryCards />
      
      <!-- Filters and Actions -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <ScrapSearchBar
            v-model:sn="filters.sn"
            v-model:siteId="filters.siteId"
            v-model:status="filters.status"
            :site-options="siteOptions"
            @change="handleSearchChange"
          />
          <div class="flex gap-2">
            <button @click="exportExcel" class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md flex items-center">
              <i class="fas fa-download mr-2"></i>
              导出数据
            </button>
            <button class="!rounded-button whitespace-nowrap px-4 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center">
              <i class="fas fa-plus mr-2"></i>
              新增报废
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
                  报废编号
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  场地
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  机型
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  整机 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  控制板 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  板 1 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  板 2 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  板 3 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  电源 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  报废日期
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  报废次数
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-white">
                  操作
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
                    <i 
                      :class="[
                        item.control_sn_flag === 2 ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board_sn1 }}</span>
                    <i 
                      :class="[
                        item.board_sn1_flag === 2 ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board_sn2 }}</span>
                    <i 
                      :class="[
                        item.board_sn2_flag === 2 ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board_sn3 }}</span>
                    <i 
                      :class="[
                        item.board_sn3_flag === 2 ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.power_sn }}</span>
                    <i 
                      :class="[
                        item.power_sn_flag === 2 ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-full text-xs',
                      item.status === 1 ? 'text-yellow-600 bg-yellow-100' : 
                      item.status === 2 ? 'text-blue-600 bg-blue-100' : 
                      'text-green-600 bg-green-100'
                    ]"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.scrap_time }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="font-medium text-gray-900">{{ item.scrap_count }} 次</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm sticky right-0 bg-white">
                  <div class="flex space-x-2">
                    <button
                      :class="[
                        'px-3 py-1 text-sm rounded whitespace-nowrap',
                        item.status === 3 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'
                      ]"
                      :disabled="item.status === 3"
                    >
                      {{ item.status === 3 ? (item.scrap_count > 1 ? '已修复' : '已确认') : '确认报废' }}
                    </button>
                    <button class="text-blue-600 hover:text-blue-900 text-sm px-2 py-1">
                      查看详情
                    </button>
                    <button class="text-red-600 hover:text-red-900 text-sm px-2 py-1">
                      删除
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
              上一页
            </button>
            <button 
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                显示第 <span class="font-medium">{{ (serverPagination.page - 1) * serverPagination.page_size + 1 }}</span> 至 <span class="font-medium">{{ Math.min(serverPagination.page * serverPagination.page_size, serverPagination.total) }}</span> 条记录，共 <span class="font-medium">{{ serverPagination.total }}</span> 条记录
              </p>
              </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">上一页</span>
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
                  <span class="sr-only">下一页</span>
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
import { fetchScrapLists, exportScrapDetail } from '@/service/api/repair'
import ScrapSummaryCards from './components/ScrapSummaryCards.vue'
import ScrapSearchBar from './components/ScrapSearchBar.vue'

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
const searchText = ref('');
const selectedSite = ref('全部场地');
const selectedModel = ref('全部机型');
const selectedStatus = ref('全部状态');
const showSiteDropdown = ref(false);
const showStatusDropdown = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const serverPagination = ref({ page: 1, page_size: 10, pages: 0, total: 0 })

// 搜索筛选（sn、site_id、status）
const filters = reactive<{ sn: string; siteId: number | null; status: number | null }>({
  sn: '',
  siteId: null,
  status: null
})

// 场地下拉选项（由接口数据汇总）
const siteOptions = computed(() => {
  const map = new Map<number, string>()
  filteredData.value.forEach((item: any) => {
    const id = item?.site_id
    const name = item?.site_name
    if (id != null && !map.has(id)) map.set(id, name || String(id))
  })
  return Array.from(map.entries()).map(([value, label]) => ({ label, value }))
})

// Toggle dropdowns
const toggleSiteDropdown = () => {
  showSiteDropdown.value = !showSiteDropdown.value;
  showStatusDropdown.value = false;
};

const toggleStatusDropdown = () => {
  showStatusDropdown.value = !showStatusDropdown.value;
  showSiteDropdown.value = false;
};

// Select filters
const selectSite = (site: string) => {
  selectedSite.value = site;
  showSiteDropdown.value = false;
  currentPage.value = 1;
};

const selectStatus = (status: string) => {
  selectedStatus.value = status;
  showStatusDropdown.value = false;
  currentPage.value = 1;
};

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
  const { data, error } = await fetchScrapLists(params)
  if (error == null && data) {
    filteredData.value = Array.isArray(data.data) ? data.data : []
    serverPagination.value = data.pagination || { page: 1, page_size: pageSize.value, pages: 0, total: 0 }
    currentPage.value = serverPagination.value.page || currentPage.value
    pageSize.value = serverPagination.value.page_size || pageSize.value
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchData()
});

// 使用后端分页数据，直接展示当前页数据
const paginatedData = computed(() => filteredData.value);

const totalPages = computed(() => serverPagination.value.pages || 0);

// 将后端状态数值映射为中文标签
const statusLabel = (status: number) => {
  if (status === 3) return '待审核';
  if (status === 1) return '待处理';
  if (status === 2) return '已审批';
  return '未知';
};

const uniqueSites = computed(() => {
  return Array.from(new Set(filteredData.value.map(item => item.site_name)));
});

const uniqueModels = computed(() => {
  return Array.from(new Set(filteredData.value.map(item => item.model)));
});

const uniqueStatuses = computed(() => {
  return Array.from(new Set(filteredData.value.map(item => item.status)));
});

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
      window.$message?.error(`导出失败: ${error}`)
      return
    }

    const list: any[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
    if (!list.length) {
      window.$message?.warning('当前筛选无可导出数据')
      return
    }

    const headers = [
      '报废编号',
      '场地',
      '机型',
      '整机 SN',
      '控制板 SN',
      '板1 SN',
      '板2 SN',
      '板3 SN',
      '电源 SN',
      '状态',
      '报废日期',
      '报废次数'
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
        row.scrap_time,
        row.scrap_count
      ].map(v => `<td style="mso-number-format:'\@';border:1px solid #ddd;padding:6px;">${v ?? ''}</td>`)
      return `<tr>${cells.join('')}</tr>`
    }).join('')

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>报废明细</x:Name>
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
    link.download = `报废明细_导出_${date}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    window.$message?.success('导出成功，下载已开始')
  } catch (err: any) {
    window.$message?.error(`导出失败: ${err?.message || err}`)
  }
}
</script>

<style scoped>
/* Custom styles if needed */
</style>
