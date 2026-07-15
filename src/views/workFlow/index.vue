<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { NDataTable, useMessage, NButton, NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NDatePicker, NTooltip, NProgress } from 'naive-ui';
import { Icon } from '@iconify/vue';
import type { DataTableColumns, PaginationProps, DataTableRowKey } from 'naive-ui';
import { fetchOrders, updateOrders, fetchOrdersDetail, dispatchOrders,fetchOrdersStatus } from '@/service/api/workflow';
import {fetchOrdersSite,gobackOrders,fetchRepairStations} from '@/service/api';
// import SvgIcon from '@/components/custom/svg-icon.vue';
import { repairMethodRecord,repairMethodOptions } from '@/constants/business';
import SearchFilters from './components/SearchFilters.vue';
import ActionButtons from './components/ActionButtons.vue'
import AddLogModal from './components/AddLogModal.vue'
import { useAuthStore } from '@/store/modules/auth';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'WorkFlow'
});

const { t } = useI18n();
const router = useRouter();
interface Order {
  ID: number;                     // 工单ID
  OrderNo: string;                // 工单编号
  SiteID: number;                 // 场地ID
  StationID: number;              // 维修站ID
  Onsite: number;                 // 是否驻场（0/1）
  StationName: string | null;     // 维修站名称
  OrderStatus: number;            // 工单状态
  FaultCount: number;             // 故障机数量
  InWarrantyCount: number;        // 短保期内数量
  OutOfWarrantyCount: number;     // 短保期外数量
  RepairCost: number;             // 维修费用
  LogisticsCost: number;          // 物流费用
  TotalCost: number;              // 总费用
  SalerName: string | null;       // 销售人名称
  SettlementStatus: number;       // 付款状态
  SettlementStatusText: string | null; // 付款状态文本
  PaymentDate: string | null;     // 付款日期
  LogisticsCompanyId: number | null; // 物流公司ID
  CreatedBy: string | null;       // 创建人
  CreatedAt: string;              // 创建时间
  UpdatedAt: string;              // 更新时间
  RepairMethod: number;           // 维修方式
  RepairedCount: number;            // 维修次数
  group_name?: string;            // 维修站组名
}

const message = useMessage();
const authStore = useAuthStore();
const routeRoles=["1","2"]
const hasRole = authStore.userInfo.roles.some(role => routeRoles.includes(role));
// console.log("hasRole---",hasRole);
// const isRepair = computed(() => authStore.userInfo.roles.some('1','2'));// 判断用户是不是维修用户
const tableData = ref<Order[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');

// 批量选择相关
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedOrders = computed(() => {
  return tableData.value.filter(order => checkedRowKeys.value.includes(order.ID));
});
const isBatchDispatchEnabled = computed(() => selectedOrders.value.length > 0);
// 分页
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix({ itemCount }) {
    return t('page.workflow.totalItems', { count: itemCount })
  },
  onChange: page => {
    pagination.value.page = page;
    fetchData();
  },
  onUpdatePageSize: pageSize => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    fetchData();
  }
});

// ---------------- 修改弹框 ----------------
const showEditModal = ref(false);
const editForm = ref({
  id:0,
  order_no:"",
  repair_method:0,
  "logistics_cost": 0,
  "onsite": 0,
  "order_status": 1,
  "payment_date": null as string | null,
  "repair_cost": 0,
  "settlement_status": 1,
  "total_cost": 0,
  "repair_station_id": null as number | null,
});

const getTranslatedOrderStatus = (name: string | undefined | null) => {
  if (!name) return '';
  const map: Record<string, string> = {
    '已完成': t('page.workflow.completed'),
    '维修': t('page.workflow.repairing'),
    '未解决': t('page.workflow.unresolved'),
    '待处理': t('page.workflow.pending'),
    '处理中': t('page.workflow.processing'),
  };
  return map[name] || name;
};

// 状态下拉选项
const statusOptionsData = ref<any[]>([]);
const statusOptions = computed(() => statusOptionsData.value.map(item => ({
  label: getTranslatedOrderStatus(item.name),
  value: item.id,
})));
const searchOrderStatus = ref<number | undefined>(undefined);

// 新增筛选项
const searchSiteId = ref<number | null>(null);  // 场地筛选
const searchSalerId = ref<number | null>(null);  // 售后专员筛选
const searchStationId = ref<number | null>(null);  // 维修站筛选
const searchStartDate = ref<number | null>(null);  // 开始时间
const searchEndDate = ref<number | null>(null);  // 结束时间

// 场地和维修站选项
const siteOptions = ref<{ label: string; value: number }[]>([]);
const stationOptions = ref<{ label: string; value: number }[]>([]);

// 打开修改弹框
const handleOpenEdit = (row: Order) => {
  editForm.value = {
    id:row.ID,
    order_no:row.OrderNo,
    repair_method:row.RepairMethod||0,
    "logistics_cost": row.LogisticsCost||0,
    "onsite": row.Onsite||0,
    "order_status": row.OrderStatus||0,
    "payment_date": row.PaymentDate && row.PaymentDate!==""? dayjs(row.PaymentDate).format("YYYY-MM-DD"):null,
    // payment_date: row.PaymentDate && row.PaymentDate!=="" ? dayjs(row.PaymentDate).valueOf().toString() : null,
    "repair_cost": row.RepairCost||0,
    "settlement_status": row.SettlementStatus||0,
    "total_cost": row.TotalCost||0,
    "repair_station_id": row.StationID || null as number | null,
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 派单表单数据
const dispatchForm = ref({
  fault_count: 1,
  repair_method: null as null | number,
  repair_station_id: null as null | number,
  // logisticsCompany: null as null | number,
  // logisticsInfo: '',
  order_ids: [] as number[],
  remark: ''
});

// 派单弹框显示状态
const showDispatchModal = ref(false);

// 当前操作的工单
const currentOrder = ref<Order | null>(null);

// 打开派单弹框
const handleOpenDispatch = (row: Order) => {
  currentOrder.value = row;
  // 重置表单
  dispatchForm.value = {
    fault_count: row.FaultCount,
    repair_method: row.RepairMethod || null as null | number,
    repair_station_id: row.StationID || null as null | number,
    order_ids: [row.ID],
    // logisticsCompany: row.LogisticsCompanyId || null as null | number,
    // logisticsInfo: '',
    remark: ''
  };
  showDispatchModal.value = true;
};

// 批量派单处理
const handleBatchDispatch = () => {
  if (selectedOrders.value.length === 0) {
    message.warning(t('page.workflow.pleaseSelectOrderToDispatch'));
    return;
  }

  // 检查是否存在已派单的工单（StationID != 0）
  const alreadyDispatchedOrders = selectedOrders.value.filter(order => order.StationID !== 0);
  if (alreadyDispatchedOrders.length > 0) {
    message.warning(t('page.workflow.pleaseSelectUnDispatchedOrder'));
    return;
  }

  // 使用第一个选中的工单作为模板
  currentOrder.value = selectedOrders.value[0];

  // 重置表单
  dispatchForm.value = {
    fault_count: selectedOrders.value.reduce((sum, order) => sum + order.FaultCount, 0),
    repair_method: null as null | number,
    repair_station_id: null as null | number,
    order_ids: selectedOrders.value.map(order => order.ID),
    remark: t('page.workflow.batchDispatchRemark', { count: selectedOrders.value.length })
  };

  showDispatchModal.value = true;
};

// 提交派单
const handleSubmitDispatch = async () => {
  if (!currentOrder.value) return;

  if (dispatchForm.value.repair_method === null) {
    message.error(t('page.workflow.pleaseSelectRepairMethod'));
    return;
  }

  if (dispatchForm.value.repair_station_id === null) {
    message.error(t('page.workflow.pleaseSelectStation'));
    return;
  }
  try {
    // 构建提交数据
    const submitData: any = {
      // order_status: 2,
      order_ids: selectedOrders.value.length > 0 ? selectedOrders.value.map(order => order.ID) : [currentOrder.value.ID],
      fault_count: dispatchForm.value.fault_count,
      repair_method: dispatchForm.value.repair_method,
      repair_station_id: dispatchForm.value.repair_station_id,
      remark: dispatchForm.value.remark
    };

    // 判断是批量派单还是单个派单
    const ordersToDispatch = selectedOrders.value.length > 0 ? selectedOrders.value : [currentOrder.value];

    let successCount = 0;
    let failCount = 0;

    // for (const order of ordersToDispatch) {
      try {
        const res = await dispatchOrders(submitData);

        if (res.response?.data?.code == String(0)) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    // }
    if (failCount === 0) {
      message.success(t('page.workflow.dispatchSuccess', { successCount }));
    } else if (successCount === 0) {
      message.error(t('page.workflow.dispatchFail', { failCount }));
    } else {
      message.warning(t('page.workflow.dispatchPartialSuccess', { successCount, failCount }));
    }
    fetchData(); // 刷新表格
    showDispatchModal.value = false;
    checkedRowKeys.value = []; // 清空选择


  } catch (err) {
    message.error(t('page.workflow.dispatchFailed'));
  }
};

const handleGoback=async(row: Order)=>{
  // 确认退回（Naive UI 对话框）
  const confirm = await new Promise<boolean>((resolve) => {
    (window as any).$dialog?.warning({
      title: t('page.workflow.confirmReturnOrderTitle'),
      content: t('page.workflow.confirmReturnOrderContent', { orderNo: row.OrderNo }),
      positiveText: t('page.workflow.confirm'),
      negativeText: t('page.workflow.cancel'),
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false)
    });
  });
  if (!confirm) return;

  try {
    const res = await gobackOrders(row.ID, {
      order_status: 1,
      remark: t('page.workflow.userReturnOrder')
    });

    if (res.response?.data?.code == String(0)) {
      message.success(t('page.workflow.returnSuccess'));
      await fetchData(); // 刷新表格
    } else {
      message.error(t('page.workflow.returnFailed') + (res.response?.data?.msg || ''));
    }
  } catch (err) {
    message.error(t('page.workflow.returnFailed'));
  }
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateOrders(editForm.value)
    // console.log('修改提交:', editForm.value);
    // const { error } = await updateOrders(editForm.value.id, editForm.value);
    // if(error==null){
    //     message.success('修改成功！');
    //     fetchData(); // 刷新表格
    //   }else{
    //     message.error('修改失败:' +error);
    //   }

 // 调用创建工单API
    const { error, response: { data } } = await updateOrders(editForm.value.id, editForm.value);
    // console.log('创建工单响应:', data, error);
    // console.log('data.code', data?.code);
    if (error == null) {
      if (Number(data?.code) == 0) {
        message.success(t('page.workflow.modifySuccess'));
        // 刷新数据
        fetchData();
      }
    }
  } catch (err) {
    message.error(t('page.workflow.modifyFailed'));
  }finally{
    showEditModal.value = false;
  }
};

// ---------------- 表格列 ----------------
const renderHeaderTitle = (text: string) => h('span', { class: 'text-xs font-medium text-gray-500' }, text)
const columns: DataTableColumns<Order> = [
  {
    type: 'selection',
    width: 50
  },
  {
    title: () => renderHeaderTitle(t('page.workflow.orderNo')),
    key: 'OrderNo',
    width: 220,
    fixed: 'left',
    render: (row: Order) => {
      const full = row.OrderNo || '';
      const prefix = full.slice(0, 10);
      const suffix = full.slice(-5);
      const truncated = full.length > 14 ? `${prefix}...${suffix}` : full;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          message.success(t('page.workflow.copySuccess'));
        } catch (e) {
          message.error(t('page.workflow.copyFailed'));
        }
      };
      return h(
        NTooltip,
        null,
        {
          trigger: () => h(
            'div',
            {
              style: 'display:flex; align-items:center; gap:8px; max-width:220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
            },
            [
              h(
                'span',
                {
                  class: 'text-sm text-gray-500 font-medium',
                  style: 'flex:1; min-width:0; cursor: pointer;',
                  onClick: () => router.push({ name: 'workflowdetail', params: { id: row.ID } })
                },
                truncated
              ),
              h(
                NButton,
                { size: 'tiny', quaternary: true, type: 'primary', onClick: onCopy },
                { default: () => h(Icon, { icon: 'ant-design:copy-outlined', width: 16, height: 16 }) }
              )
            ]
          ),
          default: () => full
        }
      );
    }
  },
  { title: () => renderHeaderTitle(t('page.workflow.faultCount')), key: 'FaultCount', width: 200, render: (row: any ) => {
    const total = Number(row.FaultCount ?? 0)
    console.log('total', total);
    const repaired = Number(row.RepairedCount ?? 0)+Number(row.evacuated_count ?? 0)
    console.log('repaired', repaired);
    const safeTotal = total > 0 ? total : 0
    const safeRepaired = repaired > 0 ? Math.min(repaired, safeTotal || repaired) : 0
    console.log('safeRepaired', safeRepaired);
    console.log('safeTotal', safeTotal);
    const percent = safeTotal > 0 ? Math.round((safeRepaired / safeTotal) * 100) : 0;
    console.log('percent', percent);
    return h(
      'div',
      { style: 'display:flex; align-items:center; gap:10px; min-width:180px;' },
      [
        h(NProgress, {
          type: 'line',
          percentage: percent,
          indicatorPlacement: 'inside',
          status: percent >= 100 ? 'success' : undefined
        }),
        h('span', { class: 'text-xs text-gray-500', style: 'white-space: nowrap;' }, `${safeRepaired}/${safeTotal} (${percent}%)`)
      ]
    )
  }},
  { title: () => renderHeaderTitle(t('page.workflow.repairMethod')), key: 'RepairMethod',
    render: (row: any) => {
      const getTranslatedRepairMethod = (method: number | undefined | null) => {
        if (!method) return '';
        const map: Record<number, string> = {
          1: t('business.repairMethod.onsite'),
          2: t('business.repairMethod.sendRepair'),
          3: t('business.repairMethod.exchange'),
        };
        return map[method] || '';
      };

      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        1: 'success',
        2: 'primary',
        3: 'primary',
      };

      const methodLabel = getTranslatedRepairMethod(row.RepairMethod) || t('page.workflow.unknown');
      // const groupLabel = row.group_name ? ` - ${row.group_name}` : '';

      return h(NTag, { class: 'text-xs', type: tagMap[row.RepairMethod || '-'],size:'small', round:true }, () => methodLabel)
    }
  },
  { title: () => renderHeaderTitle(t('page.workflow.groupName')), key: 'group_name', width: 200, render: (row: any ) => {
    return row.group_name || '-';
  }},
  { title: () => renderHeaderTitle(t('page.workflow.orderStatus')), key: 'OrderStatusText',
      render: (row: any) => {
        const getTranslatedOrderStatus = (name: string | undefined | null) => {
          if (!name) return '';
          const map: Record<string, string> = {
            '已完成': t('page.workflow.completed'),
            '维修': t('page.workflow.repairing'),
            '未解决': t('page.workflow.unresolved'),
            '待处理': t('page.workflow.pending'),
            '处理中': t('page.workflow.processing'),
          };
          return map[name] || name;
        };

        const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        [t('page.workflow.completed')]: 'success',
        [t('page.workflow.repairing')]: 'primary',
        [t('page.workflow.unresolved')]: 'error',
        [t('page.workflow.pending')]: 'warning',
        [t('page.workflow.processing')]: 'primary',
        };
        const translatedLabel = getTranslatedOrderStatus(row.OrderStatusText) || t('page.workflow.unknown');
        return h(NTag, { class: 'text-xs', type: tagMap[translatedLabel] || 'default',size:'small', round:true }, () => translatedLabel)
      }
  },
   { title: () => renderHeaderTitle(t('page.workflow.createdAt')), key: 'CreatedAt',
      render: (row: any) => {
        if (!row.CreatedAt) {
          return '-';
        }
        return h('span', { class: 'text-sm text-gray-500' }, dayjs(row.CreatedAt).format('YYYY-MM-DD'));
      }
  },

  // { title: '总费用', key: 'RepairCost',
  //   render: (row: any ) => {
  //     if (row.RepairCost === null || row.RepairCost === undefined) {
  //       return t('page.workflow.unknown');
  //     }
  //     return row.RepairCost || t('page.workflow.unknown');
  //   }
  //  },
  ...(hasRole ? [
    { title: () => renderHeaderTitle(t('page.workflow.paymentStatus')), key: 'SettlementStatus',
      render: (row: any ) => {
        if (row.SettlementStatusText === null || row.SettlementStatusText === undefined) {
          return null;
        }

        const getTranslatedPaymentStatus = (name: string | undefined | null) => {
          if (!name) return '';
          const map: Record<string, string> = {
            '已付款': t('page.workflow.paid'),
            '未付款': t('page.workflow.unpaid'),
            '未申请': t('page.workflow.unapplied'),
          };
          return map[name] || name;
        };

        //待处理，处理中，已完成，未解决
        const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
          [t('page.workflow.paid')]: 'success',
          [t('page.workflow.unpaid')]: 'warning',
          [t('page.workflow.unapplied')]: 'default',
        };

        const translatedLabel = getTranslatedPaymentStatus(row.SettlementStatusText) || t('page.workflow.unknown');
        // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
        return h(NTag, { class: 'text-sm', type: tagMap[translatedLabel] || 'default',size:'small', round:true }, () => translatedLabel)
      }
    },
    { title: () => renderHeaderTitle(t('page.workflow.paymentDate')), key: 'PaymentDate',
      render: (row: Order) => {
        if (!row.PaymentDate || row.PaymentDate === '0001-01-01T00:00:00Z') {
          return h('span', { class: 'text-sm text-gray-500' }, '-');
        }
        return h('span', { class: 'text-sm text-gray-500' }, dayjs(row.PaymentDate).format('YYYY-MM-DD'));
      }
    },

      { title: () => renderHeaderTitle(t('page.workflow.createDate')), key: 'CreateDate',
      render: (row: Order) => {
        if (!row.CreatedAt || row.CreatedAt === '0001-01-01T00:00:00Z') {
          return h('span', { class: 'text-sm text-gray-500' }, '-');
        }
        return h('span', { class: 'text-sm text-gray-500' }, dayjs(row.CreatedAt).format('YYYY-MM-DD'));
      }
    },
  ] : []),
  { title: () => renderHeaderTitle(t('page.workflow.site')), key: 'SiteName', render: (row: any) => h('span', { class: 'text-sm text-gray-500' }, row.SiteName || '') },
    {
    title: () => renderHeaderTitle(t('page.workflow.repairer')),
    key: 'StationName',
    width: 120,
    render: (row: any) => {
      const text = row.StationName || '';
      if (!text) return h('span', { class: 'text-sm text-gray-500' }, '-');
      return h(
        NTooltip,
        null,
        {
          trigger: () => h('div', { class: 'text-sm text-gray-500', style: 'max-width:120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, text),
          default: () => text
        }
      );
    }
  },
  ...(hasRole ? [{ title: () => renderHeaderTitle(t('page.workflow.afterSalesSpecialist')), key: 'SalerName', render: (row: any) => h('span', { class: 'text-sm text-gray-500' }, row.SalerName || '') }] : []),

  // { title: '短保期开始', key: 'warranty_status_text' },
  // { title: '剩余短保期', key: 'warranty_status_text' },
  { title: () => renderHeaderTitle(t('page.workflow.operation')),
    key: 'actions',
    fixed: 'right',
    render: (row: Order) => {
      return h(ActionButtons, {
        row,
        hasRole,
        onEdit: () => handleOpenEdit(row),
        onAddLog: () => handleOpenAddLog(row),
        onDetail: () => handleOpenDetail(row),
        onDispatch: () => handleOpenDispatch(row),
        onReturn: () => handleGoback(row)
      });
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  // console.log("authStore.userInfo.roles---",authStore.userInfo.roles,authStore.userInfo.roles[0]);
  loading.value = true;
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    order_no: searchSerial.value || undefined,
    order_status: searchOrderStatus.value || undefined,
    site_id: searchSiteId.value || undefined,
    saler_id: (localStorage.getItem('onlyMySite') === 'true' ? authStore.userInfo?.user_id : searchSalerId.value) || undefined,
    station_id: searchStationId.value || undefined,
    start_date: searchStartDate.value ? dayjs(searchStartDate.value).format('YYYY-MM-DD') : undefined,
    end_date: searchEndDate.value ? dayjs(searchEndDate.value).format('YYYY-MM-DD') : undefined
  };

  try {
    const {data,error} = await fetchOrders(params);
    if(error==null){
        tableData.value = data.list;
        pagination.value.itemCount = data.pagination.total;
        pagination.value.page =  data.pagination.page;
        pagination.value.pageSize =  data.pagination.page_size;
    }else{
        message.error(t('page.workflow.loadFailed') + error);
    }
  } catch (err) {
    message.error(t('page.workflow.loadFailed') + err);
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const handleReset = () => {
  searchSerial.value = '';
  searchOrderStatus.value = undefined;
  searchSiteId.value = null;
  searchSalerId.value = null;
  searchStationId.value = null;
  searchStartDate.value = null;
  searchEndDate.value = null;
  pagination.value.page = 1;
  fetchData();
};

// 获取场地数据
const fetchSiteData = async () => {
  siteOptions.value=[];
  try {
    // 这里需要根据实际的API接口来获取场地数据
    const params: any = {
      enable_all: (hasRole===true && !(localStorage.getItem("onlyMySite")==='true'))?1:-1,
    };
    console.log("params",params)
    const { data, error } = await fetchOrdersSite(params);
    // console.log("data",data)
    if (!error && data) {
      siteOptions.value = data.map((site: any) => ({
        label: site.Name,
        value: site.ID,
      }));
    }
  } catch (err) {
    message.error(t('page.workflow.getSiteDataFailed'));
  }
};

// 获取维修站数据
const fetchStationData = async () => {
  try {
    // 这里需要根据实际的API接口来获取维修站数据
    const { data, error } = await fetchRepairStations({page:1,page_size:1000});
    if (!error && data) {
      // console.log("data",data.list)
      stationOptions.value = data.list.map((station: any) => ({
        label: station.Name,
        value: station.ID
      }));
    }
  } catch (err) {
    message.error(t('page.workflow.getStationDataFailed'));
  }
};

// ---------------- 数据获取 ----------------
const fetchOrderStatusData = async () => {
  loading.value = true;
  const params: any = {
   type:2,//订单状态
   operate_type:"list",//工单状态
  };

  try {
    const {data,error} = await fetchOrdersStatus(params);

    if(error==null){
       statusOptionsData.value = data;
    }else{
        message.error(t('page.workflow.loadFailed') + error);
    }
  } catch (err) {
    message.error(t('page.workflow.loadFailed') + err);
  } finally {
    loading.value = false;
  }
};

// ---------------- 查看详情弹框 ----------------// 详情弹框相关
const showDetailModal = ref(false);
const detailData = ref({order_no:""}); // 工单操作日志
const operation_history = ref<any[]>([]); // 工单操作日志
const selectedRow = ref<Order | null>(null);

// 添加操作日志弹框相关
const showAddLogModal = ref(false);
const handleOpenAddLog = (row: Order) => {
  selectedRow.value = row;
  showAddLogModal.value = true;
};

const handleLogSubmitted = async () => {
  showAddLogModal.value = false;
  if (selectedRow.value) {
    await fetchDetailData(selectedRow.value.ID);
  }
  await fetchData();
};
// 打开详情弹框
const handleOpenDetail = async (row: Order) => {
  selectedRow.value = row;
  showDetailModal.value = true;
  await fetchDetailData(row.ID);
};
const onlyMySite = ref<boolean>(localStorage.getItem('onlyMySite') === 'true');
watch(onlyMySite, v =>{
  localStorage.setItem('onlyMySite', v.toString());
  tableData.value = [];
  pagination.value.page = 1;
  fetchData()
  fetchSiteData()
});

// 获取工单详情（操作日志）
const fetchDetailData = async (orderId: number) => {
  try {
    const { data, error } = await fetchOrdersDetail(orderId);
    console.log("data",data)
    if (!error && data) {
      // 假设返回 data.logs 是数组 [{ time: string, action: string, operator: string }]
      detailData.value = data;
      operation_history.value = data.operation_history.sort((a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    } else {
      message.error(t('page.workflow.getOrderLogFailed'));
      detailData.value ={order_no:""}
      operation_history.value = [];
    }
  } catch (err) {
    message.error(t('page.workflow.getOrderLogException'));
    detailData.value ={order_no:""}
    operation_history.value = [];
  }
};

onMounted(() => {
  fetchData()
  fetchOrderStatusData()
  fetchSiteData()
  fetchStationData()
//   loadFaultsTypes();
});
watch([searchSerial, searchOrderStatus, searchSiteId, searchStationId, searchSalerId, searchStartDate, searchEndDate], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
});
</script>

<template>
  <div class="h-full flex gap-16px flex-col-stretch overflow-hidden lt-sm:overflow-auto">
 <!-- 第二行：筛选条件 -->
    <SearchFilters
        v-model:serial="searchSerial"
        v-model:siteId="searchSiteId"
        v-model:stationId="searchStationId"
        v-model:startDate="searchStartDate"
        v-model:endDate="searchEndDate"
        v-model:orderStatus="searchOrderStatus"
        v-model:salerId="searchSalerId"
        :siteOptions="siteOptions"
        :stationOptions="stationOptions"
        :statusOptions="statusOptions"
        :hasRole="hasRole"
        @search="fetchData"
        @reset="handleReset"
      />

    <div class="flex-1 flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 查询框和批量操作 -->
    <div class="mb-4" style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
      <!-- 第一行：批量操作按钮 -->
      <div class="flex items-center gap-2" v-if="hasRole">
        <NButton
          type="primary"
          ghost
          size="medium"
          :disabled="!isBatchDispatchEnabled"
          :class="{ 'batch-dispatch-disabled': !isBatchDispatchEnabled, 'batch-dispatch-enabled': isBatchDispatchEnabled }"
          @click="handleBatchDispatch"
        >
          {{ t('page.workflow.batchDispatch', { count: selectedOrders.length }) }}
        </NButton>
      <div>
     <NSwitch v-model:value="onlyMySite" size="medium" />
    <span style="font-size: 12px; margin-left: 4px;">{{ t('page.workflow.mySite') }}</span>
    </div>
      </div>
    </div>
    <!-- 表格 -->
    <NDataTable
      flex-height
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      :loading="loading"
      :fixed="['actions']"
      :row-key="(row: Order) => row.ID"
      v-model:checked-row-keys="checkedRowKeys"
      remote
      :scroll-x="1800"
      striped
      class="sm:h-full"
    />
    </div>

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" :title="t('page.workflow.modifyOrderInfo')">
      <NForm :model="editForm" label-width="100">
        <!-- 工单编号 -->
    <NFormItem :label="t('page.workflow.orderNo')">
      <NInput size="medium" v-model:value="editForm.order_no" disabled />
    </NFormItem>

      <NFormItem :label="t('page.workflow.repairMethod')" required>
          <NSelect
            v-model:value="editForm.repair_method"
            :options="repairMethodOptions"
            :placeholder="t('page.workflow.pleaseSelectRepairMethodPlaceholder')"
          />
      </NFormItem>

      <!-- 选择维修站 -->
        <NFormItem :label="t('page.workflow.selectStation')" required>
          <NSelect
            v-model:value="editForm.repair_station_id"
            :options="stationOptions"
            :placeholder="t('page.workflow.pleaseSelectNearestStation')"
          />
        </NFormItem>

    <NFormItem :label="t('page.workflow.paymentStatus')">
        <NSelect size="medium"
          v-model:value="editForm.settlement_status"
          :options="[{ label: t('page.workflow.unpaid'), value: 1 }, { label: t('page.workflow.paid'), value: 2 }]"
        />
      </NFormItem>

      <NFormItem :label="t('page.workflow.orderStatus')">
        <NSelect size="medium"
          v-model:value="editForm.order_status"
          :options="statusOptions"
        />
      </NFormItem>
      </NForm>
      <template #footer>
        <n-space item-style="display: flex;">
        <NButton size="medium" type="primary" @click="handleSaveEdit" style="margin-right: 8px;">{{ t('page.workflow.save') }}</NButton>
        <NButton size="medium" @click="showEditModal = false">{{ t('page.workflow.cancel') }}</NButton>
        </n-space>
      </template>
    </NModal>

    <!-- 查看详情弹框 -->
    <NModal v-model:show="showDetailModal" style="width: 600px" preset="card" :title="t('page.workflow.orderOperationLog')">
      <div v-if="operation_history.length > 0" class="detail-container">
        <h2>{{ t('page.workflow.orderNo') }}：{{ detailData?.order_no }}</h2>
        <div class="timeline">
        <div v-for="(log, index) in operation_history" :key="log.occurred_at" class="timeline-item">
          <div class="timeline-line" :class="{ 'is-first': index === 0, 'is-last': index === operation_history.length - 1 }">
            <div class="timeline-dot"></div>
          </div>
          <div class="timeline-content-wrapper">
            <div class="timeline-header">
              <div class="timeline-title">{{ log.status_text }}</div>
              <div class="timeline-time">{{ log.occurred_at }}</div>
            </div>
            <div class="timeline-body">
              <div class="timeline-description">{{ log.info }}</div>
              <div class="timeline-operator">{{ t('page.workflow.operator') }}{{ log.operator_name }}</div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <NButton @click="showDetailModal = false">{{ t('page.workflow.close') }}</NButton>
      </template>
    </NModal>

    <!-- 派单弹框 -->
    <NModal v-model:show="showDispatchModal" style="width: 600px" preset="card" :title="t('page.workflow.dispatch')">
      <NForm :model="dispatchForm" label-width="120">
        <!-- 选择故障机数量 -->
        <NFormItem :label="t('page.workflow.selectFaultCount')">
          <NInputNumber disabled v-model:value="dispatchForm.fault_count" :min="1" />
        </NFormItem>

        <!-- 是否驻场 -->
        <!-- <NFormItem label="是否驻场" required>
          <NSelect
            v-model:value="dispatchForm.onsite"
            :options="siteStationOptions"
            placeholder="请选择"
          />
        </NFormItem> -->
        <NFormItem :label="t('page.workflow.repairMethod')" required>
          <NSelect
            v-model:value="dispatchForm.repair_method"
            :options="repairMethodOptions"
            :placeholder="t('page.workflow.pleaseSelectRepairMethodPlaceholder')"
          />
        </NFormItem>

        <!-- 选择维修站 -->
        <NFormItem :label="t('page.workflow.selectStation')" required>
          <NSelect
            v-model:value="dispatchForm.repair_station_id"
            :options="stationOptions"
            :placeholder="t('page.workflow.pleaseSelectNearestStation')"
          />
        </NFormItem>
          <!-- 备注 -->
          <NFormItem :label="t('page.workflow.remark')">
            <NInput
              v-model:value="dispatchForm.remark"
              type="textarea"
              :placeholder="t('page.workflow.pleaseEnterRemark')"
            />
          </NFormItem>
      </NForm>

      <template #footer>
        <NButton type="primary" style="margin-right: 8px;" @click="handleSubmitDispatch">{{ t('page.workflow.confirmDispatch') }}</NButton>
        <NButton @click="showDispatchModal = false">{{ t('page.workflow.cancel') }}</NButton>
      </template>
    </NModal>

    <!-- 添加操作日志弹框 -->
    <AddLogModal
      v-model:show="showAddLogModal"
      :order-id="selectedRow?.ID || 0"
      :default-order-status="selectedRow?.OrderStatus ?? null"
      :status-options="statusOptions"
      @submitted="handleLogSubmitted"
    />
    </div>
</template>

<style scoped>
.detail-container {
  padding: 10px;
}

:deep(.n-base-selection .n-base-selection-placeholder){
  font-size: 12px !important;
}
:deep(.n-base-selection-overlay){
  font-size: 12px !important;
}
:deep(.n-input-wrapper){
  font-size: 12px !important;
}
:deep(.n-button){
  font-size: 12px !important;
}

.detail-container h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline-item {
  position: relative;
  display: flex;
  padding-bottom: 20px;
}

.timeline-line {
  position: absolute;
  left: 4px;
  top: 0;
  width: 2px;
  background-color: #e5e5e5;
}

.timeline-line.is-first {
  top: 10px;
}

.timeline-line.is-last {
  height: 10px;
}

.timeline-line:not(.is-first):not(.is-last) {
  height: 100%;
}

.timeline-dot {
  position: absolute;
  left: -4px;
  top: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #1890ff;
  border: 2px solid #fff;
}

.timeline-item:first-child .timeline-dot {
  background-color: #52c41a;
}

.timeline-content-wrapper {
  flex: 1;
  padding-left: 20px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 16px;
  font-weight: bold;
}

.timeline-time {
  font-size: 12px;
  color: #999;
}

.timeline-body {
  background-color: #f7f7f7;
  padding: 10px;
  border-radius: 4px;
}

.timeline-description {
  margin-bottom: 8px;
}

.timeline-operator {
  font-size: 12px;
  color: #666;
}

/* 批量派单按钮样式 */
.batch-dispatch-disabled {
  background-color: #d9d9d9 !important;
  border-color: #d9d9d9 !important;
  color: #999 !important;
  cursor: not-allowed !important;
}

.batch-dispatch-enabled {
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #fff !important;
  cursor: pointer !important;
  transition: all 0.3s ease;
}

.batch-dispatch-enabled:hover {
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
}
</style>
