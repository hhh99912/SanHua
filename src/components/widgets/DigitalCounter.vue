<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { resolveComponentDynamicData, parseStrictNumber } from '../../utils/scadaResolver';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const counterState = computed(() => {
  const { style, customProps, type } = props.component;
  const dynamic = resolveComponentDynamicData(props.component, props.datasets);

  // Strict numeric conversion (reject text strings, format cleanly)
  const rawValue = dynamic.value !== undefined ? dynamic.value : (customProps?.value ?? 89420);
  const cleanNum = parseStrictNumber(rawValue, 0);

  const unit = dynamic.unit ?? customProps?.unit ?? (type === 'metric-progress' ? '%' : '');
  const title = dynamic.label ?? dynamic.title ?? customProps?.title ?? props.component.name;
  const themeColor = style?.textColor || style?.stroke || style?.fill || '#00f2ff';
  const prefix = customProps?.prefix || '';
  const isFlipper = type === 'metric-flipper';
  const isTitle = type === 'metric-title';
  const isProgress = type === 'metric-progress';

  // Format number digits
  const numStr = String(cleanNum);
  const digits = numStr.split('');

  return {
    rawValue: cleanNum,
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
  <!-- 1. Pure Large Title -->
  <div 
    v-if="counterState.isTitle"
    class="w-full h-full flex items-center justify-center select-none font-mono font-black tracking-widest leading-none overflow-hidden"
    :style="{ 
      color: counterState.themeColor,
      fontSize: component.style?.fontSize ? `${component.style.fontSize}px` : '24px'
    }"
  >
    {{ counterState.title }}
  </div>

  <!-- 2. Pure LED Matrix Flipper Display (Digits only, fits 100% bounds) -->
  <div 
    v-else-if="counterState.isFlipper"
    class="w-full h-full flex items-center justify-center gap-1 select-none overflow-hidden"
  >
    <div 
      v-for="(d, idx) in counterState.digits" 
      :key="idx"
      class="h-full aspect-2/3 bg-slate-950 rounded border border-cyan-500/70 flex items-center justify-center font-mono font-black text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.3)] relative overflow-hidden"
      :style="{ 
        fontSize: component.style?.fontSize ? `${component.style.fontSize}px` : '28px',
        borderColor: counterState.themeColor,
        color: counterState.themeColor
      }"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      <div class="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-900 z-10" />
      <span>{{ d }}</span>
    </div>
  </div>

  <!-- 3. Pure Progress Bar -->
  <div 
    v-else-if="counterState.isProgress"
    class="w-full h-full flex items-center justify-center p-0.5"
  >
    <div class="w-full h-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
      <div 
        class="h-full rounded-full transition-all duration-500"
        :style="{
          width: `${Math.min(100, Math.max(0, Number(counterState.rawValue)))}%`,
          backgroundColor: counterState.themeColor,
          boxShadow: `0 0 8px ${counterState.themeColor}`
        }"
      />
    </div>
  </div>

  <!-- 4. Pure Metric Display (Value + Optional Unit) -->
  <div 
    v-else
    class="w-full h-full flex items-center justify-center select-none font-mono font-bold leading-none overflow-hidden"
    :style="{
      color: counterState.themeColor,
      fontSize: component.style?.fontSize ? `${component.style.fontSize}px` : '22px'
    }"
  >
    <span>{{ counterState.prefix }}{{ counterState.rawValue }}</span>
    <span v-if="counterState.unit" class="text-[0.6em] ml-1 opacity-80">{{ counterState.unit }}</span>
  </div>
</template>
