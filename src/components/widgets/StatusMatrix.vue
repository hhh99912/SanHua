<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const defaultDevices = [
  { id: 'dev-1', name: '1#数控CNC', status: 'RUNNING', temp: '48°C', load: '82%' },
  { id: 'dev-2', name: '2#冲压机床', status: 'RUNNING', temp: '52°C', load: '91%' },
  { id: 'dev-3', name: '3#焊接机械臂', status: 'WARNING', temp: '74°C', load: '98%' },
  { id: 'dev-4', name: '4#注塑成型', status: 'RUNNING', temp: '41°C', load: '65%' },
  { id: 'dev-5', name: '5#回流焊炉', status: 'STOPPED', temp: '25°C', load: '0%' },
  { id: 'dev-6', name: '6#激光切割', status: 'RUNNING', temp: '46°C', load: '78%' },
];

const matrixState = computed(() => {
  const { data, style } = props.component;
  const boundDataset = props.datasets?.find(d => d.id === data.datasetId);
  const activeData = boundDataset?.data || data.staticData || {};

  const devices = activeData.devices || defaultDevices;
  const themeColor = style.fill || '#00f2ff';
  const title = props.component.name || '车间智能设备矩阵工况';

  return {
    devices,
    themeColor,
    title
  };
});
</script>

<template>
  <div 
    class="w-full h-full p-2.5 rounded-xl bg-[#080d18]/95 border border-slate-800 flex flex-col justify-between select-none shadow-xl overflow-hidden"
    :style="{ borderColor: withAlpha(matrixState.themeColor, 0.25) }"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
      <div class="flex items-center gap-1.5">
        <div class="w-1.5 h-3 bg-cyan-400 rounded-[2px]" />
        <span class="text-xs font-mono font-bold text-cyan-200 tracking-wider">
          {{ matrixState.title }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-[10px] font-mono">
        <span class="text-emerald-400">● 运行中</span>
        <span class="text-amber-400">▲ 预警</span>
        <span class="text-slate-500">○ 停机</span>
      </div>
    </div>

    <!-- Matrix Cells Grid -->
    <div class="grid grid-cols-3 gap-2 flex-1 overflow-hidden">
      <div
        v-for="dev in matrixState.devices"
        :key="dev.id"
        class="p-2 rounded bg-slate-950/80 border text-[10px] font-mono flex flex-col justify-between transition-all hover:scale-[1.02]"
        :class="{
          'border-emerald-500/40 text-emerald-300': dev.status === 'RUNNING',
          'border-amber-500/60 text-amber-300 animate-pulse': dev.status === 'WARNING',
          'border-slate-800 text-slate-500': dev.status === 'STOPPED'
        }"
      >
        <div class="flex items-center justify-between font-bold">
          <span class="truncate">{{ dev.name }}</span>
          <span 
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-emerald-400 shadow-[0_0_6px_#10b981]': dev.status === 'RUNNING',
              'bg-amber-400 shadow-[0_0_6px_#f59e0b]': dev.status === 'WARNING',
              'bg-slate-600': dev.status === 'STOPPED'
            }"
          />
        </div>
        <div class="flex items-center justify-between mt-1 text-[9px] text-slate-400">
          <span>负荷: {{ dev.load }}</span>
          <span>{{ dev.temp }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
