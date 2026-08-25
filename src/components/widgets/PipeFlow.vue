<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const pipeState = computed(() => {
  const { data, style, customProps, animation } = props.component;
  const boundDataset = props.datasets?.find(d => d.id === data.datasetId);
  const activeData = boundDataset?.data || data.staticData || {};

  const flowRate = Number(
    (data.mapping.valueKey && activeData[data.mapping.valueKey]) ?? 
    activeData.pipeline_flow_a ?? 
    customProps?.flowRate ?? 
    240
  );

  const status = (data.mapping.statusKey && activeData[data.mapping.statusKey]) ?? customProps?.status ?? 'FLOWING';
  const color = style.fill || '#00f2ff';
  const isHorizontal = props.component.width >= props.component.height;
  const isFlowing = status === 'FLOWING' || status === 'NORMAL' || status === true;

  return {
    flowRate,
    status,
    color,
    isHorizontal,
    isFlowing,
    speed: animation?.speed || 2
  };
});
</script>

<template>
  <div class="w-full h-full relative select-none flex items-center justify-center p-1">
    <!-- Horizontal Pipe -->
    <div 
      v-if="pipeState.isHorizontal"
      class="w-full h-8 bg-slate-900 rounded-full border-2 border-slate-700 relative overflow-hidden flex items-center shadow-lg"
      :style="{ borderColor: withAlpha(pipeState.color, 0.5) }"
    >
      <!-- Flow animation stream -->
      <div 
        v-if="pipeState.isFlowing"
        class="absolute inset-0 flex"
        style="animation: flowRight 2s linear infinite;"
      >
        <div 
          v-for="i in 12" 
          :key="i"
          class="h-full w-8 shrink-0 flex items-center justify-center opacity-75"
        >
          <div 
            class="w-3 h-2 rounded-full"
            :style="{ backgroundColor: pipeState.color, boxShadow: `0 0 6px ${pipeState.color}` }"
          />
        </div>
      </div>

      <!-- Pipe Joint Flanges -->
      <div class="absolute left-4 top-0 bottom-0 w-1.5 bg-slate-400/80 rounded-[2px] z-10" />
      <div class="absolute right-4 top-0 bottom-0 w-1.5 bg-slate-400/80 rounded-[2px] z-10" />

      <!-- Center Valve Symbol -->
      <div class="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/40">
        <span class="text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap">
          {{ pipeState.flowRate }} m³/h
        </span>
      </div>
    </div>

    <!-- Vertical Pipe -->
    <div 
      v-else
      class="h-full w-8 bg-slate-900 rounded-full border-2 border-slate-700 relative overflow-hidden flex justify-center shadow-lg"
      :style="{ borderColor: withAlpha(pipeState.color, 0.5) }"
    >
      <div 
        v-if="pipeState.isFlowing"
        class="absolute inset-0 flex flex-col justify-around items-center"
      >
        <div 
          v-for="i in 6" 
          :key="i"
          class="w-2 h-3 rounded-full opacity-75 animate-bounce"
          :style="{ backgroundColor: pipeState.color, boxShadow: `0 0 6px ${pipeState.color}` }"
        />
      </div>
      <div class="absolute top-4 left-0 right-0 h-1.5 bg-slate-400/80 rounded-[2px] z-10" />
      <div class="absolute bottom-4 left-0 right-0 h-1.5 bg-slate-400/80 rounded-[2px] z-10" />
    </div>
  </div>
</template>
