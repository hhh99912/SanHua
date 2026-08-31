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
const customProps = computed(() => props.component.customProps || {});
const mapping = computed(() => props.component.data?.mapping || {});

// Resolve strictly 0 (Green) vs 1 (Red) state
const indicatorState = computed(() => {
  const sKey = mapping.value.statusKey || mapping.value.stateKey || mapping.value.valueKey;
  const defaultVal = customProps.value.state ?? style.value.indicatorState ?? 0;

  const resolved = resolveTeleSignalState(props.datasets, props.component.data?.datasetId, sKey, defaultVal);
  const numVal = resolved.numericValue;

  // 0: Green (分闸/停止/正常0状态), 1: Red (合闸/运行/带电1状态), 2: Yellow/Warning, 3/other: Gray
  let color = '#00e676'; // Default 0: Green
  let glow = 'rgba(0, 230, 118, 0.95)';
  let isBlinking = false;

  if (numVal === 1 || defaultVal === 1 || defaultVal === '1' || defaultVal === 'closed' || defaultVal === 'alarm') {
    color = '#ff2233'; // 1: Red
    glow = 'rgba(255, 34, 51, 0.95)';
  } else if (numVal === 0 || defaultVal === 0 || defaultVal === '0' || defaultVal === 'open' || defaultVal === 'normal') {
    color = '#00e676'; // 0: Green
    glow = 'rgba(0, 230, 118, 0.95)';
  } else if (numVal === 2 || defaultVal === 2 || defaultVal === '2' || defaultVal === 'warning') {
    color = '#ffaa00'; // 2: Yellow / Warning
    glow = 'rgba(255, 170, 0, 0.95)';
  } else if (numVal === 3 || defaultVal === 3 || defaultVal === '3' || defaultVal === 'offline') {
    color = '#64748b'; // 3: Offline / Gray
    glow = 'rgba(100, 116, 139, 0.4)';
  }

  // Allow custom override color from style.stroke or customProps.color
  if (customProps.value.color) {
    color = customProps.value.color;
    glow = `${color}cc`;
  }

  const blinkSpeed = customProps.value.blink || customProps.value.blinkSpeed || style.value.indicatorBlinkSpeed || 'none';
  if (blinkSpeed === 'auto') {
    isBlinking = numVal === 1 || numVal === 2;
  } else if (blinkSpeed === 'slow' || blinkSpeed === 'fast') {
    isBlinking = true;
  }

  return {
    numVal,
    color,
    glow,
    blinkSpeed,
    isBlinking
  };
});

// Indicator Style Type: 'bezel-circle' | 'flat-led' | 'square-lamp' | 'pill-tag'
const indicatorStyleType = computed(() => customProps.value.indicatorStyle || style.value.indicatorStyle || 'bezel-circle');
</script>

<template>
  <div class="w-full h-full flex items-center justify-center select-none overflow-hidden p-0.5">
    <!-- 1. STYLE: Square Pilot Lamp (工业方型信号指示灯 - 纯图元无文字) -->
    <div 
      v-if="indicatorStyleType === 'square-lamp'"
      class="w-full h-full flex items-center justify-center p-0.5"
    >
      <div 
        class="w-full h-full rounded-md border-2 p-1 flex items-center justify-center shadow-lg transition-all"
        :style="{
          borderColor: indicatorState.color,
          backgroundColor: '#030712',
          boxShadow: `0 0 16px ${indicatorState.glow}`
        }"
      >
        <div 
          class="w-full h-full rounded-xs transition-all"
          :style="{
            backgroundColor: indicatorState.color,
            boxShadow: `inset 0 0 8px rgba(255,255,255,0.7), 0 0 12px ${indicatorState.color}`
          }"
          :class="{
            'animate-pulse': indicatorState.blinkSpeed === 'slow',
            'animate-ping': indicatorState.blinkSpeed === 'fast'
          }"
        />
      </div>
    </div>

    <!-- 2. STYLE: Flat Modern High-Brightness LED (现代扁平发光LED - 纯图元无文字) -->
    <div 
      v-else-if="indicatorStyleType === 'flat-led'"
      class="w-full h-full flex items-center justify-center relative p-0.5"
    >
      <div 
        class="aspect-square w-full h-full max-w-full max-h-full rounded-full flex items-center justify-center relative shadow-lg"
        :style="{
          backgroundColor: '#030712',
          border: `2.5px solid ${indicatorState.color}`,
          boxShadow: `0 0 20px ${indicatorState.glow}`
        }"
      >
        <div 
          class="w-3/4 h-3/4 rounded-full transition-all"
          :style="{
            backgroundColor: indicatorState.color,
            boxShadow: `0 0 14px ${indicatorState.color}`
          }"
          :class="{
            'animate-pulse': indicatorState.blinkSpeed === 'slow',
            'animate-ping': indicatorState.blinkSpeed === 'fast'
          }"
        />
      </div>
    </div>

    <!-- 3. STYLE: Capsule / Pill Lamp (胶囊椭圆指示灯 - 纯图元无文字) -->
    <div 
      v-else-if="indicatorStyleType === 'pill-tag'"
      class="w-full h-full flex items-center justify-center p-0.5"
    >
      <div 
        class="w-full h-full rounded-full border-2 p-1 flex items-center justify-center shadow-lg transition-all"
        :style="{
          borderColor: indicatorState.color,
          backgroundColor: '#030712',
          boxShadow: `0 0 16px ${indicatorState.glow}`
        }"
      >
        <div 
          class="w-full h-full rounded-full transition-all"
          :style="{
            backgroundColor: indicatorState.color,
            boxShadow: `inset 0 0 6px rgba(255,255,255,0.7), 0 0 12px ${indicatorState.color}`
          }"
          :class="{
            'animate-pulse': indicatorState.blinkSpeed === 'slow',
            'animate-ping': indicatorState.blinkSpeed === 'fast'
          }"
        />
      </div>
    </div>

    <!-- 4. STYLE: Classic Metallic Bezel Circle Lamp (默认经典金属高光外圈信号灯 - 纯图元无文字) -->
    <div 
      v-else
      class="w-full h-full flex items-center justify-center min-w-0 min-h-0"
    >
      <svg 
        viewBox="0 0 40 40" 
        class="w-full h-full max-w-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <!-- High-Contrast Metallic Outer Bezel -->
          <linearGradient :id="`bezel-${component.id}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e2e8f0" />
            <stop offset="50%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <!-- Lamp Core Radial Gradient -->
          <radialGradient :id="`core-${component.id}`" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
            <stop offset="35%" :stop-color="indicatorState.color" />
            <stop offset="100%" :stop-color="indicatorState.color" stop-opacity="0.98" />
          </radialGradient>
        </defs>

        <!-- Outer Bezel Ring -->
        <circle cx="20" cy="20" r="19" :fill="`url(#bezel-${component.id})`" stroke="#94a3b8" stroke-width="0.8" />
        <circle cx="20" cy="20" r="16" fill="#020617" stroke="#38bdf8" stroke-width="0.8" stroke-opacity="0.5" />

        <!-- Glowing Light Core -->
        <circle 
          cx="20" 
          cy="20" 
          r="14" 
          :fill="`url(#core-${component.id})`"
          :style="{
            filter: `drop-shadow(0 0 8px ${indicatorState.color})`
          }"
          :class="{
            'animate-pulse': indicatorState.blinkSpeed === 'slow',
            'animate-ping origin-center': indicatorState.blinkSpeed === 'fast'
          }"
        />

        <!-- Top Gloss Reflection Arc -->
        <ellipse cx="20" cy="11.5" rx="7.5" ry="3.5" fill="#ffffff" fill-opacity="0.5" />
      </svg>
    </div>
  </div>
</template>
