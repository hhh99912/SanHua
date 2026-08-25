<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const tankState = computed(() => {
  const { data, style, customProps } = props.component;
  const boundDataset = props.datasets?.find(d => d.id === data.datasetId);
  const activeData = boundDataset?.data || data.staticData || {};

  const level = Number(
    (data.mapping.valueKey && activeData[data.mapping.valueKey]) ?? 
    activeData.tank_a_level ?? 
    customProps?.level ?? 
    68
  );

  const temp = Number(activeData.tank_a_temp ?? customProps?.temperature ?? 42.5);
  const capacity = customProps?.capacity || 10000;
  const currentVolume = Math.round((level / 100) * capacity);
  const themeColor = style.fill || '#00f2ff';

  const isWarning = level > 85 || level < 15;
  const liquidColor = isWarning ? '#ef4444' : themeColor;

  return {
    level,
    temp,
    capacity,
    currentVolume,
    themeColor,
    isWarning,
    liquidColor
  };
});
</script>

<template>
  <div 
    class="w-full h-full p-2 flex flex-col items-center justify-between relative select-none rounded-xl border border-slate-800 bg-[#060b14]/90 overflow-hidden"
    :style="{ borderColor: withAlpha(tankState.themeColor, 0.25) }"
  >
    <!-- Top Cap (Tank Inflow) -->
    <div class="w-1/3 h-2 bg-slate-700 rounded-t border border-slate-600 flex items-center justify-center">
      <div class="w-2 h-1 bg-cyan-400 rounded-full animate-pulse" />
    </div>

    <!-- Main Tank Body -->
    <div 
      class="flex-1 w-full relative rounded-lg border-2 border-slate-700/80 bg-slate-950/80 overflow-hidden flex flex-col justify-end shadow-inner"
      :style="{ borderColor: withAlpha(tankState.themeColor, 0.4) }"
    >
      <!-- Graduated ruler ticks on side -->
      <div class="absolute top-2 left-1 bottom-2 w-3 flex flex-col justify-between pointer-events-none z-20">
        <div v-for="tick in [100, 75, 50, 25, 0]" :key="tick" class="flex items-center gap-0.5">
          <div class="w-2 h-[1px] bg-slate-400/60" />
          <span class="text-[7px] font-mono text-slate-400 leading-none">{{ tick }}</span>
        </div>
      </div>

      <!-- Fluid Waves and Liquid Surface -->
      <div 
        class="w-full relative transition-all duration-700 ease-out"
        :style="{
          height: `${tankState.level}%`,
          backgroundColor: withAlpha(tankState.liquidColor, 0.2),
          borderTop: `2px solid ${tankState.liquidColor}`,
          boxShadow: `0 0 15px ${withAlpha(tankState.liquidColor, 0.4)}`
        }"
      >
        <!-- Animated top wave effect -->
        <div 
          class="absolute -top-3 left-0 right-0 h-4 opacity-50 overflow-hidden"
          style="background: radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.4) 0%, transparent 70%)"
        />
        
        <!-- Liquid Core Content -->
        <div 
          class="absolute inset-0 opacity-40"
          :style="{
            backgroundImage: `linear-gradient(to bottom, ${tankState.liquidColor}, transparent)`
          }"
        />
      </div>

      <!-- Center Digital Overlay -->
      <div class="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none drop-shadow-md">
        <div 
          class="text-xl font-mono font-black tracking-tight"
          :style="{ color: tankState.liquidColor, textShadow: `0 0 8px ${tankState.liquidColor}` }"
        >
          {{ tankState.level }}%
        </div>
        <div class="text-[9px] font-mono text-slate-300">
          {{ tankState.currentVolume }} / {{ tankState.capacity }} L
        </div>
      </div>
    </div>

    <!-- Bottom Status Info Bar -->
    <div class="w-full mt-1.5 flex items-center justify-between text-[10px] font-mono border-t border-slate-800 pt-1 text-slate-300">
      <span class="text-slate-400 truncate max-w-[50%]">{{ component.name }}</span>
      <div class="flex items-center gap-1 font-bold" :class="tankState.isWarning ? 'text-red-400 animate-pulse' : 'text-emerald-400'">
        <span>{{ tankState.temp }}°C</span>
        <span>{{ tankState.isWarning ? '⚠️高危' : '●正常' }}</span>
      </div>
    </div>
  </div>
</template>
