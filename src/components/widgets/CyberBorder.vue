<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent } from '../../types';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
}

const props = defineProps<Props>();

const borderState = computed(() => {
  const { type, style, width, height } = props.component;
  const color = style.fill || style.stroke || '#00f2ff';
  const title = style.textColor ? props.component.name : null;

  return {
    type,
    color,
    title,
    width,
    height
  };
});
</script>

<template>
  <!-- 1. Neon Glowing Cyber Border with 4 tech corner brackets -->
  <div 
    v-if="borderState.type === 'deco-border-neon'"
    class="w-full h-full relative p-2 select-none"
  >
    <div 
      class="w-full h-full rounded-lg border bg-[#080e1a]/80 backdrop-blur-xs relative overflow-hidden"
      :style="{
        borderColor: withAlpha(borderState.color, 0.5),
        boxShadow: `0 0 15px ${withAlpha(borderState.color, 0.15)}, inset 0 0 15px ${withAlpha(borderState.color, 0.08)}`
      }"
    >
      <!-- 4 High-tech Corner brackets -->
      <div 
        class="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2"
        :style="{ borderColor: borderState.color }"
      />
      <div 
        class="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2"
        :style="{ borderColor: borderState.color }"
      />
      <div 
        class="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2"
        :style="{ borderColor: borderState.color }"
      />
      <div 
        class="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2"
        :style="{ borderColor: borderState.color }"
      />

      <!-- Optional Title Header -->
      <div 
        v-if="borderState.title"
        class="flex items-center gap-1.5 px-3 py-1.5 border-b text-xs font-mono font-bold tracking-wider"
        :style="{ borderColor: withAlpha(borderState.color, 0.2), color: borderState.color }"
      >
        <div class="w-1.5 h-3 rounded-[2px]" :style="{ backgroundColor: borderState.color }" />
        <span>{{ borderState.title }}</span>
      </div>
    </div>
  </div>

  <!-- 2. Industrial Hazard Yellow Stripe Border -->
  <div 
    v-else-if="borderState.type === 'deco-hazard-stripe'"
    class="w-full h-full relative p-1 select-none"
  >
    <div 
      class="w-full h-full rounded border-2 border-amber-500/80 relative overflow-hidden p-2 bg-[#0d0f14]/90"
      style="background-image: repeating-linear-gradient(45deg, #f59e0b15, #f59e0b15 10px, transparent 10px, transparent 20px);"
    >
      <div class="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
        <span>⚠️ CAUTION // INDUSTRIAL SAFETY ZONE</span>
      </div>
    </div>
  </div>

  <!-- 3. Heavy Mech Tech Plate -->
  <div 
    v-else
    class="w-full h-full relative select-none p-2"
  >
    <div 
      class="w-full h-full bg-[#0a1120]/90 border rounded-lg p-2.5 relative flex flex-col justify-between"
      :style="{ borderColor: withAlpha(borderState.color, 0.25), boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }"
    >
      <!-- Rivet bolts on 4 corners -->
      <div class="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-700" />
      <div class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-700" />
      <div class="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-700" />
      <div class="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 border border-slate-700" />

      <div v-if="borderState.title" class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b" :style="{ borderColor: withAlpha(borderState.color, 0.2) }">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-3 rounded-[2px]" :style="{ backgroundColor: borderState.color, boxShadow: `0 0 8px ${borderState.color}` }" />
          <span class="text-xs font-mono font-semibold tracking-wider text-cyan-200">
            {{ borderState.title }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
