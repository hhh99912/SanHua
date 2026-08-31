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

// High-contrast, bright color palettes for LED
const stateColors = computed(() => {
  switch (indicatorState.value.stateType) {
    case 'alarm':
      return {
        core: '#ff3344',
        glow: 'rgba(255, 51, 68, 0.95)',
        shadow: '0 0 16px rgba(255, 51, 68, 0.95)',
        text: 'text-red-300',
        label: indicatorState.value.statusText || '故障'
      };
    case 'warning':
      return {
        core: '#ffb703',
        glow: 'rgba(255, 183, 3, 0.95)',
        shadow: '0 0 16px rgba(255, 183, 3, 0.95)',
        text: 'text-amber-300',
        label: indicatorState.value.statusText || '预警'
      };
    case 'standby':
      return {
        core: '#00f2ff',
        glow: 'rgba(0, 242, 255, 0.9)',
        shadow: '0 0 14px rgba(0, 242, 255, 0.85)',
        text: 'text-cyan-300',
        label: indicatorState.value.statusText || '分闸'
      };
    case 'offline':
      return {
        core: '#94a3b8',
        glow: 'rgba(148, 163, 184, 0.5)',
        shadow: '0 0 8px rgba(148, 163, 184, 0.4)',
        text: 'text-slate-200',
        label: '未投'
      };
    case 'normal':
    default:
      return {
        core: '#00e676',
        glow: 'rgba(0, 230, 118, 0.95)',
        shadow: '0 0 16px rgba(0, 230, 118, 0.95)',
        text: 'text-emerald-300',
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
        <!-- High-Contrast Metallic Outer Bezel -->
        <linearGradient :id="`bezel-${component.id}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#475569" />
        </linearGradient>
        <!-- Lamp Core Radial Gradient -->
        <radialGradient :id="`core-${component.id}`" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="35%" :stop-color="stateColors.core" />
          <stop offset="100%" :stop-color="stateColors.core" stop-opacity="0.95" />
        </radialGradient>
      </defs>

      <!-- Outer Bezel Ring (Bright and crisp) -->
      <circle cx="20" cy="20" r="19" :fill="`url(#bezel-${component.id})`" stroke="#64748b" stroke-width="1" />
      <circle cx="20" cy="20" r="16.5" fill="#020617" stroke="#38bdf8" stroke-width="0.8" stroke-opacity="0.6" />

      <!-- Glowing Light Core -->
      <circle 
        cx="20" 
        cy="20" 
        r="14.5" 
        :fill="`url(#core-${component.id})`"
        :style="{
          filter: `drop-shadow(0 0 8px ${stateColors.core})`
        }"
        :class="{
          'animate-pulse': blinkSpeed === 'slow',
          'animate-ping origin-center': blinkSpeed === 'fast'
        }"
      />

      <!-- Top Gloss Reflection Arc -->
      <ellipse cx="20" cy="11.5" rx="8" ry="4" fill="#ffffff" fill-opacity="0.45" />
    </svg>

    <!-- Optional Label if user explicitly configured one -->
    <div v-if="labelText" class="ml-2 text-xs font-bold text-white truncate">
      {{ labelText }}
    </div>
  </div>
</template>
