<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  SlidersHorizontal,
  Palette,
  Database,
  Move,
  RotateCw,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Layers,
  Activity,
  Check,
  Zap,
  BookmarkPlus,
  ExternalLink,
  Navigation,
  Lock,
  Trash2,
  Copy,
  Workflow,
  ToggleRight,
  CircleDot,
  Binary,
  Search,
  Cpu,
  Radio,
  Sliders,
  HelpCircle,
  BarChart2,
  FileCode,
  CheckCircle2,
  ShieldCheck,
  Info,
  Type,
  X,
  Crosshair,
  LocateFixed,
  Link2,
  Unlink,
  AlertTriangle,
  TrendingUp,
  ListPlus,
  Gauge,
  Clock
} from 'lucide-vue-next';
import { ScreenComponent, ScreenConfig, DatasetItem, ScreenItem, ScadaDeviceItem } from '../types';

interface Props {
  component: ScreenComponent | null;
  selectedComponents?: ScreenComponent[];
  screen: ScreenConfig;
  datasets: DatasetItem[];
  screens?: ScreenItem[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedComponents: () => [],
  screens: () => []
});

const emit = defineEmits<{
  (e: 'update:component', comp: ScreenComponent): void;
  (e: 'update:components', comps: ScreenComponent[]): void;
  (e: 'update:screen', screen: ScreenConfig): void;
  (e: 'align:component', type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v'): void;
  (e: 'save:symbol', comps: ScreenComponent[]): void;
  (e: 'delete', ids: string[]): void;
  (e: 'open:batch:points'): void;
  (e: 'open:control', deviceId: string): void;
  (e: 'close'): void;
}>();

const activeTab = ref<'geometry' | 'style' | 'data' | 'interaction'>('geometry');

// SCADA Hierarchical Data Binding State
const dataBindingSource = ref<'scada' | 'static'>('scada');
const selectedDeviceId = ref<string>('DEV-101');
const selectedTeleCategory = ref<'yc' | 'yx' | 'dd' | 'yk' | 'yt'>('yc');
const pointSearchQuery = ref<string>('');
const staticJsonInput = ref<string>('');
const staticJsonMsg = ref<string>('');

const themeColors = [
  '#00f2ff', // Cyber Cyan
  '#3b82f6', // Electric Blue
  '#00e5a3', // Tech Emerald
  '#f59e0b', // Industrial Amber
  '#ef4444', // Crimson Alert
  '#a855f7', // Cyber Purple
  '#ffffff', // Clean White
  '#1e293b', // Deep Slate
];

const boundDataset = computed(() => {
  if (!props.component?.data?.datasetId) {
    return props.datasets[0] || null;
  }
  return props.datasets.find(d => d.id === props.component?.data?.datasetId) || props.datasets[0] || null;
});

// Extract devices from the active dataset
const currentDatasetDevices = computed<ScadaDeviceItem[]>(() => {
  const ds = boundDataset.value;
  if (!ds) return [];
  if (Array.isArray(ds.devices) && ds.devices.length > 0) {
    return ds.devices;
  }
  // Fallback check in data.devices
  if (ds.data && Array.isArray((ds.data as any).devices)) {
    return (ds.data as any).devices;
  }
  return [];
});

// Currently selected device in the picker
const selectedDevice = computed<ScadaDeviceItem | undefined>(() => {
  return currentDatasetDevices.value.find(d => d.deviceId === selectedDeviceId.value) || currentDatasetDevices.value[0];
});

// Filtered points under current device and category
const filteredPoints = computed(() => {
  const dev = selectedDevice.value;
  if (!dev) return [];
  let list: any[] = [];
  if (selectedTeleCategory.value === 'yc') {
    list = dev.telemetries || [];
  } else if (selectedTeleCategory.value === 'yx') {
    list = dev.teleSignals || [];
  } else if (selectedTeleCategory.value === 'dd') {
    list = dev.energies || [];
  } else if (selectedTeleCategory.value === 'yk') {
    list = dev.teleControls || [];
  } else if (selectedTeleCategory.value === 'yt') {
    list = dev.teleRegulations || [];
  }

  if (!pointSearchQuery.value.trim()) return list;
  const q = pointSearchQuery.value.toLowerCase().trim();
  return list.filter(item => 
    String(item.pointId).includes(q) || 
    (item.name && item.name.toLowerCase().includes(q)) ||
    (item.description && item.description.toLowerCase().includes(q))
  );
});

// Component type checks
const isChartComponent = computed(() => {
  if (!props.component) return false;
  return ['chart-line', 'chart-bar', 'chart-pie', 'chart-gauge', 'chart-radar', 'gauge-dashboard', 'tank-level'].includes(props.component.type);
});

const isElectricalSwitch = computed(() => {
  if (!props.component) return false;
  return ['elec-breaker', 'elec-disconnector', 'elec-grounding', 'elec-handcart', 'ctrl-indicator'].includes(props.component.type);
});

// SCADA Full Binding Details Inspector
const currentBindingDetails = computed(() => {
  const comp = props.component;
  if (!comp || !comp.data) {
    return {
      isBound: false,
      category: 'none' as const,
      categoryLabel: '未指定',
      categoryBadgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      isControl: false,
      isRegulation: false,
      currentDisplayValue: '--',
      pointKey: '',
      pointName: '未绑定',
      deviceName: '未选择装置'
    };
  }

  const mapping = comp.data.mapping || {};
  const action = comp.data.action;
  
  let devId = mapping.deviceId || action?.deviceId;
  let rawKey = mapping.valueKey || mapping.stateKey || mapping.statusKey || '';
  
  if (!devId && rawKey) {
    const match = rawKey.match(/^([A-Za-z0-9_-]+)_(YC|YX|DD|YK|YT)_/);
    if (match) devId = match[1];
  }
  
  const dev = currentDatasetDevices.value.find(d => d.deviceId === devId) || 
    (devId ? { deviceId: devId, deviceName: mapping.deviceName || `装置 [${devId}]`, telemetries: [], teleSignals: [], energies: [], teleControls: [], teleRegulations: [] } as any : undefined);

  let category: 'yc' | 'yx' | 'dd' | 'yk' | 'yt' | 'none' = 'none';
  let isControl = false;
  let isRegulation = false;

  if (mapping.pointCategory === 'teleControl' || action?.type === 'tele-control' || mapping.ykPointId || rawKey.includes('_YK_')) {
    category = 'yk';
    isControl = true;
  } else if (mapping.pointCategory === 'teleRegulation' || action?.type === 'tele-regulation' || mapping.ytPointId || rawKey.includes('_YT_')) {
    category = 'yt';
    isRegulation = true;
  } else if (mapping.pointCategory === 'teleSignal' || rawKey.includes('_YX_') || mapping.stateKey || isElectricalSwitch.value) {
    category = 'yx';
  } else if (mapping.pointCategory === 'energy' || rawKey.includes('_DD_')) {
    category = 'dd';
  } else if (mapping.pointCategory === 'telemetry' || rawKey.includes('_YC_') || mapping.valueKey) {
    category = 'yc';
  }

  let pointId: any = undefined;
  if (category === 'yk') {
    pointId = mapping.ykPointId || action?.pointId || mapping.pointId;
  } else if (category === 'yt') {
    pointId = mapping.ytPointId || action?.pointId || mapping.pointId;
  } else {
    pointId = mapping.pointId;
  }
  if (pointId === undefined && rawKey) {
    const m = rawKey.match(/_(?:YC|YX|DD|YK|YT)_(\d+)/i);
    if (m) pointId = Number(m[1]);
  }

  const isBound = !!(devId && pointId !== undefined);

  let pointEntity: any = null;
  let verificationInfo: any = null;
  let currentDisplayValue: any = '--';
  let unit = '';
  let statusText = '';

  if (dev) {
    if (category === 'yk') {
      pointEntity = dev.teleControls?.find((c: any) => String(c.pointId) === String(pointId)) || dev.teleControls?.[0];
      const targetYxId = action?.targetPointId || mapping.targetYxPointId || pointEntity?.targetPointId || 1;
      const targetYx = dev.teleSignals?.find((s: any) => String(s.pointId) === String(targetYxId));
      if (targetYx) {
        statusText = targetYx.statusText || (targetYx.value === 1 ? '合闸 (1)' : '分闸 (0)');
        currentDisplayValue = statusText;
        verificationInfo = {
          type: 'yx',
          typeLabel: '闭环校验遥信 (YX)',
          pointId: targetYxId,
          pointName: targetYx.name,
          currentValue: targetYx.value,
          statusText: targetYx.statusText || (targetYx.value === 1 ? '合闸运行' : '分闸停止')
        };
      } else {
        currentDisplayValue = '未配置校验遥信';
      }
    } else if (category === 'yt') {
      pointEntity = dev.teleRegulations?.find((r: any) => String(r.pointId) === String(pointId)) || dev.teleRegulations?.[0];
      const targetYcId = action?.targetPointId || mapping.targetYcPointId || pointEntity?.targetYcPointId || 1;
      const targetYc = dev.telemetries?.find((m: any) => String(m.pointId) === String(targetYcId));
      if (targetYc) {
        unit = targetYc.unit || pointEntity?.unit || '';
        currentDisplayValue = `${targetYc.value} ${unit}`;
        verificationInfo = {
          type: 'yc',
          typeLabel: '闭环校验遥测 (YC)',
          pointId: targetYcId,
          pointName: targetYc.name,
          currentValue: targetYc.value,
          unit: targetYc.unit
        };
      } else {
        currentDisplayValue = '未配置校验遥测';
      }
    } else if (category === 'yx') {
      pointEntity = dev.teleSignals?.find((s: any) => String(s.pointId) === String(pointId));
      if (pointEntity) {
        statusText = pointEntity.statusText || (pointEntity.value === 1 ? '合闸 (1)' : '分闸 (0)');
        currentDisplayValue = statusText;
      }
    } else if (category === 'dd') {
      pointEntity = dev.energies?.find((e: any) => String(e.pointId) === String(pointId));
      if (pointEntity) {
        unit = pointEntity.unit || 'kWh';
        currentDisplayValue = `${pointEntity.value} ${unit}`;
      }
    } else if (category === 'yc') {
      pointEntity = dev.telemetries?.find((m: any) => String(m.pointId) === String(pointId));
      if (pointEntity) {
        unit = pointEntity.unit || '';
        currentDisplayValue = `${pointEntity.value} ${unit}`;
      }
    }
  }

  const categoryLabelMap = {
    yc: '遥测 YC (模拟量)',
    yx: '遥信 YX (状态量)',
    dd: '电度 DD (电能量)',
    yk: '遥控 YK (控制输出)',
    yt: '遥调 YT (定值输出)',
    none: '未指定'
  };

  const categoryColorMap = {
    yc: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    yx: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dd: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    yk: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    yt: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    none: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  return {
    isBound,
    deviceId: dev?.deviceId || devId,
    deviceName: dev?.deviceName || mapping.deviceName || (devId ? `装置 ${devId}` : '未指定装置'),
    device: dev,
    category,
    categoryLabel: categoryLabelMap[category],
    categoryBadgeColor: categoryColorMap[category],
    pointId,
    pointName: pointEntity?.name || mapping.pointName || (pointId ? `测点 #${pointId}` : '未指定点名'),
    pointKey: rawKey || (devId && pointId ? `${devId}_${category.toUpperCase()}_${pointId}` : ''),
    currentDisplayValue,
    unit,
    statusText,
    isControl,
    isRegulation,
    verificationPoint: verificationInfo
  };
});

// Helper functions for reading verification values in the point table
const getTargetYxStatusText = (targetYxId: number | string) => {
  const dev = selectedDevice.value;
  if (!dev || !dev.teleSignals) return '无遥信';
  const yx = dev.teleSignals.find(s => String(s.pointId) === String(targetYxId));
  if (!yx) return `未找到 [YX_${targetYxId}]`;
  return `${yx.statusText || (yx.value === 1 ? '合闸' : '分闸')} (${yx.value})`;
};

const getTargetYcValueText = (targetYcId: number | string) => {
  const dev = selectedDevice.value;
  if (!dev || !dev.telemetries) return '无遥测';
  const yc = dev.telemetries.find(m => String(m.pointId) === String(targetYcId));
  if (!yc) return `未找到 [YC_${targetYcId}]`;
  return `${yc.value} ${yc.unit || ''}`;
};

// Locate point in table & smooth scroll
const scrollToPointInTable = (pointId?: number | string) => {
  if (!pointId) return;
  pointSearchQuery.value = '';
  nextTick(() => {
    const el = document.getElementById(`scada-point-row-${pointId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-cyan-400', 'bg-cyan-950/80');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-950/80');
      }, 2500);
    }
  });
};

const handleLocateBoundPoint = () => {
  const details = currentBindingDetails.value;
  if (!details.isBound) return;
  if (details.deviceId && currentDatasetDevices.value.some(d => d.deviceId === details.deviceId)) {
    selectedDeviceId.value = details.deviceId;
  }
  if (details.category && details.category !== 'none') {
    selectedTeleCategory.value = details.category as any;
  }
  scrollToPointInTable(details.pointId);
};

// Automatic reverse synchronization when component changes
const syncCurrentComponentMapping = (autoScroll = false) => {
  if (!props.component) return;
  const details = currentBindingDetails.value;
  if (details.isBound) {
    if (details.deviceId && currentDatasetDevices.value.some(d => d.deviceId === details.deviceId)) {
      selectedDeviceId.value = details.deviceId;
    }
    if (details.category && details.category !== 'none') {
      selectedTeleCategory.value = details.category as any;
    }
    if (autoScroll && details.pointId) {
      scrollToPointInTable(details.pointId);
    }
  } else {
    // 智能默认
    if (isElectricalSwitch.value) {
      selectedTeleCategory.value = 'yx';
    } else if (props.component.type === 'ctrl-button') {
      selectedTeleCategory.value = 'yk';
    } else if (props.component.category === 'metrics') {
      selectedTeleCategory.value = 'yc';
    }
  }
};

watch(
  () => props.component?.id,
  (newId) => {
    if (newId) {
      syncCurrentComponentMapping(activeTab.value === 'data');
    }
  },
  { immediate: true }
);

watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'data') {
      syncCurrentComponentMapping(true);
    }
  }
);

// Direct Smart Point Binding Action (严格遵循 SCADA 规范：遥控遥调本身无采样值，状态来自校验点)
const handleBindPointToComponent = (point: any) => {
  if (!props.component) return;
  const dev = selectedDevice.value;
  if (!dev) return;

  const datasetId = boundDataset.value?.id || 'ds-substation-scada';
  const cat = selectedTeleCategory.value;
  let pointKey = '';
  let pointCat: any = 'telemetry';

  if (cat === 'yc') {
    pointKey = `${dev.deviceId}_YC_${point.pointId}`;
    pointCat = 'telemetry';
  } else if (cat === 'yx') {
    pointKey = `${dev.deviceId}_YX_${point.pointId}`;
    pointCat = 'teleSignal';
  } else if (cat === 'dd') {
    pointKey = `${dev.deviceId}_DD_${point.pointId}`;
    pointCat = 'energy';
  } else if (cat === 'yk') {
    pointKey = `${dev.deviceId}_YK_${point.pointId}`;
    pointCat = 'teleControl';
  } else if (cat === 'yt') {
    pointKey = `${dev.deviceId}_YT_${point.pointId}`;
    pointCat = 'teleRegulation';
  }

  const mappingUpdates: Record<string, any> = {
    deviceId: dev.deviceId,
    pointCategory: pointCat,
    pointId: point.pointId,
    deviceName: dev.deviceName,
    pointName: point.name,
    valueKey: pointKey
  };

  // 1. 遥信/开关类图元自动映射状态键
  if (isElectricalSwitch.value || cat === 'yx') {
    mappingUpdates.stateKey = pointKey;
    mappingUpdates.statusKey = pointKey;
    mappingUpdates.valueKey = pointKey;
  }

  // 2. 遥控/遥调类图元：遥控遥调本身无采样值，画面状态和显示数值严格取校验点
  let newAction = props.component.data?.action;
  if (cat === 'yk') {
    const defaultYxId = point.targetPointId !== undefined ? point.targetPointId : (dev.teleSignals?.[0]?.pointId ?? 1);
    newAction = {
      type: 'tele-control',
      deviceId: dev.deviceId,
      pointId: point.pointId,
      targetPointId: defaultYxId,
      verifyType: 'yx',
      autoSyncState: true
    };
    // 严谨 SCADA 规范：图元状态直接取闭环校验遥信
    mappingUpdates.stateKey = `${dev.deviceId}_YX_${defaultYxId}`;
    mappingUpdates.statusKey = `${dev.deviceId}_YX_${defaultYxId}`;
    mappingUpdates.valueKey = `${dev.deviceId}_YX_${defaultYxId}`;
    mappingUpdates.ykPointId = point.pointId;
    mappingUpdates.targetYxPointId = defaultYxId;
  } else if (cat === 'yt') {
    const defaultYcId = point.targetYcPointId !== undefined ? point.targetYcPointId : (dev.telemetries?.[0]?.pointId ?? 1);
    newAction = {
      type: 'tele-regulation',
      deviceId: dev.deviceId,
      pointId: point.pointId,
      targetPointId: defaultYcId,
      verifyType: 'yc',
      autoSyncState: true
    };
    // 严谨 SCADA 规范：图元实测读数直接取闭环校验遥测
    mappingUpdates.valueKey = `${dev.deviceId}_YC_${defaultYcId}`;
    mappingUpdates.ytPointId = point.pointId;
    mappingUpdates.targetYcPointId = defaultYcId;
  }

  if (point.unit) {
    mappingUpdates.unitKey = `${pointKey}_unit`;
  }

  updateComponentData({
    datasetId,
    useStatic: false,
    mapping: {
      ...props.component.data.mapping,
      ...mappingUpdates
    },
    action: newAction
  });
};

// Set Verification Point for YK / YT (切换校验点时同步刷新图元的数据显示源)
const handleSetVerificationPoint = (verifyPointId: number | string) => {
  if (!props.component) return;
  const action = props.component.data?.action;
  const devId = action?.deviceId || props.component.data.mapping?.deviceId || selectedDevice.value?.deviceId || 'DEV-101';
  
  if (selectedTeleCategory.value === 'yk' || action?.type === 'tele-control') {
    updateComponentData({
      mapping: {
        ...props.component.data.mapping,
        targetYxPointId: verifyPointId,
        stateKey: `${devId}_YX_${verifyPointId}`,
        statusKey: `${devId}_YX_${verifyPointId}`,
        valueKey: `${devId}_YX_${verifyPointId}`
      },
      action: {
        ...(action || { type: 'tele-control', deviceId: devId, pointId: props.component.data.mapping?.ykPointId || 1 }),
        type: 'tele-control',
        deviceId: devId,
        targetPointId: verifyPointId,
        verifyType: 'yx',
        autoSyncState: true
      }
    });
  } else if (selectedTeleCategory.value === 'yt' || action?.type === 'tele-regulation') {
    updateComponentData({
      mapping: {
        ...props.component.data.mapping,
        targetYcPointId: verifyPointId,
        valueKey: `${devId}_YC_${verifyPointId}`
      },
      action: {
        ...(action || { type: 'tele-regulation', deviceId: devId, pointId: props.component.data.mapping?.ytPointId || 1 }),
        type: 'tele-regulation',
        deviceId: devId,
        targetPointId: verifyPointId,
        verifyType: 'yc',
        autoSyncState: true
      }
    });
  }
};

// Quick Unbind Point
const handleUnbindPoint = () => {
  if (!props.component) return;
  updateComponentData({
    useStatic: false,
    mapping: {},
    action: undefined
  });
};

// Chart Preset & Standard Template Binding Helpers
const handleBindChartPreset = (presetType: 'power-trend' | 'voltage-trend' | 'load-bar') => {
  if (!props.component) return;
  const datasetId = boundDataset.value?.id || 'ds-substation-scada';

  if (presetType === 'power-trend') {
    updateComponentData({
      datasetId,
      useStatic: false,
      mapping: {
        ...props.component.data.mapping,
        categoriesKey: 'series_time',
        seriesKey: 'series_power'
      }
    });
  } else if (presetType === 'voltage-trend') {
    updateComponentData({
      datasetId,
      useStatic: false,
      mapping: {
        ...props.component.data.mapping,
        categoriesKey: 'series_time',
        seriesKey: 'series_voltage'
      }
    });
  } else if (presetType === 'load-bar') {
    updateComponentData({
      datasetId,
      useStatic: false,
      mapping: {
        ...props.component.data.mapping,
        categoriesKey: 'series_device_names',
        seriesKey: 'series_device_load'
      }
    });
  }
};

// Big Screen Standard Formatted Template Injection
const handleApplyStandardTemplate = (templateType: 'timeseries-power' | 'multiseries-voltage' | 'bar-efficiency' | 'pie-energy-mix' | 'radar-health' | 'alarm-events') => {
  if (!props.component) return;

  if (templateType === 'timeseries-power') {
    const data = {
      categories: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      series: [
        { name: '10kV #1进线负荷', data: [42.5, 38.2, 51.0, 78.6, 92.4, 88.0, 95.2, 64.1], color: '#00f2ff', unit: 'kW' },
        { name: '10kV #2进线负荷', data: [31.0, 29.5, 40.2, 65.4, 81.0, 76.5, 83.2, 52.0], color: '#3b82f6', unit: 'kW' }
      ],
      unit: 'kW'
    };
    updateComponentData({ useStatic: true, staticData: data });
    staticJsonInput.value = JSON.stringify(data, null, 2);
  } else if (templateType === 'multiseries-voltage') {
    const data = {
      categories: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      series: [
        { name: 'A相母线电压 Ua', data: [10.22, 10.18, 10.25, 10.30, 10.20, 10.15, 10.28], color: '#f59e0b', unit: 'kV' },
        { name: 'B相母线电压 Ub', data: [10.20, 10.15, 10.22, 10.28, 10.18, 10.12, 10.25], color: '#00e5a3', unit: 'kV' },
        { name: 'C相母线电压 Uc', data: [10.25, 10.20, 10.27, 10.32, 10.23, 10.18, 10.30], color: '#ef4444', unit: 'kV' }
      ],
      unit: 'kV'
    };
    updateComponentData({ useStatic: true, staticData: data });
    staticJsonInput.value = JSON.stringify(data, null, 2);
  } else if (templateType === 'bar-efficiency') {
    const data = {
      categories: ['1#变压器', '2#变压器', '无功补偿柜', '储能舱A', '光伏逆变器', '柴发备用'],
      series: [
        { name: '当前负荷率', data: [85.4, 72.1, 91.5, 64.0, 78.8, 12.0], color: '#00f2ff', unit: '%' }
      ],
      unit: '%'
    };
    updateComponentData({ useStatic: true, staticData: data });
    staticJsonInput.value = JSON.stringify(data, null, 2);
  } else if (templateType === 'pie-energy-mix') {
    const data = [
      { name: '市网主供电', value: 58.5, color: '#00f2ff' },
      { name: '屋顶光伏发电', value: 24.2, color: '#00e5a3' },
      { name: '储能削峰放电', value: 12.8, color: '#3b82f6' },
      { name: '柴油备用应急', value: 4.5, color: '#f59e0b' }
    ];
    updateComponentData({ useStatic: true, staticData: data });
    staticJsonInput.value = JSON.stringify(data, null, 2);
  } else if (templateType === 'radar-health') {
    const data = {
      indicators: [
        { name: '绝缘裕度', max: 100 },
        { name: '温升受控', max: 100 },
        { name: '触头寿命', max: 100 },
        { name: '局放抑制', max: 100 },
        { name: '气压稳定', max: 100 },
        { name: '分合机构', max: 100 }
      ],
      series: [
        { name: '#1主变健康度', data: [94, 88, 92, 96, 90, 85], color: '#00f2ff' },
        { name: '全站平均基准', data: [85, 80, 85, 88, 82, 80], color: '#3b82f6' }
      ]
    };
    updateComponentData({ useStatic: true, staticData: data });
    staticJsonInput.value = JSON.stringify(data, null, 2);
  } else if (templateType === 'alarm-events') {
    const data = [
      { id: 'ALM-101', level: 'CRITICAL', title: '10kV 101开关 过流II段速断动作跳闸', time: '14:23:05', device: '10kV配电主进线柜', value: '1450A (整定值: 1200A)' },
      { id: 'ALM-102', level: 'WARNING', title: '1#主变压器 B相绕组高温预警', time: '14:18:42', device: '1#主变压器', value: '88.5℃ (警戒线: 85℃)' },
      { id: 'ALM-103', level: 'WARNING', title: '10kV 母线A相瞬时电压低跌', time: '14:02:11', device: '10kV一段母线', value: '9.42kV (额定: 10.0kV)' },
      { id: 'ALM-104', level: 'INFO', title: '储能电池舱 #1 启动削峰放电循环', time: '13:55:00', device: '储能BMS测控系统', value: '放电功率 250kW' },
      { id: 'ALM-105', level: 'INFO', title: '防孤岛保护装置自检通讯恢复正常', time: '13:40:19', device: '光伏防孤岛保护屏', value: '链路心跳 12ms' }
    ];
    updateComponentData({ useStatic: true, staticData: data });
    staticJsonInput.value = JSON.stringify(data, null, 2);
  }

  staticJsonMsg.value = '✓ 已填充标准大屏数据格式规范';
  setTimeout(() => { staticJsonMsg.value = ''; }, 3500);
};

// Apply Static JSON
const handleApplyStaticData = () => {
  if (!props.component) return;
  try {
    const parsed = JSON.parse(staticJsonInput.value || '{}');
    updateComponentData({
      useStatic: true,
      staticData: parsed
    });
    staticJsonMsg.value = '✓ 静态数据已生效';
    setTimeout(() => { staticJsonMsg.value = ''; }, 3000);
  } catch (err: any) {
    staticJsonMsg.value = '❌ JSON 格式错误: ' + err.message;
  }
};

// Update component helper
const updateComponentProps = (updates: Partial<ScreenComponent>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    ...updates
  });
};

const updateComponentStyle = (styleUpdates: Partial<ScreenComponent['style']>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    style: {
      ...props.component.style,
      ...styleUpdates
    }
  });
};

const updateComponentCustomProps = (customPropsUpdates: Record<string, any>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    customProps: {
      ...(props.component.customProps || {}),
      ...customPropsUpdates
    }
  });
};

const handleTextTitleChange = (newVal: string) => {
  if (!props.component) return;
  if (props.component.type === 'ctrl-button') {
    updateComponentStyle({ buttonText: newVal });
  } else if (['metric-clock', 'metric-time-banner', 'metric-clock-analog', 'metric-countdown', 'nav-tabs'].includes(props.component.type)) {
    updateComponentCustomProps({ title: newVal });
  } else {
    updateComponentProps({ name: newVal });
    updateComponentStyle({ text: newVal });
  }
};

const updateComponentData = (dataUpdates: Partial<ScreenComponent['data']>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    data: {
      ...props.component.data,
      ...dataUpdates,
      mapping: {
        ...props.component.data.mapping,
        ...(dataUpdates.mapping || {})
      }
    }
  });
};

const updateComponentAction = (actionUpdates: Record<string, any>) => {
  if (!props.component) return;
  const currentAction = props.component.data.action || { type: 'none' };
  emit('update:component', {
    ...props.component,
    data: {
      ...props.component.data,
      action: {
        ...currentAction,
        ...actionUpdates
      }
    }
  });
};

// Batch Lock/Unlock
const toggleBatchLock = () => {
  const anyLocked = props.selectedComponents.some(c => c.locked);
  const updated = props.selectedComponents.map(c => ({
    ...c,
    locked: !anyLocked
  }));
  emit('update:components', updated);
};
</script>

<template>
  <aside class="w-80 h-full bg-[#070c18] border-l border-cyan-500/25 flex flex-col select-none z-30 shadow-xl overflow-hidden font-sans">
    <!-- Header -->
    <div class="p-3 border-b border-cyan-500/20 bg-[#040813]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 font-mono font-bold text-xs text-cyan-200">
          <SlidersHorizontal class="w-3.5 h-3.5 text-cyan-400" />
          <span v-if="selectedComponents.length > 1">多选元件配置 ({{ selectedComponents.length }})</span>
          <span v-else-if="component">组件属性配置</span>
          <span v-else>属性配置面板</span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            v-if="selectedComponents.length > 0"
            @click="emit('save:symbol', selectedComponents.length > 0 ? selectedComponents : (component ? [component] : []))"
            class="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 text-[10px] font-mono cursor-pointer transition-colors shadow-sm"
            title="将选中图元封装为多态自定义图元"
          >
            <BookmarkPlus class="w-3.5 h-3.5 text-emerald-400" />
            <span>存为图元</span>
          </button>
          
          <button
            @click="emit('close')"
            class="p-1 rounded bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 cursor-pointer transition-colors"
            title="关闭属性面板"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 1. MULTI-SELECTION BATCH INSPECTOR ================= -->
    <template v-if="selectedComponents.length > 1">
      <div class="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs custom-scrollbar">
        <div class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
          <div class="text-cyan-300 font-bold flex items-center justify-between">
            <span>已多选 {{ selectedComponents.length }} 个元件</span>
            <span class="text-[10px] text-slate-400">批量编辑</span>
          </div>
          <div class="text-[10px] text-slate-400">
            按住 Shift 点击元件或在画布拉框可进行增减选择。
          </div>
        </div>

        <!-- Batch Alignment Tools -->
        <div class="space-y-2">
          <label class="text-[11px] text-slate-300 font-bold block">多选对齐与等间距分布</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button @click="emit('align:component', 'left')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="左对齐">
              <AlignLeft class="w-3.5 h-3.5" />
              <span class="text-[10px]">左对齐</span>
            </button>
            <button @click="emit('align:component', 'center')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="水平居中">
              <AlignCenter class="w-3.5 h-3.5" />
              <span class="text-[10px]">水平居中</span>
            </button>
            <button @click="emit('align:component', 'right')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="右对齐">
              <AlignRight class="w-3.5 h-3.5" />
              <span class="text-[10px]">右对齐</span>
            </button>
            <button @click="emit('align:component', 'distribute-h')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="水平等间距分布">
              <AlignHorizontalSpaceAround class="w-3.5 h-3.5" />
              <span class="text-[10px]">水平均布</span>
            </button>

            <button @click="emit('align:component', 'top')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="顶对齐">
              <AlignVerticalSpaceAround class="w-3.5 h-3.5 rotate-90" />
              <span class="text-[10px]">顶对齐</span>
            </button>
            <button @click="emit('align:component', 'middle')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="垂直居中">
              <AlignHorizontalSpaceAround class="w-3.5 h-3.5" />
              <span class="text-[10px]">垂直居中</span>
            </button>
            <button @click="emit('align:component', 'bottom')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="底对齐">
              <AlignVerticalSpaceAround class="w-3.5 h-3.5 -rotate-90" />
              <span class="text-[10px]">底对齐</span>
            </button>
            <button @click="emit('align:component', 'distribute-v')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="垂直等间距分布">
              <AlignVerticalSpaceAround class="w-3.5 h-3.5" />
              <span class="text-[10px]">垂直均布</span>
            </button>
          </div>
        </div>

        <!-- Batch Operations -->
        <div class="space-y-2 pt-2 border-t border-slate-800">
          <label class="text-[11px] text-slate-300 font-bold block">批量操作</label>
          <div class="space-y-2">
            <button
              @click="emit('save:symbol', selectedComponents)"
              class="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <BookmarkPlus class="w-4 h-4" />
              <span>📦 设为自定义图元 (支持多状态)</span>
            </button>

            <button
              @click="toggleBatchLock"
              class="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Lock class="w-3.5 h-3.5" />
              <span>批量锁定 / 解锁</span>
            </button>

            <button
              @click="emit('delete', selectedComponents.map(c => c.id))"
              class="w-full py-2 px-3 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>批量删除选中元件 (Del)</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 2. SINGLE COMPONENT INSPECTOR VIEW ================= -->
    <template v-else-if="component">
      <!-- Tabs Selector -->
      <div class="flex items-center border-b border-slate-800 bg-[#050914] px-1">
        <button
          @click="activeTab = 'geometry'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'geometry' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Move class="w-3.5 h-3.5" />
          <span>几何</span>
        </button>
        <button
          @click="activeTab = 'style'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'style' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Palette class="w-3.5 h-3.5" />
          <span>样式</span>
        </button>
        <button
          @click="activeTab = 'data'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'data' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Database class="w-3.5 h-3.5" />
          <span>数据</span>
        </button>
        <button
          @click="activeTab = 'interaction'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'interaction' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Navigation class="w-3.5 h-3.5" />
          <span>交互跳转</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs font-mono">
        
        <!-- MULTI-STATE SELECTOR (For Custom Symbols with States) -->
        <div v-if="component.states && component.states.length > 0" class="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/50 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span class="flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span>当前呈现状态 (Active State)</span>
            </span>
            <span class="text-[10px] text-slate-400">共 {{ component.states.length }} 个状态</span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button
              v-for="st in component.states"
              :key="st.id"
              @click="updateComponentProps({ activeState: st.id })"
              class="py-1.5 px-2 rounded-lg text-xs font-mono cursor-pointer border transition-all truncate text-left flex items-center justify-between gap-1"
              :class="String(component.activeState ?? '1') === String(st.id)
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-500/40'"
            >
              <span class="truncate">{{ st.name }}</span>
              <span class="text-[9px] px-1 rounded font-bold" :class="String(component.activeState ?? '1') === String(st.id) ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'">
                ={{ st.matchValue ?? st.id }}
              </span>
            </button>
          </div>
        </div>

        <!-- TAB 1: GEOMETRY & ALIGNMENT -->
        <div v-if="activeTab === 'geometry'" class="space-y-4">
          <!-- Component Name -->
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">组件标识名称</label>
            <input
              :value="component.name"
              @input="updateComponentProps({ name: ($event.target as HTMLInputElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
            />
          </div>

          <!-- Position (X, Y) -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">X 坐标 (px)</label>
              <input
                type="number"
                :value="Math.round(component.x)"
                @input="updateComponentProps({ x: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">Y 坐标 (px)</label>
              <input
                type="number"
                :value="Math.round(component.y)"
                @input="updateComponentProps({ y: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Size (Width, Height) -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">宽度 (px)</label>
              <input
                type="number"
                min="6"
                :value="Math.round(component.width)"
                @input="updateComponentProps({ width: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">高度 (px)</label>
              <input
                type="number"
                min="4"
                :value="Math.round(component.height)"
                @input="updateComponentProps({ height: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Rotation & Z-Index -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">旋转角度 (°)</label>
              <div class="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="360"
                  :value="component.rotation || 0"
                  @input="updateComponentProps({ rotation: Number(($event.target as HTMLInputElement).value) })"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
                />
                <button
                  @click="updateComponentProps({ rotation: ((component.rotation || 0) + 90) % 360 })"
                  class="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer"
                  title="顺时针旋转90°"
                >
                  <RotateCw class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">图层层级 (zIndex)</label>
              <input
                type="number"
                min="0"
                max="1000"
                :value="component.zIndex || 1"
                @input="updateComponentProps({ zIndex: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Quick Alignment Tools -->
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1.5">快速对齐工具</label>
            <div class="grid grid-cols-6 gap-1 bg-[#060b17] p-1.5 rounded-lg border border-slate-700/80">
              <button @click="emit('align:component', 'left')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="左对齐"><AlignLeft class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'center')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="水平居中"><AlignCenter class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'right')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="右对齐"><AlignRight class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'top')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="顶对齐"><AlignVerticalSpaceAround class="w-4 h-4 rotate-90" /></button>
              <button @click="emit('align:component', 'middle')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="垂直居中"><AlignHorizontalSpaceAround class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'bottom')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="底对齐"><AlignVerticalSpaceAround class="w-4 h-4 -rotate-90" /></button>
            </div>
          </div>

          <!-- Component Actions (Lock / Delete) -->
          <div class="pt-2 border-t border-slate-800/80 space-y-2">
            <label class="text-xs font-semibold text-slate-200 block mb-1">元件控制与删除</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="updateComponentProps({ locked: !component.locked })"
                class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Lock class="w-3.5 h-3.5" :class="component.locked ? 'text-amber-400' : 'text-slate-300'" />
                <span>{{ component.locked ? '解除锁定' : '锁定元件' }}</span>
              </button>

              <button
                @click="emit('delete', [component.id])"
                class="py-1.5 px-2 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>删除此组件</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: STYLE & PALETTE -->
        <div v-if="activeTab === 'style'" class="space-y-4">
          <!-- 1. Electrical Component Switch Status -->
          <div v-if="component && ['elec-breaker', 'elec-disconnector', 'elec-grounding'].includes(component.type)" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Zap class="w-4 h-4 text-amber-400" />
              <span>开关元件合分闸状态</span>
            </div>

            <!-- Switch / Breaker State Switcher -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">开关当前呈现状态 (State)</label>
              <select
                :value="component.customProps?.state || 'closed'"
                @change="updateComponentCustomProps({ state: ($event.target as HTMLSelectElement).value })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 outline-hidden cursor-pointer font-bold text-xs"
              >
                <option value="closed">🔴 合闸 (Closed / 闭合导通)</option>
                <option value="open">🟢 分闸 (Open / 断开隔离)</option>
                <option value="fault">⚠️ 故障跳闸 (Fault)</option>
              </select>
            </div>
          </div>

          <!-- 2. Typography & Text Styling (适用于所有文本、按钮、标签组件) -->
          <div class="p-3 rounded-lg bg-[#060b17] border border-slate-800 space-y-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Type class="w-4 h-4 text-cyan-400" />
              <span>文本与排版样式 (Typography)</span>
            </div>

            <!-- Text Content -->
            <div v-if="component.type === 'draw-text' || component.type === 'ctrl-button' || component.type === 'metric-header' || component.type === 'metric-clock' || component.type === 'metric-time-banner' || component.type === 'metric-clock-analog' || component.type === 'metric-countdown' || component.type === 'nav-tabs'">
              <label class="text-xs font-semibold text-slate-200 block mb-1">展示标题 / 文本内容</label>
              <input
                type="text"
                :value="component.customProps?.title || (component.type === 'ctrl-button' ? (component.style.buttonText || component.name) : (component.style.text || component.name))"
                @input="handleTextTitleChange(($event.target as HTMLInputElement).value)"
                class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 outline-hidden text-xs font-bold"
              />
            </div>

            <!-- Font Size & Font Weight -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">字号: {{ component.style.fontSize || 14 }}px</label>
                <input
                  type="range"
                  min="10"
                  max="96"
                  step="1"
                  :value="component.style.fontSize || 14"
                  @input="updateComponentStyle({ fontSize: Number(($event.target as HTMLInputElement).value) })"
                  class="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">字重 (Weight)</label>
                <select
                  :value="component.style.fontWeight || 'normal'"
                  @change="updateComponentStyle({ fontWeight: ($event.target as HTMLSelectElement).value as any })"
                  class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-200 text-xs outline-hidden cursor-pointer"
                >
                  <option value="300">细体 (Light 300)</option>
                  <option value="normal">常规 (Regular 400)</option>
                  <option value="600">半粗 (SemiBold 600)</option>
                  <option value="bold">粗体 (Bold 700)</option>
                  <option value="900">极粗 (Black 900)</option>
                </select>
              </div>
            </div>

            <!-- Font Family & Text Align -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">字体系列</label>
                <select
                  :value="component.style.fontFamily || 'monospace'"
                  @change="updateComponentStyle({ fontFamily: ($event.target as HTMLSelectElement).value })"
                  class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-200 text-xs outline-hidden cursor-pointer"
                >
                  <option value="Chakra Petch, monospace">Chakra Petch (工业科技)</option>
                  <option value="JetBrains Mono, monospace">JetBrains Mono (等宽)</option>
                  <option value="Noto Sans SC, sans-serif">Noto Sans (标准黑体)</option>
                  <option value="system-ui, sans-serif">系统无衬线 (System UI)</option>
                </select>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">对齐方式</label>
                <select
                  :value="component.style.textAlign || 'left'"
                  @change="updateComponentStyle({ textAlign: ($event.target as HTMLSelectElement).value as any })"
                  class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-200 text-xs outline-hidden cursor-pointer"
                >
                  <option value="left">居左对齐</option>
                  <option value="center">居中对齐</option>
                  <option value="right">居右对齐</option>
                </select>
              </div>
            </div>

            <!-- Text Color -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">文字颜色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="component.style.textColor || component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ textColor: ($event.target as HTMLInputElement).value })"
                  class="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  :value="component.style.textColor || component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ textColor: ($event.target as HTMLInputElement).value })"
                  class="flex-1 bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          <!-- 3. Line & Stroke Styling (线条与描边) -->
          <div class="p-3 rounded-lg bg-[#060b17] border border-slate-800 space-y-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Workflow class="w-4 h-4 text-cyan-400" />
              <span>线条与描边属性 (Line & Stroke)</span>
            </div>

            <!-- Line Width Slider & Input -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-semibold text-slate-200">线宽粗细</label>
                <span class="text-xs font-mono font-bold text-cyan-400">{{ component.style.strokeWidth ?? (component.type.startsWith('draw-line') ? 3 : 2) }}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                :value="component.style.strokeWidth ?? (component.type.startsWith('draw-line') ? 3 : 2)"
                @input="updateComponentStyle({ strokeWidth: Number(($event.target as HTMLInputElement).value) })"
                class="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <!-- Stroke Color -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">描边 / 线条颜色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ stroke: ($event.target as HTMLInputElement).value, voltageLevel: undefined })"
                  class="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  :value="component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ stroke: ($event.target as HTMLInputElement).value, voltageLevel: undefined })"
                  class="flex-1 bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
            </div>

            <!-- Line Style (Solid, Dashed, Dotted) -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">线条虚实样式</label>
                <select
                  :value="component.style.lineStyle || 'solid'"
                  @change="updateComponentStyle({ lineStyle: ($event.target as HTMLSelectElement).value as any })"
                  class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-200 text-xs outline-hidden cursor-pointer"
                >
                  <option value="solid">实线 (Solid)</option>
                  <option value="dashed">虚线 (Dashed)</option>
                  <option value="dotted">点线 (Dotted)</option>
                </select>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">走线转角模式</label>
                <select
                  :value="component.style.lineType || 'direct'"
                  @change="updateComponentStyle({ lineType: ($event.target as HTMLSelectElement).value as any })"
                  class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-200 text-xs outline-hidden cursor-pointer"
                >
                  <option value="direct">直线 (Direct)</option>
                  <option value="orthogonal-h">水平直角折线</option>
                  <option value="orthogonal-v">垂直直角折线</option>
                </select>
              </div>
            </div>

            <!-- Arrow Endings for Lines -->
            <div v-if="['draw-line', 'draw-polyline', 'draw-arrow'].includes(component.type)" class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="Boolean(component.style.startArrow)"
                  @change="updateComponentStyle({ startArrow: ($event.target as HTMLInputElement).checked })"
                  class="rounded accent-cyan-400"
                />
                <span>始端箭头</span>
              </label>

              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="Boolean(component.style.endArrow ?? (component.type === 'draw-arrow'))"
                  @change="updateComponentStyle({ endArrow: ($event.target as HTMLInputElement).checked })"
                  class="rounded accent-cyan-400"
                />
                <span>末端箭头</span>
              </label>
            </div>
          </div>

          <!-- 4. Fill, Background & Roundness (填充与容器样式) -->
          <div class="p-3 rounded-lg bg-[#060b17] border border-slate-800 space-y-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Palette class="w-4 h-4 text-cyan-400" />
              <span>填充、背景与圆角 (Fill & Container)</span>
            </div>

            <!-- Fill Color Input -->
            <div v-if="!['draw-line', 'draw-polyline', 'draw-arrow', 'elec-busbar'].includes(component.type)">
              <label class="text-xs font-semibold text-slate-200 block mb-1">填充背景色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="component.style.fill || '#00f2ff'"
                  @input="updateComponentStyle({ fill: ($event.target as HTMLInputElement).value })"
                  class="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  :value="component.style.fill || 'transparent'"
                  @input="updateComponentStyle({ fill: ($event.target as HTMLInputElement).value })"
                  class="flex-1 bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
            </div>

            <!-- Border Radius & Opacity -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">圆角: {{ component.style.borderRadius || 0 }}px</label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  :value="component.style.borderRadius || 0"
                  @input="updateComponentStyle({ borderRadius: Number(($event.target as HTMLInputElement).value) })"
                  class="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">透明度: {{ Math.round((component.style.opacity ?? 1) * 100) }}%</label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  :value="component.style.opacity ?? 1"
                  @input="updateComponentStyle({ opacity: Number(($event.target as HTMLInputElement).value) })"
                  class="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <!-- 5. Electrical Switch Enum Quick Controls -->
          <div v-if="['elec-breaker', 'elec-disconnector', 'elec-grounding', 'elec-handcart', 'ctrl-indicator'].includes(component.type)" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-2.5">
            <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
              <span class="flex items-center gap-1.5">
                <Zap class="w-4 h-4 text-amber-400" />
                <span>设备开关状态 (枚举: 0分 / 1合 / 2警)</span>
              </span>
              <span class="font-mono text-cyan-400 font-bold">
                {{ component.customProps?.state ?? component.customProps?.position ?? (component.style.indicatorState === 'alarm' ? 2 : (component.style.indicatorState === 'normal' ? 1 : 0)) }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-1.5 pt-1">
              <button
                @click="updateComponentCustomProps({ state: 0, position: 0 }), updateComponentStyle({ indicatorState: 'off' })"
                class="py-1.5 px-2 rounded-lg text-xs font-mono font-bold cursor-pointer border transition-all text-center"
                :class="(component.customProps?.state === 0 || component.customProps?.position === 0 || component.style.indicatorState === 'off')
                  ? 'bg-slate-700 text-white border-slate-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'"
              >
                0: 分闸 / 停
              </button>

              <button
                @click="updateComponentCustomProps({ state: 1, position: 1 }), updateComponentStyle({ indicatorState: 'normal' })"
                class="py-1.5 px-2 rounded-lg text-xs font-mono font-bold cursor-pointer border transition-all text-center"
                :class="(component.customProps?.state === 1 || component.customProps?.position === 1 || component.style.indicatorState === 'normal')
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-emerald-500/40'"
              >
                1: 合闸 / 运
              </button>

              <button
                @click="updateComponentCustomProps({ state: 2, position: 2 }), updateComponentStyle({ indicatorState: 'alarm' })"
                class="py-1.5 px-2 rounded-lg text-xs font-mono font-bold cursor-pointer border transition-all text-center"
                :class="(component.customProps?.state === 2 || component.customProps?.position === 2 || component.style.indicatorState === 'alarm')
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-500/40'"
              >
                2: 故障 / 警
              </button>
            </div>
          </div>

          <!-- SPECIAL: Status Indicator Atomic Style Controls -->
          <div v-if="component.type === 'ctrl-indicator'" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <CircleDot class="w-4 h-4 text-cyan-400" />
              <span>纯原子化指示灯配置 (0:绿 / 1:红)</span>
            </div>

            <!-- State Toggle 0:Green vs 1:Red -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">静态调试状态 (0=绿, 1=红)</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  @click="updateComponentCustomProps({ state: 0 })"
                  class="py-1.5 px-2 rounded-lg text-xs font-bold border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  :class="(component.customProps?.state ?? 0) === 0 ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-900 text-emerald-400 border-slate-800'"
                >
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>0: 绿色</span>
                </button>
                <button
                  @click="updateComponentCustomProps({ state: 1 })"
                  class="py-1.5 px-2 rounded-lg text-xs font-bold border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  :class="component.customProps?.state === 1 ? 'bg-red-500 text-white font-bold border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-900 text-red-400 border-slate-800'"
                >
                  <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span>1: 红色</span>
                </button>
                <button
                  @click="updateComponentCustomProps({ state: 2 })"
                  class="py-1.5 px-2 rounded-lg text-xs font-bold border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  :class="component.customProps?.state === 2 ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-900 text-amber-400 border-slate-800'"
                >
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>2: 黄色</span>
                </button>
              </div>
            </div>

            <!-- Indicator Style Preset -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">指示灯图元形态</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="updateComponentCustomProps({ indicatorStyle: 'bezel-circle' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition-all flex items-center gap-1.5"
                  :class="(component.customProps?.indicatorStyle || 'bezel-circle') === 'bezel-circle' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  <span class="w-2.5 h-2.5 rounded-full border border-current"></span>
                  <span>金属高光圆灯</span>
                </button>
                <button
                  @click="updateComponentCustomProps({ indicatorStyle: 'flat-led' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition-all flex items-center gap-1.5"
                  :class="component.customProps?.indicatorStyle === 'flat-led' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  <span class="w-2.5 h-2.5 rounded-full bg-current"></span>
                  <span>扁平发光LED</span>
                </button>
                <button
                  @click="updateComponentCustomProps({ indicatorStyle: 'square-lamp' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition-all flex items-center gap-1.5"
                  :class="component.customProps?.indicatorStyle === 'square-lamp' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  <span class="w-2.5 h-2.5 rounded-xs bg-current"></span>
                  <span>方型工业信号灯</span>
                </button>
                <button
                  @click="updateComponentCustomProps({ indicatorStyle: 'pill-tag' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-left cursor-pointer transition-all flex items-center gap-1.5"
                  :class="component.customProps?.indicatorStyle === 'pill-tag' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  <span class="w-4 h-2 rounded-full border border-current"></span>
                  <span>胶囊指示灯</span>
                </button>
              </div>
            </div>

            <!-- Blink Animation -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">闪烁动画速率</label>
              <select
                :value="component.customProps?.blink || 'none'"
                @change="updateComponentCustomProps({ blink: ($event.target as HTMLSelectElement).value })"
                class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1.5 text-slate-200 text-xs outline-hidden cursor-pointer"
              >
                <option value="none">常亮不闪烁</option>
                <option value="slow">慢闪 (1.0 Hz)</option>
                <option value="fast">急闪 (2.5 Hz)</option>
                <option value="auto">1或2状态时自动闪烁</option>
              </select>
            </div>
          </div>

          <!-- SPECIAL: Alarm Feed Style Controls -->
          <div v-if="component.type === 'ind-alarm-list'" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <AlertTriangle class="w-4 h-4 text-amber-400" />
              <span>实时告警事件滚屏组件配置</span>
            </div>

            <!-- Display Mode -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">展示滚屏模式</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  @click="updateComponentCustomProps({ mode: 'ticker' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-all"
                  :class="(component.customProps?.mode || 'ticker') === 'ticker' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  无缝连续滚屏
                </button>
                <button
                  @click="updateComponentCustomProps({ mode: 'table' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-all"
                  :class="component.customProps?.mode === 'table' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  工控列表表格
                </button>
                <button
                  @click="updateComponentCustomProps({ mode: 'marquee' })"
                  class="py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-all"
                  :class="component.customProps?.mode === 'marquee' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-800'"
                >
                  单行横向跑马灯
                </button>
              </div>
            </div>

            <!-- Scroll Speed -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">滚动速度</label>
              <select
                :value="component.customProps?.scrollSpeed || 'normal'"
                @change="updateComponentCustomProps({ scrollSpeed: ($event.target as HTMLSelectElement).value })"
                class="w-full bg-[#081026] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-200 text-xs outline-hidden cursor-pointer"
              >
                <option value="slow">慢速 (24秒循环)</option>
                <option value="normal">中速标准 (14秒循环)</option>
                <option value="fast">快速 (8秒循环)</option>
              </select>
            </div>

            <!-- Column Visibility Toggles -->
            <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showHeader !== false"
                  @change="updateComponentCustomProps({ showHeader: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>显示列表表头</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showLevelBadge !== false"
                  @change="updateComponentCustomProps({ showLevelBadge: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>显示告警级别徽章</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showTime !== false"
                  @change="updateComponentCustomProps({ showTime: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>显示发生时间</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showDevice !== false"
                  @change="updateComponentCustomProps({ showDevice: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>显示装置名称</span>
              </label>
            </div>
          </div>

          <!-- SPECIAL: ECharts Advanced Style & Threshold Lines Controls -->
          <div v-if="isChartComponent" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <TrendingUp class="w-4 h-4 text-cyan-400" />
              <span>图表视觉与告警标线配置</span>
            </div>

            <!-- Visual Toggles -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.smooth !== false"
                  @change="updateComponentCustomProps({ smooth: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>平滑曲线 (Smooth)</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showArea || false"
                  @change="updateComponentCustomProps({ showArea: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>渐变面积填充</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showDataLabels || false"
                  @change="updateComponentCustomProps({ showDataLabels: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>显示数值标签</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  :checked="component.customProps?.showLegend !== false"
                  @change="updateComponentCustomProps({ showLegend: ($event.target as HTMLInputElement).checked })"
                  class="accent-cyan-400 rounded"
                />
                <span>显示图表图例</span>
              </label>
            </div>

            <!-- Threshold Alarm Lines (MarkLines) -->
            <div class="pt-2 border-t border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span class="flex items-center gap-1 text-amber-300">
                  <AlertTriangle class="w-3.5 h-3.5" />
                  <span>上限/下限预警参考标线 (MarkLine)</span>
                </span>
              </div>

              <!-- Upper Threshold -->
              <div class="grid grid-cols-3 gap-1.5 items-center">
                <label class="flex items-center gap-1 cursor-pointer text-xs text-red-300 col-span-1">
                  <input
                    type="checkbox"
                    :checked="component.customProps?.enableUpperLimit || false"
                    @change="updateComponentCustomProps({ enableUpperLimit: ($event.target as HTMLInputElement).checked })"
                    class="accent-red-500 rounded"
                  />
                  <span>上限报警线</span>
                </label>
                <input
                  type="number"
                  placeholder="阈值(如:90)"
                  :value="component.customProps?.upperLimitValue ?? 90"
                  @input="updateComponentCustomProps({ upperLimitValue: Number(($event.target as HTMLInputElement).value) })"
                  class="bg-[#081026] border border-slate-700 focus:border-red-400 rounded px-2 py-1 text-slate-100 text-xs font-mono outline-hidden col-span-1"
                />
                <input
                  type="text"
                  placeholder="标签(如:过载上限)"
                  :value="component.customProps?.upperLimitLabel || '上限预警'"
                  @input="updateComponentCustomProps({ upperLimitLabel: ($event.target as HTMLInputElement).value })"
                  class="bg-[#081026] border border-slate-700 focus:border-red-400 rounded px-2 py-1 text-slate-100 text-xs outline-hidden col-span-1"
                />
              </div>

              <!-- Lower Threshold -->
              <div class="grid grid-cols-3 gap-1.5 items-center">
                <label class="flex items-center gap-1 cursor-pointer text-xs text-blue-300 col-span-1">
                  <input
                    type="checkbox"
                    :checked="component.customProps?.enableLowerLimit || false"
                    @change="updateComponentCustomProps({ enableLowerLimit: ($event.target as HTMLInputElement).checked })"
                    class="accent-blue-500 rounded"
                  />
                  <span>下限报警线</span>
                </label>
                <input
                  type="number"
                  placeholder="阈值(如:20)"
                  :value="component.customProps?.lowerLimitValue ?? 20"
                  @input="updateComponentCustomProps({ lowerLimitValue: Number(($event.target as HTMLInputElement).value) })"
                  class="bg-[#081026] border border-slate-700 focus:border-blue-400 rounded px-2 py-1 text-slate-100 text-xs font-mono outline-hidden col-span-1"
                />
                <input
                  type="text"
                  placeholder="标签(如:低压下限)"
                  :value="component.customProps?.lowerLimitLabel || '下限预警'"
                  @input="updateComponentCustomProps({ lowerLimitLabel: ($event.target as HTMLInputElement).value })"
                  class="bg-[#081026] border border-slate-700 focus:border-blue-400 rounded px-2 py-1 text-slate-100 text-xs outline-hidden col-span-1"
                />
              </div>
            </div>
          </div>

          <!-- 6. Streamer & Dynamic Glow Effect (流光动效) -->
          <div class="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2.5">
            <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
              <div class="flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-amber-400" />
                <span>动态流光特效 (Streamer Glow)</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="component.style.streamer?.active || false"
                  @change="updateComponentStyle({
                    streamer: {
                      ...(component.style.streamer || { color: '#00f2ff', speed: 2, direction: 'forward', type: 'laser', width: 2 }),
                      active: ($event.target as HTMLInputElement).checked
                    }
                  })"
                  class="sr-only peer"
                />
                <div class="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div v-if="component.style.streamer?.active" class="space-y-2 pt-1 border-t border-slate-800">
              <!-- Streamer Color -->
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">流光色彩</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    :value="component.style.streamer?.color || '#00f2ff'"
                    @input="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        color: ($event.target as HTMLInputElement).value
                      }
                    })"
                    class="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    :value="component.style.streamer?.color || '#00f2ff'"
                    @input="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        color: ($event.target as HTMLInputElement).value
                      }
                    })"
                    class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 font-semibold text-xs outline-hidden"
                  />
                </div>
              </div>

              <!-- Streamer Type & Direction -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-semibold text-slate-200 block mb-1">流光样式</label>
                  <select
                    :value="component.style.streamer?.type || 'laser'"
                    @change="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        type: ($event.target as HTMLSelectElement).value as any
                      }
                    })"
                    class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 text-xs outline-hidden cursor-pointer"
                  >
                    <option value="laser">激光流动 (Laser)</option>
                    <option value="pulse">脉冲波光 (Pulse)</option>
                    <option value="dots">光粒子虚点 (Dots)</option>
                  </select>
                </div>

                <div>
                  <label class="text-xs font-semibold text-slate-200 block mb-1">流动方向</label>
                  <select
                    :value="component.style.streamer?.direction || 'forward'"
                    @change="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        direction: ($event.target as HTMLSelectElement).value as any
                      }
                    })"
                    class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 text-xs outline-hidden cursor-pointer"
                  >
                    <option value="forward">正向流动 (Forward)</option>
                    <option value="reverse">反向流动 (Reverse)</option>
                  </select>
                </div>
              </div>

              <!-- Streamer Speed -->
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">流速周期: {{ component.style.streamer?.speed || 2 }} 秒/圈</label>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.2"
                  :value="component.style.streamer?.speed || 2"
                  @input="updateComponentStyle({
                    streamer: {
                      ...(component.style.streamer || {}),
                      speed: Number(($event.target as HTMLInputElement).value)
                    }
                  })"
                  class="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: DATA BINDING -->
        <div v-if="activeTab === 'data'" class="space-y-4">
          <!-- State Simulation Test for Custom Symbols -->
          <div v-if="component.states && component.states.length > 0" class="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span class="flex items-center gap-1.5">
                <Workflow class="w-4 h-4 text-emerald-400" />
                <span>图元状态快速模拟测试</span>
              </span>
              <span class="text-[10px] text-slate-400">点击即时切换</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button
                v-for="st in component.states"
                :key="st.id"
                @click="updateComponentProps({ activeState: st.id })"
                class="py-1.5 px-2 rounded-lg text-xs font-mono cursor-pointer border transition-all truncate text-left flex items-center justify-between"
                :class="String(component.activeState ?? '1') === String(st.id)
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-xs'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50'"
              >
                <span class="truncate">{{ st.name }}</span>
                <span class="text-[10px] opacity-75 font-bold">值:{{ st.matchValue ?? st.id }}</span>
              </button>
            </div>
          </div>

          <!-- Data Source Switcher: SCADA 4-Telemetry vs Static Data -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-200 block">数据来源模式</label>
            <div class="grid grid-cols-2 gap-1 bg-[#060b17] p-1 rounded-lg border border-slate-800">
              <button
                @click="dataBindingSource = 'scada'"
                class="py-1.5 px-2 rounded-md text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                :class="dataBindingSource === 'scada' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'"
              >
                <Cpu class="w-3.5 h-3.5" />
                <span>SCADA 四遥数据</span>
              </button>
              <button
                @click="dataBindingSource = 'static'"
                class="py-1.5 px-2 rounded-md text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                :class="dataBindingSource === 'static' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'"
              >
                <FileCode class="w-3.5 h-3.5" />
                <span>静态 JSON 数据</span>
              </button>
            </div>
          </div>

          <!-- ================= SCADA FOUR-TELEMETRY MODE ================= -->
          <div v-if="dataBindingSource === 'scada'" class="space-y-4">
            <!-- 1. SCADA 测点关联全景卡片 (Already Bound Details & Quick Locating) -->
            <div
              class="p-3 rounded-xl border transition-all"
              :class="currentBindingDetails.isBound ? 'bg-[#050e1f] border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,255,0.08)]' : 'bg-[#060b17] border-slate-800'"
            >
              <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="currentBindingDetails.isBound ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'"
                  ></div>
                  <span class="font-bold text-xs" :class="currentBindingDetails.isBound ? 'text-cyan-300' : 'text-slate-400'">
                    {{ currentBindingDetails.isBound ? '已关联 SCADA 测点' : '未关联 SCADA 实时测点' }}
                  </span>
                </div>
                
                <span
                  v-if="currentBindingDetails.isBound"
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  :class="currentBindingDetails.categoryBadgeColor"
                >
                  {{ currentBindingDetails.categoryLabel }}
                </span>
                <span v-else class="text-[10px] text-slate-500 font-mono">处于仿真默认模式</span>
              </div>

              <!-- Bound Details Display -->
              <div v-if="currentBindingDetails.isBound" class="pt-2.5 space-y-2 text-xs">
                <!-- Device & Point Meta -->
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                  <div class="bg-[#030712]/80 p-2 rounded-lg border border-slate-800/80">
                    <span class="text-slate-400 block text-[10px]">关联测控装置</span>
                    <span class="font-bold text-slate-200 truncate block mt-0.5" :title="currentBindingDetails.deviceName">
                      [{{ currentBindingDetails.deviceId }}] {{ currentBindingDetails.deviceName }}
                    </span>
                  </div>
                  <div class="bg-[#030712]/80 p-2 rounded-lg border border-slate-800/80">
                    <span class="text-slate-400 block text-[10px]">关联点号与名称</span>
                    <span class="font-bold text-cyan-300 truncate block mt-0.5" :title="currentBindingDetails.pointName">
                      #{{ currentBindingDetails.pointId }} {{ currentBindingDetails.pointName }}
                    </span>
                  </div>
                </div>

                <!-- Strict Telemetry / Tele-control Real-time Value Box -->
                <div class="p-2.5 rounded-lg border" :class="currentBindingDetails.isControl ? 'bg-purple-950/20 border-purple-500/40' : (currentBindingDetails.isRegulation ? 'bg-blue-950/20 border-blue-500/40' : 'bg-cyan-950/20 border-cyan-500/40')">
                  <!-- Case 1: Tele-Control (YK) - Explicitly state it has NO raw sampled value, displays verification point -->
                  <template v-if="currentBindingDetails.isControl">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                        <ShieldCheck class="w-3 h-3 text-purple-400" />
                        <span>遥控通道性质: 控制输出 (无现场采样值)</span>
                      </span>
                      <span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 border border-purple-400/30 font-mono">
                        双位置控制
                      </span>
                    </div>
                    <div class="flex items-baseline justify-between pt-1">
                      <span class="text-[11px] text-slate-300">图元状态显示 (取自校验遥信):</span>
                      <div class="text-right">
                        <span class="font-mono font-bold text-emerald-400 text-sm">
                          {{ currentBindingDetails.currentDisplayValue }}
                        </span>
                        <span v-if="currentBindingDetails.verificationPoint" class="block text-[10px] text-purple-300 font-mono">
                          来自: [YX_{{ currentBindingDetails.verificationPoint.pointId }}] {{ currentBindingDetails.verificationPoint.pointName }}
                        </span>
                      </div>
                    </div>
                    <div class="mt-1.5 pt-1.5 border-t border-purple-500/20 text-[10px] text-purple-300/80 leading-tight">
                      💡 严谨 SCADA 规约：遥控本身无测量数据值，画面图元分合状态由闭环校验遥信实时驱动。
                    </div>
                  </template>

                  <!-- Case 2: Tele-Regulation (YT) - Explicitly state it displays verification telemetry -->
                  <template v-else-if="currentBindingDetails.isRegulation">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] font-bold text-blue-300 flex items-center gap-1">
                        <ShieldCheck class="w-3 h-3 text-blue-400" />
                        <span>遥调通道性质: 定值输出 (无现场采样值)</span>
                      </span>
                      <span class="text-[9px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-200 border border-blue-400/30 font-mono">
                        模拟量整定
                      </span>
                    </div>
                    <div class="flex items-baseline justify-between pt-1">
                      <span class="text-[11px] text-slate-300">图元数值显示 (取自校验遥测):</span>
                      <div class="text-right">
                        <span class="font-mono font-bold text-cyan-300 text-sm">
                          {{ currentBindingDetails.currentDisplayValue }}
                        </span>
                        <span v-if="currentBindingDetails.verificationPoint" class="block text-[10px] text-blue-300 font-mono">
                          来自: [YC_{{ currentBindingDetails.verificationPoint.pointId }}] {{ currentBindingDetails.verificationPoint.pointName }}
                        </span>
                      </div>
                    </div>
                    <div class="mt-1.5 pt-1.5 border-t border-blue-500/20 text-[10px] text-blue-300/80 leading-tight">
                      💡 严谨 SCADA 规约：遥调本身无测量数据值，画面图元实时读数由闭环校验遥测实测值驱动。
                    </div>
                  </template>

                  <!-- Case 3: Standard Telemetry (YC), Tele-Signal (YX), Energy (DD) -->
                  <template v-else>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] font-bold text-slate-400">现场实时采样值</span>
                      <span class="text-[9px] text-emerald-400 font-mono">质量码: 0x00 优</span>
                    </div>
                    <div class="flex items-baseline justify-between">
                      <span class="text-[10px] text-slate-400 font-mono">采样通道键:</span>
                      <span class="font-mono font-bold text-cyan-300 text-sm">
                        {{ currentBindingDetails.currentDisplayValue }}
                      </span>
                    </div>
                  </template>
                </div>

                <!-- Bound Action Toolbar: Locate in Table, Control Test, Unbind -->
                <div class="flex items-center gap-1.5 pt-1">
                  <button
                    @click="handleLocateBoundPoint"
                    class="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="在下方点表库中快速定位并聚焦此测点"
                  >
                    <Crosshair class="w-3.5 h-3.5 text-cyan-400" />
                    <span>在点表中定位</span>
                  </button>

                  <button
                    v-if="currentBindingDetails.isControl || currentBindingDetails.isRegulation"
                    @click="emit('open:control', currentBindingDetails.deviceId || 'DEV-101')"
                    class="py-1.5 px-2.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/50 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                    title="在控制台下发遥控/遥调预演指令"
                  >
                    <Zap class="w-3.5 h-3.5 text-purple-400" />
                    <span>控制台预演</span>
                  </button>

                  <button
                    @click="handleUnbindPoint"
                    class="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all"
                    title="解除当前图元与此测点的关联"
                  >
                    <Unlink class="w-3 h-3 text-rose-400" />
                    <span>解绑</span>
                  </button>
                </div>
              </div>

              <!-- Empty prompt -->
              <div v-else class="pt-2 text-[11px] text-slate-400 leading-relaxed">
                当前图元尚未关联集控系统的实时点表。请在下方依次按【厂站/装置 ➔ 四遥分类 ➔ 规约测点】流程选择并建立严谨的规约映射。
              </div>
            </div>

            <!-- ================= TRADITIONAL SCADA 4-STEP BINDING WORKFLOW ================= -->
            <div class="space-y-3 pt-1">
              <!-- Step 1: Substation & IED Device -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center font-mono font-bold">1</span>
                    <span>受控间隔与测控装置 (IED Device)</span>
                  </label>
                  <span class="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    通信在线
                  </span>
                </div>
                <select
                  v-model="selectedDeviceId"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 font-bold text-xs outline-hidden cursor-pointer"
                >
                  <option v-for="dev in currentDatasetDevices" :key="dev.deviceId" :value="dev.deviceId">
                    [{{ dev.deviceId }}] {{ dev.deviceName }} ({{ dev.deviceType || '测控保护' }})
                  </option>
                </select>
              </div>

              <!-- Step 2: Telemetry Classification (四遥严格分流) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center font-mono font-bold">2</span>
                    <span>四遥测点分类 (Tele-Category)</span>
                  </label>
                  <span class="text-[10px] text-slate-400 font-mono">
                    当前装置包含 {{ selectedDevice ? (selectedDevice.telemetries?.length || 0) + (selectedDevice.teleSignals?.length || 0) + (selectedDevice.energies?.length || 0) + (selectedDevice.teleControls?.length || 0) + (selectedDevice.teleRegulations?.length || 0) : 0 }} 个测点
                  </span>
                </div>

                <div class="grid grid-cols-5 gap-1 bg-[#060b17] p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                  <button
                    @click="selectedTeleCategory = 'yc'"
                    class="py-1.5 rounded text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                    :class="selectedTeleCategory === 'yc' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'"
                  >
                    <span>遥测 YC</span>
                    <span class="text-[9px] font-mono opacity-80">模拟量 ({{ selectedDevice?.telemetries?.length || 0 }})</span>
                  </button>
                  <button
                    @click="selectedTeleCategory = 'yx'"
                    class="py-1.5 rounded text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                    :class="selectedTeleCategory === 'yx' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'"
                  >
                    <span>遥信 YX</span>
                    <span class="text-[9px] font-mono opacity-80">状态量 ({{ selectedDevice?.teleSignals?.length || 0 }})</span>
                  </button>
                  <button
                    @click="selectedTeleCategory = 'dd'"
                    class="py-1.5 rounded text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                    :class="selectedTeleCategory === 'dd' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'"
                  >
                    <span>电度 DD</span>
                    <span class="text-[9px] font-mono opacity-80">电能量 ({{ selectedDevice?.energies?.length || 0 }})</span>
                  </button>
                  <button
                    @click="selectedTeleCategory = 'yk'"
                    class="py-1.5 rounded text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                    :class="selectedTeleCategory === 'yk' ? 'bg-purple-500 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'"
                  >
                    <span>遥控 YK</span>
                    <span class="text-[9px] font-mono opacity-80">控制 ({{ selectedDevice?.teleControls?.length || 0 }})</span>
                  </button>
                  <button
                    @click="selectedTeleCategory = 'yt'"
                    class="py-1.5 rounded text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                    :class="selectedTeleCategory === 'yt' ? 'bg-blue-500 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'"
                  >
                    <span>遥调 YT</span>
                    <span class="text-[9px] font-mono opacity-80">定值 ({{ selectedDevice?.teleRegulations?.length || 0 }})</span>
                  </button>
                </div>
              </div>

              <!-- Step 3: SCADA Point Table Mapping (标准工业点表) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center font-mono font-bold">3</span>
                    <span>工业规约点表检索与关联 (Point Library)</span>
                  </label>
                  <span class="text-[10px] text-cyan-400 font-mono">共 {{ filteredPoints.length }} 个测点</span>
                </div>

                <!-- Search Input -->
                <div class="relative">
                  <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    v-model="pointSearchQuery"
                    placeholder="按点号、中文点名、规约标识搜索..."
                    class="w-full bg-[#060b17] border border-slate-800 focus:border-cyan-400 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 outline-hidden"
                  />
                </div>

                <!-- Scrollable Point List -->
                <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                  <div
                    v-for="pt in filteredPoints"
                    :key="pt.pointId"
                    :id="`scada-point-row-${pt.pointId}`"
                    @click="handleBindPointToComponent(pt)"
                    class="p-2 rounded-lg bg-[#060b17] border text-xs cursor-pointer transition-all flex items-center justify-between group"
                    :class="[
                      currentBindingDetails.isBound &&
                      currentBindingDetails.deviceId === selectedDevice?.deviceId &&
                      currentBindingDetails.category === selectedTeleCategory &&
                      String(currentBindingDetails.pointId) === String(pt.pointId)
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(0,242,255,0.15)] ring-1 ring-cyan-400'
                        : 'border-slate-800 hover:border-cyan-500/70 hover:bg-slate-900/50'
                    ]"
                  >
                    <div class="flex items-center gap-2 overflow-hidden">
                      <span class="font-mono font-bold text-cyan-400 text-[11px] shrink-0">#{{ pt.pointId }}</span>
                      <div class="truncate">
                        <div class="flex items-center gap-1.5">
                          <span class="font-semibold text-slate-200 block truncate group-hover:text-cyan-300">{{ pt.name }}</span>
                          <span
                            v-if="currentBindingDetails.isBound && currentBindingDetails.deviceId === selectedDevice?.deviceId && currentBindingDetails.category === selectedTeleCategory && String(currentBindingDetails.pointId) === String(pt.pointId)"
                            class="px-1 py-0.2 rounded text-[9px] bg-cyan-500 text-slate-950 font-bold shrink-0"
                          >
                            已关联
                          </span>
                        </div>
                        <span class="text-[10px] text-slate-400 block truncate font-mono">
                          {{ selectedDevice?.deviceId }}_{{ selectedTeleCategory.toUpperCase() }}_{{ pt.pointId }}
                        </span>
                      </div>
                    </div>

                    <!-- Right Side: Rigorous Value & Status Handling (YK/YT shows verification point) -->
                    <div class="text-right shrink-0 pl-2">
                      <!-- Case YC / DD -->
                      <span
                        v-if="selectedTeleCategory === 'yc' || selectedTeleCategory === 'dd'"
                        class="font-mono font-bold text-emerald-400 text-xs block"
                      >
                        {{ pt.value }} <span class="text-[10px] text-cyan-300 font-normal">{{ pt.unit || '' }}</span>
                      </span>

                      <!-- Case YX -->
                      <span
                        v-else-if="selectedTeleCategory === 'yx'"
                        class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono inline-block"
                        :class="pt.value === 1 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : (pt.value === 2 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-700')"
                      >
                        {{ pt.value }} ({{ pt.statusText || (pt.value === 1 ? '合闸' : '分闸') }})
                      </span>

                      <!-- Case YK: Rigorous industrial presentation - No raw sampled value, displays verification YX state -->
                      <div v-else-if="selectedTeleCategory === 'yk'" class="space-y-0.5">
                        <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                          控制通道 (无采样值)
                        </span>
                        <span class="text-[10px] text-slate-300 block font-mono">
                          ➔ 校验 [YX_{{ pt.targetPointId || 1 }}]: <span class="text-emerald-400 font-bold">{{ getTargetYxStatusText(pt.targetPointId || 1) }}</span>
                        </span>
                      </div>

                      <!-- Case YT: Rigorous industrial presentation - No raw sampled value, displays verification YC value -->
                      <div v-else-if="selectedTeleCategory === 'yt'" class="space-y-0.5">
                        <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
                          调节通道 (无采样值)
                        </span>
                        <span class="text-[10px] text-slate-300 block font-mono">
                          ➔ 校验 [YC_{{ pt.targetYcPointId || 1 }}]: <span class="text-cyan-300 font-bold">{{ getTargetYcValueText(pt.targetYcPointId || 1) }}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div v-if="filteredPoints.length === 0" class="p-4 text-center text-xs text-slate-500">
                    未找到符合条件的规约测点
                  </div>
                </div>
              </div>

              <!-- Step 4: Closed-Loop Verification & Safety Interlock (针对遥控遥调的严密闭环校验) -->
              <div
                v-if="component.data.action?.type === 'tele-control' || component.data.action?.type === 'tele-regulation' || selectedTeleCategory === 'yk' || selectedTeleCategory === 'yt'"
                class="p-3 rounded-xl bg-purple-950/30 border border-purple-500/50 space-y-2.5"
              >
                <div class="flex items-center justify-between text-xs font-bold text-purple-300">
                  <span class="flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-mono font-bold">4</span>
                    <ShieldCheck class="w-4 h-4 text-purple-400" />
                    <span>闭环校验点与状态源设定 (Closed-Loop Verification)</span>
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-400/40 font-mono">
                    {{ (component.data.action?.type === 'tele-control' || selectedTeleCategory === 'yk') ? '遥控 ➔ 校验遥信 (YX)' : '遥调 ➔ 校验遥测 (YC)' }}
                  </span>
                </div>

                <div class="text-[11px] text-slate-300 leading-relaxed">
                  严谨 SCADA 规约要求：下发指令后必须通过现场测点校验闭环生效。图元画面中显示的开合状态或实测数值将严格绑定于此校验点：
                </div>

                <!-- Select corresponding YX for YK -->
                <div v-if="component.data.action?.type === 'tele-control' || selectedTeleCategory === 'yk'">
                  <label class="text-[11px] font-semibold text-purple-300 block mb-1">
                    对应状态校验遥信点 (YX) - 驱动图元画面开合显示
                  </label>
                  <select
                    :value="component.data.action?.targetPointId ?? component.data.mapping?.targetYxPointId ?? selectedDevice?.teleSignals?.[0]?.pointId ?? ''"
                    @change="handleSetVerificationPoint(Number(($event.target as HTMLSelectElement).value))"
                    class="w-full bg-[#060b17] border border-purple-500/40 focus:border-purple-300 rounded-lg px-2.5 py-1.5 text-purple-200 font-mono font-bold text-xs outline-hidden cursor-pointer"
                  >
                    <option v-for="yx in selectedDevice?.teleSignals || []" :key="yx.pointId" :value="yx.pointId">
                      [YX_{{ yx.pointId }}] {{ yx.name }} (实时反馈: {{ yx.value }} - {{ yx.statusText || (yx.value === 1 ? '合闸' : '分闸') }})
                    </option>
                  </select>
                </div>

                <!-- Select corresponding YC for YT -->
                <div v-if="component.data.action?.type === 'tele-regulation' || selectedTeleCategory === 'yt'">
                  <label class="text-[11px] font-semibold text-blue-300 block mb-1">
                    对应实测校验遥测点 (YC) - 驱动图元画面定值显示
                  </label>
                  <select
                    :value="component.data.action?.targetPointId ?? component.data.mapping?.targetYcPointId ?? selectedDevice?.telemetries?.[0]?.pointId ?? ''"
                    @change="handleSetVerificationPoint(Number(($event.target as HTMLSelectElement).value))"
                    class="w-full bg-[#060b17] border border-blue-500/40 focus:border-blue-300 rounded-lg px-2.5 py-1.5 text-blue-200 font-mono font-bold text-xs outline-hidden cursor-pointer"
                  >
                    <option v-for="yc in selectedDevice?.telemetries || []" :key="yc.pointId" :value="yc.pointId">
                      [YC_{{ yc.pointId }}] {{ yc.name }} (现场实测: {{ yc.value }} {{ yc.unit || '' }})
                    </option>
                  </select>
                </div>

                <!-- Quick Test Button in Step 4 -->
                <button
                  @click="emit('open:control', selectedDevice?.deviceId || component.data.action?.deviceId || 'DEV-101')"
                  class="w-full py-1.5 px-2.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Zap class="w-3.5 h-3.5 text-purple-400" />
                  <span>立即在控制台预演下发并校验变位</span>
                </button>
              </div>

              <!-- Quick shortcut to bulk points manager -->
              <div class="pt-1">
                <button
                  @click="emit('open:batch:points')"
                  class="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Sparkles class="w-3.5 h-3.5 text-cyan-400" />
                  <span>打开批量遥测/遥信关联与生成</span>
                </button>
              </div>
            </div>

            <!-- SPECIAL SECTION: Chart Binding Explanation & Presets -->
            <div v-if="isChartComponent" class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2.5">
              <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <BarChart2 class="w-4 h-4 text-cyan-400" />
                <span>图表数据绑定生效指南与预设</span>
              </div>

              <div class="text-[11px] text-slate-300 leading-relaxed space-y-1">
                <p>💡 <strong class="text-white">SCADA 绑定机制：</strong> 图表数据由 <code class="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">X轴 (categoriesKey)</code> 与 <code class="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">Y轴系列 (seriesKey)</code> 自动关联全站时序曲线或装置负荷。</p>
              </div>

              <!-- Quick Presets for Charts -->
              <div class="space-y-1.5 pt-1 border-t border-slate-800">
                <label class="text-[11px] font-semibold text-cyan-300 block">一键绑定 SCADA 实时时序与负荷曲线：</label>
                <div class="grid grid-cols-1 gap-1.5">
                  <button
                    @click="handleBindChartPreset('power-trend')"
                    class="py-1.5 px-2 rounded-lg bg-[#060b17] hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <span>📈 绑定进线有功功率 24h 时序曲线</span>
                    <span class="text-[10px] text-cyan-400 font-mono">series_power</span>
                  </button>

                  <button
                    @click="handleBindChartPreset('voltage-trend')"
                    class="py-1.5 px-2 rounded-lg bg-[#060b17] hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <span>📉 绑定母线电压 24h 波动曲线</span>
                    <span class="text-[10px] text-cyan-400 font-mono">series_voltage</span>
                  </button>

                  <button
                    @click="handleBindChartPreset('load-bar')"
                    class="py-1.5 px-2 rounded-lg bg-[#060b17] hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <span>📊 绑定各装置实时负荷对比柱状图</span>
                    <span class="text-[10px] text-cyan-400 font-mono">series_device_load</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- SPECIAL SECTION: Alarm Feed Binding & Filter -->
            <div v-if="component.type === 'ind-alarm-list'" class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2.5">
              <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <AlertTriangle class="w-4 h-4 text-amber-400" />
                <span>实时告警事件源过滤</span>
              </div>

              <!-- Device Filter -->
              <div>
                <label class="text-[11px] font-semibold text-slate-200 block mb-1">告警来源装置过滤</label>
                <select
                  :value="component.data.mapping?.deviceId || 'ALL'"
                  @change="updateComponentData({ mapping: { ...component.data.mapping, deviceId: ($event.target as HTMLSelectElement).value } })"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 text-xs outline-hidden cursor-pointer"
                >
                  <option value="ALL">全部装置 (全站综合事件流)</option>
                  <option v-for="dev in currentDatasetDevices" :key="dev.deviceId" :value="dev.deviceId">
                    [{{ dev.deviceId }}] {{ dev.name }}
                  </option>
                </select>
              </div>

              <!-- Severity Filter -->
              <div>
                <label class="text-[11px] font-semibold text-slate-200 block mb-1">告警级别过滤</label>
                <select
                  :value="component.data.mapping?.severityLevel || 'ALL'"
                  @change="updateComponentData({ mapping: { ...component.data.mapping, severityLevel: ($event.target as HTMLSelectElement).value } })"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 text-xs outline-hidden cursor-pointer"
                >
                  <option value="ALL">全部级别 (严重事故 + 异常预警 + 运行提示)</option>
                  <option value="CRITICAL_ONLY">仅紧急事故 (CRITICAL 跳闸/过流/短路)</option>
                  <option value="WARNING_PLUS">预警及以上 (CRITICAL + WARNING)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ================= STATIC JSON DATA MODE ================= -->
          <div v-else-if="dataBindingSource === 'static'" class="space-y-3">
            <div class="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
              <span>📋 静态数据模式：组件将直接解析下方输入的标准 JSON 结构，方便快速填充常规大屏项目数据。</span>
            </div>

            <!-- Big Screen Standard Templates Injector -->
            <div class="p-3 rounded-lg bg-[#060b17] border border-slate-800 space-y-2">
              <label class="text-xs font-semibold text-cyan-300 block">常规大屏标准格式一键注入：</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="handleApplyStandardTemplate('timeseries-power')"
                  class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer truncate"
                >
                  📈 24h时序负荷折线
                </button>
                <button
                  @click="handleApplyStandardTemplate('multiseries-voltage')"
                  class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer truncate"
                >
                  📉 三相电压多曲线
                </button>
                <button
                  @click="handleApplyStandardTemplate('bar-efficiency')"
                  class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer truncate"
                >
                  📊 装置负荷对比柱图
                </button>
                <button
                  @click="handleApplyStandardTemplate('pie-energy-mix')"
                  class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer truncate"
                >
                  🍩 厂区能源占比饼图
                </button>
                <button
                  @click="handleApplyStandardTemplate('radar-health')"
                  class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer truncate"
                >
                  🕸️ 设备健康度雷达
                </button>
                <button
                  @click="handleApplyStandardTemplate('alarm-events')"
                  class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 cursor-pointer truncate"
                >
                  ⚡ 实时事故告警事件
                </button>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-semibold text-slate-200">静态 JSON 格式数据</label>
                <button
                  @click="staticJsonInput = JSON.stringify(component.data.staticData || { value: 125.6, unit: 'kV', label: '静态测量' }, null, 2)"
                  class="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                >
                  填入当前组件数据
                </button>
              </div>
              <textarea
                v-model="staticJsonInput"
                placeholder='{"value": 10.5, "unit": "kV", "categories": ["01:00", "02:00"], "series": [10, 20]}'
                class="w-full h-36 bg-[#060b17] border border-slate-800 focus:border-cyan-400 rounded-lg p-2.5 text-xs text-slate-100 font-mono outline-hidden resize-none"
              ></textarea>
            </div>

            <div v-if="staticJsonMsg" class="text-xs font-semibold" :class="staticJsonMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'">
              {{ staticJsonMsg }}
            </div>

            <button
              @click="handleApplyStaticData"
              class="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              应用静态数据到组件
            </button>
          </div>
        </div>

        <!-- TAB 4: INTERACTION & SCREEN NAVIGATION -->
        <div v-if="activeTab === 'interaction'" class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">点击触发行为 (Action)</label>
            <select
              :value="(component.data.action?.type === 'switch-screen' ? 'jump-screen' : component.data.action?.type) || 'none'"
              @change="updateComponentAction({ type: ($event.target as HTMLSelectElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 outline-hidden cursor-pointer font-bold text-xs"
            >
              <option value="none">无交互事件</option>
              <option value="jump-screen">🔗 切换跳转至目标子画面</option>
              <option value="link">🌐 打开外部系统链接</option>
            </select>
          </div>

          <!-- Target Screen Selector -->
          <div v-if="component.data.action?.type === 'jump-screen' || component.data.action?.type === 'switch-screen'" class="space-y-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
            <label class="text-xs text-cyan-300 font-bold block">选择目标子画面</label>
            <select
              :value="component.data.action?.targetScreenId || ''"
              @change="updateComponentAction({ targetScreenId: ($event.target as HTMLSelectElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 font-semibold outline-hidden cursor-pointer text-xs"
            >
              <option value="" disabled>请选择要跳转的画面...</option>
              <option v-for="sc in screens" :key="sc.id" :value="sc.id">
                {{ sc.name }} ({{ sc.screen.width }} × {{ sc.screen.height }})
              </option>
            </select>
            <p class="text-[11px] text-slate-300 leading-relaxed">设置后，在 SCADA 预览演示或点击按钮时将自动平滑切换至目标画面。</p>
          </div>

          <!-- External Link Input -->
          <div v-if="component.data.action?.type === 'link'" class="space-y-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
            <label class="text-xs text-cyan-300 font-bold block">外部系统链接 (URL)</label>
            <input
              type="url"
              :value="component.data.action?.url || ''"
              @input="updateComponentAction({ url: ($event.target as HTMLInputElement).value })"
              placeholder="https://..."
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold outline-hidden text-xs"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 3. EMPTY STATE (NO SELECTION) ================= -->
    <template v-else>
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div class="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3 text-cyan-400/60 shadow-inner">
          <Sliders class="w-6 h-6" />
        </div>
        <div class="text-xs font-bold text-slate-300 mb-1">未选中图元组件</div>
        <p class="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
          在左侧画布中单击或框选图元，即可在此配置几何参数、电气样式与测点绑定
        </p>
      </div>
    </template>
  </aside>
</template>
