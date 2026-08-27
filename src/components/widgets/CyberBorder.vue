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
  const color = style.stroke || style.fill || '#00f2ff';
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
  <!-- 1. Neon Glowing Cyber Border with 4 tech corner brackets (hollow middle) -->
  <div 
    v-if="borderState.type === 'deco-border-neon' || borderState.type === 'deco-border-tech'"
    class="w-full h-full relative select-none pointer-events-none"
  >
    <div 
      class="w-full h-full rounded-md border relative bg-transparent pointer-events-none"
      :style="{
        borderColor: withAlpha(borderState.color, 0.6),
        boxShadow: `0 0 10px ${withAlpha(borderState.color, 0.2)}, inset 0 0 10px ${withAlpha(borderState.color, 0.1)}`
      }"
    >
      <!-- 4 High-tech Corner brackets -->
      <div 
        class="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2"
        :style="{ borderColor: borderState.color }"
      />
      <div 
        class="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2"
        :style="{ borderColor: borderState.color }"
      />
      <div 
        class="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2"
        :style="{ borderColor: borderState.color }"
      />
      <div 
        class="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2"
        :style="{ borderColor: borderState.color }"
      />

      <!-- Optional Title Header -->
      <div 
        v-if="borderState.title"
        class="flex items-center gap-1.5 px-3 py-1 bg-[#060e1c]/90 border-b text-xs font-mono font-bold tracking-wider"
        :style="{ borderColor: withAlpha(borderState.color, 0.3), color: borderState.color }"
      >
        <div class="w-1.5 h-3 rounded-[2px]" :style="{ backgroundColor: borderState.color, boxShadow: `0 0 6px ${borderState.color}` }" />
        <span>{{ borderState.title }}</span>
      </div>
    </div>
  </div>

  <!-- 2. Industrial Hazard Yellow Stripe Border (hollow middle) -->
  <div 
    v-else-if="borderState.type === 'deco-hazard-stripe'"
    class="w-full h-full relative select-none pointer-events-none"
  >
    <div 
      class="w-full h-full rounded border-2 border-amber-500/80 relative bg-transparent pointer-events-none"
    >
      <!-- Top hazard line -->
      <div 
        class="h-2.5 w-full border-b border-amber-500/40"
        style="background-image: repeating-linear-gradient(45deg, #f59e0b, #f59e0b 8px, #0b0f19 8px, #0b0f19 16px);"
      />
      <!-- Bottom hazard line -->
      <div 
        class="absolute bottom-0 left-0 right-0 h-2.5 border-t border-amber-500/40"
        style="background-image: repeating-linear-gradient(45deg, #f59e0b, #f59e0b 8px, #0b0f19 8px, #0b0f19 16px);"
      />
    </div>
  </div>

  <!-- 3. Heavy Mech Tech Plate (hollow middle with 4 perimeter borders) -->
  <div 
    v-else
    class="w-full h-full relative select-none pointer-events-none"
  >
    <div 
      class="w-full h-full bg-transparent border-2 rounded-md relative pointer-events-none"
      :style="{ borderColor: withAlpha(borderState.color, 0.4), boxShadow: `0 0 8px ${withAlpha(borderState.color, 0.15)}` }"
    >
      <!-- Rivet bolts on 4 corners -->
      <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-cyan-400/80 border border-slate-900" />
      <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400/80 border border-slate-900" />
      <div class="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-cyan-400/80 border border-slate-900" />
      <div class="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400/80 border border-slate-900" />

      <div v-if="borderState.title" class="flex items-center gap-2 px-3 py-1 bg-[#060e1c]/90 border-b" :style="{ borderColor: withAlpha(borderState.color, 0.3) }">
        <div class="w-1.5 h-3 rounded-[2px]" :style="{ backgroundColor: borderState.color, boxShadow: `0 0 8px ${borderState.color}` }" />
        <span class="text-xs font-mono font-semibold tracking-wider text-cyan-200">
          {{ borderState.title }}
        </span>
      </div>
    </div>
  </div>
</template>
