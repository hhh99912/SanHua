<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { LayoutDashboard, Zap, Activity, Cpu, Database, ChevronRight } from 'lucide-vue-next';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'jump:screen', screenId: string): void;
}>();

const navItems = computed(() => {
  const customItems = props.component.customProps?.screens || [
    { id: 'screen-main-wiring', name: '10kV一次系统接线图', icon: 'Zap' },
    { id: 'screen-transformer', name: '主变压器测控大屏', icon: 'Activity' },
    { id: 'screen-low-voltage', name: '0.4kV低压配电大屏', icon: 'Cpu' },
    { id: 'screen-telemetry-summary', name: '全站电力遥测中心', icon: 'LayoutDashboard' }
  ];
  return customItems;
});
</script>

<template>
  <div 
    class="w-full h-full p-2 rounded-xl border border-cyan-500/40 bg-slate-950/90 flex items-center justify-between gap-2 select-none shadow-xl backdrop-blur-md"
  >
    <div class="flex items-center gap-2 px-2 border-r border-slate-800 text-cyan-400 font-mono text-xs font-bold shrink-0">
      <Zap class="w-4 h-4" />
      <span>大屏系统导航</span>
    </div>

    <div class="flex-1 flex items-center gap-2 overflow-x-auto custom-scrollbar">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="emit('jump:screen', item.id)"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-400 bg-slate-900/80 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-200 text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs"
      >
        <span>{{ item.name }}</span>
        <ChevronRight class="w-3 h-3 text-cyan-400" />
      </button>
    </div>
  </div>
</template>
