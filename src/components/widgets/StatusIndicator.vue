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

const labelText = computed(() => style.value.indicatorLabel || '');
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
        label: indicatorState.value.statusText || '故障'
      };
    case 'warning':
      return {
        core: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.8)',
        shadow: '0 0 16px rgba(245, 158, 11, 0.8)',
        text: 'text-amber-400',
        label: indicatorState.value.statusText || '预警'
      };
    case 'standby':
      return {
        core: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.8)',
        shadow: '0 0 14px rgba(59, 130, 246, 0.7)',
        text: 'text-blue-400',
        label: indicatorState.value.statusText || '分闸'
      };
    case 'offline':
      return {
        core: '#64748b',
        glow: 'transparent',
        shadow: 'none',
        text: 'text-slate-500',
        label: '未投'
      };
    case 'normal':
    default:
      return {
        core: '#10b981',
        glow: 'rgba(16, 185, 129, 0.8)',
        shadow: '0 0 16px rgba(16, 185, 129, 0.8)',
        text: 'text-emerald-400',
        label: indicatorState.value.statusText || '合闸'
      };
  }
});
</script>

<template>
  <div class="w-full h-full flex items-center justify-center select-none overflow-hidden">
    <!-- Pure LED Lamp SVG tightly fitting 100% of bounding box -->
    <svg 
      viewBox="0 0 40 40" 
      class="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <!-- Metallic Outer Bezel Gradient -->
        <linearGradient :id="`bezel-${component.id}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <!-- Lamp Core Radial Gradient -->
        <radialGradient :id="`core-${component.id}`" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="40%" :stop-color="stateColors.core" />
          <stop offset="100%" :stop-color="stateColors.core" stop-opacity="0.85" />
        </radialGradient>
      </defs>

      <!-- Outer Bezel Ring -->
      <circle cx="20" cy="20" r="19" :fill="`url(#bezel-${component.id})`" stroke="#334155" stroke-width="1.2" />
      <circle cx="20" cy="20" r="16.5" fill="#020617" stroke="#1e293b" stroke-width="1" />

      <!-- Glowing Light Core -->
      <circle 
        cx="20" 
        cy="20" 
        r="14.5" 
        :fill="`url(#core-${component.id})`"
        :style="{
          filter: `drop-shadow(0 0 6px ${stateColors.core})`
        }"
        :class="{
          'animate-pulse': blinkSpeed === 'slow',
          'animate-ping origin-center': blinkSpeed === 'fast'
        }"
      />

      <!-- Top Gloss Reflection Arc -->
      <ellipse cx="20" cy="11.5" rx="8" ry="4" fill="#ffffff" fill-opacity="0.35" />
    </svg>

    <!-- Optional Label if user explicitly configured one -->
    <div v-if="labelText" class="ml-2 text-xs font-bold text-slate-200 truncate">
      {{ labelText }}
    </div>
  </div>
</template>
