<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const counterState = computed(() => {
  const { data, style, customProps, type } = props.component;
  const boundDataset = props.datasets?.find(d => d.id === data.datasetId);
  const activeData = boundDataset?.data || data.staticData || {};

  const rawValue = (data.mapping.valueKey && activeData[data.mapping.valueKey]) ?? 
    activeData.daily_output ?? 
    customProps?.value ?? 
    89420;

  const unit = data.mapping.unitKey ?? customProps?.unit ?? (type === 'metric-progress' ? '%' : '件');
  const title = (data.mapping.titleKey && activeData[data.mapping.titleKey]) ?? props.component.name;
  const themeColor = style.fill || '#00f2ff';
  const prefix = customProps?.prefix || '';
  const isFlipper = type === 'metric-flipper';
  const isTitle = type === 'metric-title';
  const isProgress = type === 'metric-progress';

  // Format number digits
  const numStr = String(rawValue);
  const digits = numStr.split('');

  return {
    rawValue,
    unit,
    title,
    themeColor,
    prefix,
    isFlipper,
    isTitle,
    isProgress,
    digits
  };
});
</script>

<template>
  <!-- 1. Big Screen Main Title Banner -->
  <div 
    v-if="counterState.isTitle"
    class="w-full h-full flex flex-col items-center justify-center relative select-none"
  >
    <div 
      class="text-xl md:text-2xl font-mono font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-cyan-400 drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]"
      :style="{ fontSize: `${component.style.fontSize || 24}px` }"
    >
      {{ counterState.title }}
    </div>
    <div class="flex items-center gap-2 mt-1 w-2/3">
      <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500 to-cyan-300" />
      <div class="w-1.5 h-1.5 rotate-45 bg-cyan-400 shadow-[0_0_8px_#00f2ff]" />
      <div class="h-[1px] flex-1 bg-gradient-to-l from-transparent via-cyan-500 to-cyan-300" />
    </div>
  </div>

  <!-- 2. LED Matrix Flipper Display -->
  <div 
    v-else-if="counterState.isFlipper"
    class="w-full h-full p-3 rounded-xl bg-[#080d1a] border border-cyan-500/40 flex flex-col justify-between shadow-[0_0_20px_rgba(0,242,255,0.15)] relative overflow-hidden"
  >
    <div class="flex items-center justify-between text-xs font-mono text-slate-300">
      <span class="text-cyan-400 font-bold flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        {{ counterState.title }}
      </span>
      <span class="text-[10px] text-slate-400 font-mono">单位: {{ counterState.unit }}</span>
    </div>

    <!-- LED Digits Flip Board -->
    <div class="flex items-center justify-center gap-1.5 my-2">
      <div 
        v-for="(d, idx) in counterState.digits" 
        :key="idx"
        class="w-8 h-12 bg-slate-950 rounded border border-cyan-500/60 flex items-center justify-center text-2xl font-mono font-black text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.3)] relative overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div class="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-900 z-10" />
        <span>{{ d }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1">
      <span class="text-emerald-400">▲ +12.4% 环比上升</span>
      <span>目标完成率 98.2%</span>
    </div>
  </div>

  <!-- 3. Standard Metric Card (Compact & Tight Border) -->
  <div 
    v-else
    class="w-full h-full p-1.5 rounded-lg bg-[#080e1a]/95 border border-slate-800 flex flex-col justify-center relative overflow-hidden shadow-sm"
    :style="{ borderColor: `${counterState.themeColor}60` }"
  >
    <div v-if="component.height > 50" class="flex items-center justify-between mb-0.5">
      <div class="flex items-center gap-1">
        <div class="w-1 h-2 bg-cyan-400 rounded-xs shadow-[0_0_4px_#00f2ff]" />
        <span class="text-[11px] font-mono font-semibold tracking-tight text-cyan-200 truncate">
          {{ counterState.title }}
        </span>
      </div>
    </div>

    <div class="flex items-baseline gap-1 my-0 leading-none">
      <span 
        class="text-lg md:text-xl font-mono font-black tracking-tight leading-none"
        :style="{ color: counterState.themeColor, textShadow: `0 0 8px ${counterState.themeColor}80` }"
      >
        {{ counterState.prefix }}{{ counterState.rawValue }}
      </span>
      <span class="text-[11px] font-mono text-slate-400 leading-none">{{ counterState.unit }}</span>
    </div>

    <!-- Progress bar if metric-progress -->
    <div v-if="counterState.isProgress" class="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-slate-800 mt-1">
      <div 
        class="h-full rounded-full transition-all duration-500"
        :style="{
          width: `${Math.min(100, Math.max(0, Number(counterState.rawValue)))}%`,
          backgroundColor: counterState.themeColor,
          boxShadow: `0 0 6px ${counterState.themeColor}`
        }"
      />
    </div>
  </div>
</template>
