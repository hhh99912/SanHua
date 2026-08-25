<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  width: number;
  height: number;
  zoom: number;
  scrollX?: number;
  scrollY?: number;
  cursorPos?: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  scrollX: 0,
  scrollY: 0,
  cursorPos: () => ({ x: 0, y: 0 })
});

// Generate tick marks along horizontal axis
const xTicks = computed(() => {
  const step = props.zoom < 0.4 ? 200 : props.zoom < 0.8 ? 100 : 50;
  const ticks: number[] = [];
  for (let x = 0; x <= props.width; x += step) {
    ticks.push(x);
  }
  return ticks;
});

// Generate tick marks along vertical axis
const yTicks = computed(() => {
  const step = props.zoom < 0.4 ? 200 : props.zoom < 0.8 ? 100 : 50;
  const ticks: number[] = [];
  for (let y = 0; y <= props.height; y += step) {
    ticks.push(y);
  }
  return ticks;
});
</script>

<template>
  <!-- Top Horizontal Ruler -->
  <div 
    class="absolute top-0 left-6 right-0 h-6 bg-[#080e1a] border-b border-cyan-500/30 overflow-hidden pointer-events-none select-none z-20"
    :style="{ width: `${width * zoom}px` }"
  >
    <svg :width="width * zoom" height="24" class="w-full h-full">
      <g 
        v-for="x in xTicks" 
        :key="`xtick-${x}`"
        :transform="`translate(${x * zoom}, 0)`"
      >
        <line x1="0" y1="14" x2="0" y2="24" stroke="rgba(0, 242, 255, 0.4)" stroke-width="1" />
        <line x1="0" y1="18" x2="0" y2="24" stroke="rgba(0, 242, 255, 0.2)" stroke-width="1" />
        <text
          x="3"
          y="11"
          fill="#94a3b8"
          font-size="9"
          font-family="monospace"
          class="select-none"
        >
          {{ x }}
        </text>
      </g>
      <!-- Cursor Guide X -->
      <line
        :x1="cursorPos.x * zoom"
        y1="0"
        :x2="cursorPos.x * zoom"
        y2="24"
        stroke="#00f2ff"
        stroke-width="1.5"
      />
    </svg>
  </div>

  <!-- Left Vertical Ruler -->
  <div 
    class="absolute top-6 left-0 bottom-0 w-6 bg-[#080e1a] border-r border-cyan-500/30 overflow-hidden pointer-events-none select-none z-20"
    :style="{ height: `${height * zoom}px` }"
  >
    <svg width="24" :height="height * zoom" class="w-full h-full">
      <g 
        v-for="y in yTicks" 
        :key="`ytick-${y}`"
        :transform="`translate(0, ${y * zoom})`"
      >
        <line x1="14" y1="0" x2="24" y2="0" stroke="rgba(0, 242, 255, 0.4)" stroke-width="1" />
        <line x1="18" y1="0" x2="24" y2="0" stroke="rgba(0, 242, 255, 0.2)" stroke-width="1" />
        <text
          x="2"
          y="12"
          fill="#94a3b8"
          font-size="8"
          font-family="monospace"
          class="select-none"
          transform="rotate(-90 2,12)"
        >
          {{ y }}
        </text>
      </g>
      <!-- Cursor Guide Y -->
      <line
        x1="0"
        :y1="cursorPos.y * zoom"
        x2="24"
        :y2="cursorPos.y * zoom"
        stroke="#00f2ff"
        stroke-width="1.5"
      />
    </svg>
  </div>

  <!-- Top-Left Origin Junction (0, 0) -->
  <div class="absolute top-0 left-0 w-6 h-6 bg-[#060a14] border-r border-b border-cyan-500/40 flex items-center justify-center text-[8px] font-mono text-cyan-400 font-bold z-30 select-none">
    px
  </div>
</template>
