import { DatasetItem } from '../types';

export const INITIAL_DATASETS: DatasetItem[] = [
  {
    id: 'ds-factory-telemetry',
    name: '智能工厂车间遥测 (Smart Factory Telemetry)',
    description: '实时产线能耗、转速、震动频率、温度与综合稼动率 (OEE)',
    type: 'mock',
    updateIntervalMs: 2000,
    isStreaming: true,
    data: {
      factory_name: '智能智造一号超级车间',
      timestamp: new Date().toLocaleTimeString(),
      temperature_c: 48.6,
      pressure_kpa: 312.4,
      spindle_speed_rpm: 3620,
      vibration_hz: 14.8,
      power_consumption_kw: 845.2,
      oee_efficiency_pct: 92.4,
      daily_yield_units: 14280,
      target_yield_units: 15000,
      yield_rate_pct: 95.2,
      alarm_count: 2,
      equipment_status: 'RUNNING',
      series_time: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30', '10:35', '10:40', '10:45'],
      series_power: [720, 780, 810, 790, 830, 845, 860, 850, 842, 855],
      series_temp: [42.1, 43.5, 45.0, 46.2, 47.1, 48.0, 48.6, 49.1, 48.9, 48.6],
      series_oee: [88, 89, 91, 90, 93, 94, 92, 95, 93, 92.4],
      series_categories: ['1#冲压', '2#焊接', '3#涂装', '4#总装', '5#质检', '6#包装'],
      series_line_output: [2800, 3100, 2450, 3600, 2100, 1230]
    },
    fields: [
      { name: 'temperature_c', type: 'number', label: '温度 (°C)', sample: 48.6 },
      { name: 'pressure_kpa', type: 'number', label: '压力 (kPa)', sample: 312.4 },
      { name: 'spindle_speed_rpm', type: 'number', label: '主轴转速 (RPM)', sample: 3620 },
      { name: 'power_consumption_kw', type: 'number', label: '实时功率 (kW)', sample: 845.2 },
      { name: 'oee_efficiency_pct', type: 'number', label: 'OEE稼动率 (%)', sample: 92.4 },
      { name: 'daily_yield_units', type: 'number', label: '今日产量 (件)', sample: 14280 },
      { name: 'yield_rate_pct', type: 'number', label: '良品率 (%)', sample: 95.2 },
      { name: 'alarm_count', type: 'number', label: '报警总数', sample: 2 },
      { name: 'equipment_status', type: 'string', label: '设备工况', sample: 'RUNNING' },
      { name: 'series_time', type: 'array', label: '时间轴序列', sample: ['10:00', '10:05'] },
      { name: 'series_power', type: 'array', label: '功率趋势序列', sample: [720, 845] },
      { name: 'series_temp', type: 'array', label: '温度变化序列', sample: [42.1, 48.6] },
      { name: 'series_categories', type: 'array', label: '工序分类', sample: ['冲压', '焊接'] },
      { name: 'series_line_output', type: 'array', label: '各工序产出', sample: [2800, 3100] }
    ]
  },
  {
    id: 'ds-chemical-tanks',
    name: '化工储罐与流体管道监控 (Chemical Tanks & Flow)',
    description: '1号-4号反应釜液位、进出阀门开度、流速流量及防爆安全指数',
    type: 'mock',
    updateIntervalMs: 1500,
    isStreaming: true,
    data: {
      tank1_level_pct: 78.4,
      tank1_volume_m3: 156.8,
      tank1_temp_c: 64.2,
      tank2_level_pct: 42.1,
      tank2_volume_m3: 84.2,
      tank3_level_pct: 91.5,
      tank3_volume_m3: 183.0,
      flow_rate_lpm: 432.0,
      total_accumulated_m3: 12480.5,
      valve_main_opening_pct: 85,
      safety_index_score: 99.1,
      leak_status: 'NORMAL',
      pump_rpm: 1450,
      series_flow: [380, 395, 410, 425, 430, 440, 435, 432, 438, 432],
      series_tank_compare: [78.4, 42.1, 91.5, 63.0],
      series_tank_names: ['A-101储罐', 'A-102储罐', 'B-201反应釜', 'C-301沉淀池']
    },
    fields: [
      { name: 'tank1_level_pct', type: 'number', label: '1号储罐液位 (%)', sample: 78.4 },
      { name: 'tank1_volume_m3', type: 'number', label: '1号储罐容量 (m³)', sample: 156.8 },
      { name: 'tank2_level_pct', type: 'number', label: '2号储罐液位 (%)', sample: 42.1 },
      { name: 'tank3_level_pct', type: 'number', label: '3号反应釜液位 (%)', sample: 91.5 },
      { name: 'flow_rate_lpm', type: 'number', label: '主管路流量 (L/min)', sample: 432.0 },
      { name: 'valve_main_opening_pct', type: 'number', label: '主阀门开度 (%)', sample: 85 },
      { name: 'safety_index_score', type: 'number', label: '安全指数', sample: 99.1 },
      { name: 'pump_rpm', type: 'number', label: '循环泵转速', sample: 1450 },
      { name: 'series_flow', type: 'array', label: '瞬时流量时序', sample: [380, 432] },
      { name: 'series_tank_compare', type: 'array', label: '储罐液位对比', sample: [78.4, 42.1, 91.5] }
    ]
  },
  {
    id: 'ds-energy-grid',
    name: '工业微电网与新能源负荷 (Industrial Energy Grid)',
    description: '光伏并网发电、储能SOC电量、厂区负荷率及碳排放减量指标',
    type: 'mock',
    updateIntervalMs: 3000,
    isStreaming: true,
    data: {
      solar_power_kw: 1420.8,
      grid_import_kw: 520.4,
      battery_soc_pct: 82.5,
      battery_power_kw: 150.0,
      total_load_kw: 1941.2,
      power_factor: 0.98,
      today_green_kwh: 12450,
      carbon_reduction_ton: 11.2,
      cost_savings_cny: 16800,
      grid_frequency_hz: 50.02,
      grid_voltage_v: 382.4,
      series_solar: [800, 950, 1100, 1250, 1380, 1420, 1450, 1410, 1390, 1420.8],
      series_load: [1600, 1750, 1820, 1900, 1950, 1920, 1960, 1940, 1930, 1941.2],
      series_battery_soc: [65, 68, 72, 75, 78, 80, 82, 83, 82.5, 82.5]
    },
    fields: [
      { name: 'solar_power_kw', type: 'number', label: '光伏实时出力 (kW)', sample: 1420.8 },
      { name: 'battery_soc_pct', type: 'number', label: '储能电池SOC (%)', sample: 82.5 },
      { name: 'total_load_kw', type: 'number', label: '厂区总用电负荷 (kW)', sample: 1941.2 },
      { name: 'power_factor', type: 'number', label: '电网功率因数', sample: 0.98 },
      { name: 'carbon_reduction_ton', type: 'number', label: '今日减碳 (吨)', sample: 11.2 },
      { name: 'grid_frequency_hz', type: 'number', label: '电网频率 (Hz)', sample: 50.02 }
    ]
  },
  {
    id: 'ds-industrial-alarms',
    name: '工控系统实时报警与事件 (SCADA Incident Log)',
    description: '关键PLC节点、传感器超限事件与预警流水',
    type: 'mock',
    updateIntervalMs: 4000,
    isStreaming: true,
    data: {
      active_critical_count: 1,
      active_warning_count: 3,
      system_health_rate: 98.6,
      alarms: [
        { id: 'AL-1092', level: 'CRITICAL', device: '3#反应釜搅拌机', message: '电机轴承温度超限达到 88.4°C (阈值 80°C)', time: '14:28:12', status: 'UNRESOLVED' },
        { id: 'AL-1091', level: 'WARNING', device: 'A区进料主管路', message: '流速瞬时波动超过 ±12%', time: '14:25:40', status: 'PENDING' },
        { id: 'AL-1090', level: 'WARNING', device: '空压站 2#冷干机', message: '排气露点略有上升', time: '14:19:05', status: 'MONITORING' },
        { id: 'AL-1089', level: 'INFO', device: 'AGV-04 搬运机器人', message: '电量低于 20%，已自动前往充电桩', time: '14:12:30', status: 'COMPLETED' },
        { id: 'AL-1088', level: 'NORMAL', device: '5#总装机床', message: '批次刀具寿命自检正常', time: '14:02:11', status: 'CLOSED' }
      ]
    },
    fields: [
      { name: 'active_critical_count', type: 'number', label: '严重告警数', sample: 1 },
      { name: 'active_warning_count', type: 'number', label: '预警事件数', sample: 3 },
      { name: 'system_health_rate', type: 'number', label: '系统健康度 (%)', sample: 98.6 },
      { name: 'alarms', type: 'array', label: '报警列表事件流', sample: [] }
    ]
  }
];

// Helper function to tick dynamic dataset values realistically
export function tickDataset(dataset: DatasetItem): DatasetItem {
  if (dataset.type !== 'mock' || !dataset.isStreaming) return dataset;

  const newData = { ...dataset.data, timestamp: new Date().toLocaleTimeString() };

  // Fluctuations with clamp
  const fluc = (val: number, range: number, min = 0, max = 999999) => {
    const delta = (Math.random() - 0.5) * 2 * range;
    const res = +(val + delta).toFixed(1);
    return Math.min(Math.max(res, min), max);
  };

  if (dataset.id === 'ds-factory-telemetry') {
    newData.temperature_c = fluc(newData.temperature_c, 0.4, 30, 85);
    newData.pressure_kpa = fluc(newData.pressure_kpa, 2.5, 200, 450);
    newData.spindle_speed_rpm = Math.round(fluc(newData.spindle_speed_rpm, 25, 2800, 4200));
    newData.power_consumption_kw = fluc(newData.power_consumption_kw, 5.0, 500, 1200);
    newData.oee_efficiency_pct = fluc(newData.oee_efficiency_pct, 0.2, 80, 99.9);
    newData.daily_yield_units = Math.round(newData.daily_yield_units + Math.floor(Math.random() * 3));
    
    // Shift time series
    if (Array.isArray(newData.series_power)) {
      const p = [...newData.series_power.slice(1), newData.power_consumption_kw];
      newData.series_power = p;
    }
    if (Array.isArray(newData.series_temp)) {
      const t = [...newData.series_temp.slice(1), newData.temperature_c];
      newData.series_temp = t;
    }
  } else if (dataset.id === 'ds-chemical-tanks') {
    newData.tank1_level_pct = fluc(newData.tank1_level_pct, 0.3, 10, 98);
    newData.tank2_level_pct = fluc(newData.tank2_level_pct, 0.2, 5, 95);
    newData.tank3_level_pct = fluc(newData.tank3_level_pct, 0.1, 20, 99);
    newData.flow_rate_lpm = fluc(newData.flow_rate_lpm, 3.5, 300, 600);
    newData.total_accumulated_m3 = +(newData.total_accumulated_m3 + (newData.flow_rate_lpm / 60000)).toFixed(2);
    if (Array.isArray(newData.series_flow)) {
      newData.series_flow = [...newData.series_flow.slice(1), newData.flow_rate_lpm];
    }
  } else if (dataset.id === 'ds-energy-grid') {
    newData.solar_power_kw = fluc(newData.solar_power_kw, 12.0, 200, 2000);
    newData.total_load_kw = fluc(newData.total_load_kw, 8.0, 1000, 2500);
    newData.battery_soc_pct = fluc(newData.battery_soc_pct, 0.05, 10, 100);
    if (Array.isArray(newData.series_solar)) {
      newData.series_solar = [...newData.series_solar.slice(1), newData.solar_power_kw];
    }
    if (Array.isArray(newData.series_load)) {
      newData.series_load = [...newData.series_load.slice(1), newData.total_load_kw];
    }
  }

  return {
    ...dataset,
    data: newData
  };
}
