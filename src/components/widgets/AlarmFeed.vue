<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const defaultAlarms = [
  { id: 'alm-1', level: 'CRITICAL', device: '3#反应釜', msg: '进料压力超限 (2.85MPa)', time: '10:42:15' },
  { id: 'alm-2', level: 'WARNING', device: '1#空压站', msg: '电机排气温度偏高 (84°C)', time: '10:39:02' },
  { id: 'alm-3', level: 'INFO', device: '配电总柜', msg: '自动切换备用回路成功', time: '10:31:40' },
  { id: 'alm-4', level: 'WARNING', device: '冷水机组', msg: '循环水流量过低 (14m³/h)', time: '10:25:11' },
];

const alarmState = computed(() => {
  const { data, style } = props.component;
  const boundDataset = props.datasets?.find(d => d.id === data.datasetId);
  const activeData = boundDataset?.data || data.staticData || {};

  const alarms = activeData.alarms || defaultAlarms;
  const themeColor = style.fill || '#ef4444';

  return {
    alarms,
    themeColor
  };
});
</script>

<template>
  <div 
    class="w-full h-full p-2.5 rounded-xl bg-[#0a0f1d]/95 border border-slate-800 flex flex-col justify-between select-none shadow-xl overflow-hidden"
    :style="{ borderColor: withAlpha(alarmState.themeColor, 0.3) }"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-red-500/20 pb-2 mb-1.5">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span class="text-xs font-mono font-bold text-red-300 tracking-wider">
          {{ component.name || 'SCADA 实时安防与工控预警' }}
        </span>
      </div>
      <span class="text-[10px] font-mono text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
        {{ alarmState.alarms.length }} 条活动告警
      </span>
    </div>

    <!-- Alarm stream list -->
    <div class="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
      <div
        v-for="alm in alarmState.alarms"
        :key="alm.id"
        class="p-1.5 rounded bg-slate-950/90 border text-[10px] font-mono flex items-center justify-between"
        :class="{
          'border-red-500/50 bg-red-950/20 text-red-200': alm.level === 'CRITICAL',
          'border-amber-500/50 bg-amber-950/20 text-amber-200': alm.level === 'WARNING',
          'border-blue-500/40 bg-blue-950/20 text-blue-200': alm.level === 'INFO'
        }"
      >
        <div class="flex items-center gap-1.5 overflow-hidden">
          <span 
            class="px-1 py-0.2 rounded text-[8px] font-bold shrink-0"
            :class="{
              'bg-red-500 text-slate-950': alm.level === 'CRITICAL',
              'bg-amber-500 text-slate-950': alm.level === 'WARNING',
              'bg-blue-500 text-slate-950': alm.level === 'INFO'
            }"
          >
            {{ alm.level }}
          </span>
          <span class="font-bold text-slate-300 shrink-0">{{ alm.device }}:</span>
          <span class="truncate text-slate-400">{{ alm.msg }}</span>
        </div>
        <span class="text-[9px] text-slate-500 shrink-0 ml-1">{{ alm.time }}</span>
      </div>
    </div>
  </div>
</template>
