<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { resolveTeleSignalState } from '../../utils/scadaResolver';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const style = computed(() => props.component.style || {});
const mapping = computed(() => props.component.data?.mapping || {});

const indicatorState = computed(() => {
  const sKey = mapping.value.statusKey || mapping.value.stateKey || mapping.value.valueKey;
  const defaultVal = style.value.indicatorState || 'normal';

  const resolved = resolveTeleSignalState(props.datasets, props.component.data?.datasetId, sKey, defaultVal);
  
  let stateType: 'normal' | 'alarm' | 'warning' | 'standby' | 'offline' = 'normal';
  if (resolved.isFault) stateType = 'alarm';
  else if (resolved.isTest) stateType = 'standby';
  else if (resolved.isClosed) stateType = 'normal';
  else if (resolved.isOpen) stateType = 'standby';
  else if (style.value.indicatorState) stateType = style.value.indicatorState;

  return {
    stateType,
    statusText: resolved.statusText,
    color: resolved.color,
    numericValue: resolved.numericValue
  };
});

const labelText = computed(() => style.value.indicatorLabel || props.component.name || '运行指示');
const shape = computed(() => style.value.indicatorShape || 'circle');
const blinkSpeed = computed(() => style.value.indicatorBlinkSpeed || (indicatorState.value.stateType === 'alarm' ? 'fast' : 'none'));

// Color palettes for LED
const stateColors = computed(() => {
  switch (indicatorState.value.stateType) {
    case 'alarm':
      return {
        core: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.8)',
        shadow: '0 0 16px rgba(239, 68, 68, 0.9)',
        text: 'text-red-400',
        label: indicatorState.value.statusText || '故障告警'
      };
    case 'warning':
      return {
        core: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.8)',
        shadow: '0 0 16px rgba(245, 158, 11, 0.8)',
        text: 'text-amber-400',
        label: indicatorState.value.statusText || '越限预警'
      };
    case 'standby':
      return {
        core: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.8)',
        shadow: '0 0 14px rgba(59, 130, 246, 0.7)',
        text: 'text-blue-400',
        label: indicatorState.value.statusText || '分闸/备用'
      };
    case 'offline':
      return {
        core: '#64748b',
        glow: 'transparent',
        shadow: 'none',
        text: 'text-slate-500',
        label: '未投入'
      };
    case 'normal':
    default:
      return {
        core: '#10b981',
        glow: 'rgba(16, 185, 129, 0.8)',
        shadow: '0 0 16px rgba(16, 185, 129, 0.8)',
        text: 'text-emerald-400',
        label: indicatorState.value.statusText || '合闸/正常'
      };
  }
});
</script>

<template>
  <div class="w-full h-full flex items-center justify-center gap-1.5 p-0.5 select-none font-mono leading-none">
    <!-- LED Light Core with Metallic Bezel -->
    <div 
      class="relative shrink-0 flex items-center justify-center p-[1.5px] rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-slate-950 border border-slate-600 shadow-xs"
      :style="{
        width: `${Math.min(component.width, component.height) - 4}px`,
        height: `${Math.min(component.width, component.height) - 4}px`
      }"
    >
      <div 
        class="w-full h-full rounded-full transition-all duration-300 relative overflow-hidden"
        :class="{
          'animate-pulse': blinkSpeed === 'slow',
          'animate-ping': blinkSpeed === 'fast'
        }"
        :style="{
          backgroundColor: stateColors.core,
          boxShadow: stateColors.shadow
        }"
      >
        <!-- Top gloss highlight -->
        <div class="absolute top-0.5 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-white/40 rounded-full blur-[0.5px]" />
      </div>
    </div>

    <!-- Optional Text Label beside or underneath -->
    <div v-if="component.width >= 70" class="flex-1 min-w-0 leading-tight">
      <div class="text-[11px] font-bold truncate text-slate-200 leading-tight">{{ labelText }}</div>
      <div class="text-[9px] font-mono leading-none" :class="stateColors.text">{{ stateColors.label }}</div>
    </div>
  </div>
</template>
