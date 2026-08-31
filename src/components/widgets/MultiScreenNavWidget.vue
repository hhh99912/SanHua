<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { 
  LayoutDashboard, Zap, Activity, Cpu, Database, ChevronRight, 
  Layers, Radio, Monitor, Tv, Flame, Sparkles
} from 'lucide-vue-next';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
  previewMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false
});
const emit = defineEmits<{
  (e: 'jump:screen', screenId: string): void;
}>();

const navItems = computed(() => {
  const customItems = props.component.customProps?.screens || [
    { id: 'screen-10kv-main', name: '10kV一次系统接线图', icon: 'Zap' },
    { id: 'screen-transformer-detail', name: '#1主变压器及测控画面', icon: 'Activity' },
    { id: 'screen-low-voltage-04kv', name: '0.4kV低压配电画面', icon: 'Cpu' },
    { id: 'screen-telemetry-scada', name: '全站电力遥测与告警', icon: 'LayoutDashboard' }
  ];
  return customItems;
});

const fontSizePx = computed(() => {
  return props.component.style?.fontSize ? `${props.component.style.fontSize}px` : '14px';
});

const currentActiveId = computed(() => {
  return props.component.customProps?.activeScreenId || navItems.value[0]?.id || '';
});

const handleNavClick = (screenId: string) => {
  if (props.previewMode) {
    emit('jump:screen', screenId);
  }
};
</script>

<template>
  <div 
    class="w-full h-full px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-[#060e22]/95 flex items-center justify-between gap-3 select-none shadow-[0_4px_24px_rgba(0,0,0,0.7)] backdrop-blur-lg relative overflow-hidden"
    :style="{
      borderColor: component.style?.stroke || 'rgba(0, 242, 255, 0.5)',
      backgroundColor: component.style?.fill || 'rgba(6, 14, 34, 0.95)',
      borderRadius: component.style?.borderRadius !== undefined ? `${component.style.borderRadius}px` : '12px'
    }"
  >
    <!-- Top Ambient Glow Line -->
    <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

    <!-- Left Brand / Title Section -->
    <div class="flex items-center gap-2.5 px-3 py-1 border-r border-slate-700/80 text-cyan-300 font-bold shrink-0">
      <div class="w-7 h-7 rounded-lg bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.4)]">
        <Layers class="w-4 h-4 text-cyan-300 animate-pulse" />
      </div>
      <div class="flex flex-col">
        <span class="text-xs tracking-wider text-cyan-200 font-bold font-sans">
          {{ component.customProps?.title || 'SCADA 画面导航' }}
        </span>
        <span class="text-[9px] text-slate-400 font-mono">
          共 {{ navItems.length }} 个子系统画面
        </span>
      </div>
    </div>

    <!-- Navigation Tabs List -->
    <div class="flex-1 flex items-center gap-2.5 overflow-x-auto custom-scrollbar py-0.5">
      <button
        v-for="(item, idx) in navItems"
        :key="item.id || idx"
        @click="handleNavClick(item.id)"
        class="group relative flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 cursor-pointer whitespace-nowrap shadow-sm"
        :class="[
          item.id === currentActiveId
            ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,255,0.3)] ring-1 ring-cyan-400/40'
            : 'bg-slate-900/85 hover:bg-cyan-950/50 border-slate-700/80 hover:border-cyan-400/80 text-slate-200 hover:text-white'
        ]"
        :style="{ fontSize: fontSizePx }"
      >
        <!-- Tab Index Pill -->
        <span 
          class="w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono font-black"
          :class="item.id === currentActiveId ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(0,242,255,0.8)]' : 'bg-slate-800 text-slate-400 group-hover:bg-cyan-950 group-hover:text-cyan-300'"
        >
          {{ idx + 1 }}
        </span>

        <!-- Screen Name -->
        <span class="font-bold tracking-wide font-sans text-slate-100 group-hover:text-cyan-100">
          {{ item.name }}
        </span>

        <!-- Active Bottom Glow Pip -->
        <span 
          v-if="item.id === currentActiveId"
          class="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#00f2ff] ml-0.5"
        />
        <ChevronRight v-else class="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>

    <!-- Right Live System Tag -->
    <div class="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800 shrink-0 font-mono text-[11px]">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
      <span class="text-emerald-400 font-medium">画面联动就绪</span>
    </div>
  </div>
</template>
