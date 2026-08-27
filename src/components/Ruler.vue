<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  width: number;
  height: number;
  zoom: number;
  panOffset?: { x: number; y: number };
  cursorPos?: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  panOffset: () => ({ x: 0, y: 0 }),
  cursorPos: () => ({ x: 0, y: 0 })
});

// Step determination for ticks based on zoom level
const tickStep = computed(() => {
  if (props.zoom < 0.15) return 1000;
  if (props.zoom < 0.3) return 500;
  if (props.zoom < 0.6) return 200;
  if (props.zoom < 1.2) return 100;
  if (props.zoom < 2.5) return 50;
  return 20;
});

// Generate horizontal tick marks covering visible workspace
const horizontalTicks = computed(() => {
  const step = tickStep.value;
  const subStep = step / 5;
  const ticks: Array<{ value: number; pos: number; isMajor: boolean }> = [];
  
  // Calculate canvas range covering ruler:
  // rulerX = canvasX * zoom + panOffset.x - 24
  // canvasX = (rulerX + 24 - panOffset.x) / zoom
  const minCanvasX = Math.floor((-props.panOffset.x - 100) / (step * props.zoom)) * step;
  const maxCanvasX = Math.ceil((4000 - props.panOffset.x) / (step * props.zoom)) * step;

  for (let val = minCanvasX; val <= maxCanvasX; val += subStep) {
    const rx = Math.round(val * props.zoom + props.panOffset.x - 24);
    if (rx >= -50 && rx <= 3840) {
      const isMajor = Math.abs(val % step) < 0.001 || Math.abs(Math.abs(val % step) - step) < 0.001;
      ticks.push({ value: Math.round(val), pos: rx, isMajor });
    }
  }
  return ticks;
});

// Generate vertical tick marks covering visible workspace
const verticalTicks = computed(() => {
  const step = tickStep.value;
  const subStep = step / 5;
  const ticks: Array<{ value: number; pos: number; isMajor: boolean }> = [];

  const minCanvasY = Math.floor((-props.panOffset.y - 100) / (step * props.zoom)) * step;
  const maxCanvasY = Math.ceil((3000 - props.panOffset.y) / (step * props.zoom)) * step;

  for (let val = minCanvasY; val <= maxCanvasY; val += subStep) {
    const ry = Math.round(val * props.zoom + props.panOffset.y - 24);
    if (ry >= -50 && ry <= 3000) {
      const isMajor = Math.abs(val % step) < 0.001 || Math.abs(Math.abs(val % step) - step) < 0.001;
      ticks.push({ value: Math.round(val), pos: ry, isMajor });
    }
  }
  return ticks;
});

// Cursor Guide position on horizontal ruler (px from ruler left edge)
const cursorGuideX = computed(() => {
  return props.cursorPos.x * props.zoom + props.panOffset.x - 24;
});

// Cursor Guide position on vertical ruler (px from ruler top edge)
const cursorGuideY = computed(() => {
  return props.cursorPos.y * props.zoom + props.panOffset.y - 24;
});

// Active Screen Canvas highlight span on rulers
const canvasBoundsOnRuler = computed(() => {
  const x1 = 0 * props.zoom + props.panOffset.x - 24;
  const x2 = props.width * props.zoom + props.panOffset.x - 24;
  const y1 = 0 * props.zoom + props.panOffset.y - 24;
  const y2 = props.height * props.zoom + props.panOffset.y - 24;
  return { x1, x2, y1, y2, w: x2 - x1, h: y2 - y1 };
});
</script>

<template>
  <!-- Top Horizontal Ruler -->
  <div 
    class="absolute top-0 left-6 right-0 h-6 bg-[#080e1a] border-b border-cyan-500/30 overflow-hidden pointer-events-none select-none z-20"
  >
    <svg class="w-full h-full">
      <!-- Active Canvas Highlight Band on Ruler -->
      <rect
        :x="canvasBoundsOnRuler.x1"
        y="0"
        :width="Math.max(0, canvasBoundsOnRuler.w)"
        height="24"
        fill="rgba(0, 242, 255, 0.06)"
      />
      <!-- Active Canvas Boundary Lines -->
      <line :x1="canvasBoundsOnRuler.x1" y1="0" :x2="canvasBoundsOnRuler.x1" y2="24" stroke="rgba(0, 242, 255, 0.6)" stroke-width="1.5" />
      <line :x1="canvasBoundsOnRuler.x2" y1="0" :x2="canvasBoundsOnRuler.x2" y2="24" stroke="rgba(0, 242, 255, 0.6)" stroke-width="1.5" />

      <!-- Horizontal Ticks -->
      <g 
        v-for="(tick, idx) in horizontalTicks" 
        :key="`xtick-${idx}-${tick.value}`"
        :transform="`translate(${tick.pos}, 0)`"
      >
        <line 
          x1="0" 
          :y1="tick.isMajor ? 12 : 18" 
          x2="0" 
          y2="24" 
          :stroke="tick.isMajor ? 'rgba(0, 242, 255, 0.5)' : 'rgba(0, 242, 255, 0.2)'" 
          :stroke-width="tick.isMajor ? 1 : 0.8" 
        />
        <text
          v-if="tick.isMajor"
          x="3"
          y="10"
          fill="#94a3b8"
          font-size="8.5"
          font-family="monospace"
          class="select-none"
        >
          {{ tick.value }}
        </text>
      </g>

      <!-- Realtime Cursor Guide Line on X -->
      <line
        :x1="cursorGuideX"
        y1="0"
        :x2="cursorGuideX"
        y2="24"
        stroke="#00f2ff"
        stroke-width="1.5"
      />
    </svg>
  </div>

  <!-- Left Vertical Ruler -->
  <div 
    class="absolute top-6 left-0 bottom-0 w-6 bg-[#080e1a] border-r border-cyan-500/30 overflow-hidden pointer-events-none select-none z-20"
  >
    <svg class="w-full h-full">
      <!-- Active Canvas Highlight Band on Ruler -->
      <rect
        x="0"
        :y="canvasBoundsOnRuler.y1"
        width="24"
        :height="Math.max(0, canvasBoundsOnRuler.h)"
        fill="rgba(0, 242, 255, 0.06)"
      />
      <!-- Active Canvas Boundary Lines -->
      <line x1="0" :y1="canvasBoundsOnRuler.y1" x2="24" :y2="canvasBoundsOnRuler.y1" stroke="rgba(0, 242, 255, 0.6)" stroke-width="1.5" />
      <line x1="0" :y1="canvasBoundsOnRuler.y2" x2="24" :y2="canvasBoundsOnRuler.y2" stroke="rgba(0, 242, 255, 0.6)" stroke-width="1.5" />

      <!-- Vertical Ticks -->
      <g 
        v-for="(tick, idx) in verticalTicks" 
        :key="`ytick-${idx}-${tick.value}`"
        :transform="`translate(0, ${tick.pos})`"
      >
        <line 
          :x1="tick.isMajor ? 12 : 18" 
          y1="0" 
          x2="24" 
          y2="0" 
          :stroke="tick.isMajor ? 'rgba(0, 242, 255, 0.5)' : 'rgba(0, 242, 255, 0.2)'" 
          :stroke-width="tick.isMajor ? 1 : 0.8" 
        />
        <text
          v-if="tick.isMajor"
          x="2"
          y="11"
          fill="#94a3b8"
          font-size="8"
          font-family="monospace"
          class="select-none"
          transform="rotate(-90 2,11)"
        >
          {{ tick.value }}
        </text>
      </g>

      <!-- Realtime Cursor Guide Line on Y -->
      <line
        x1="0"
        :y1="cursorGuideY"
        x2="24"
        :y2="cursorGuideY"
        stroke="#00f2ff"
        stroke-width="1.5"
      />
    </svg>
  </div>

  <!-- Top-Left Origin Junction (0, 0) -->
  <div class="absolute top-0 left-0 w-6 h-6 bg-[#060a14] border-r border-b border-cyan-500/40 flex items-center justify-center text-[8px] font-mono text-cyan-400 font-bold z-30 select-none shadow-sm">
    px
  </div>
</template>
