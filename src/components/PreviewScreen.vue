<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  X,
  Maximize,
  Minimize,
  Play,
  Pause,
  Monitor,
  Scaling,
  Sparkles,
  Layers,
  Layout,
  ChevronRight
} from 'lucide-vue-next';
import { ScreenConfig, ScreenComponent, DatasetItem, ScreenItem } from '../types';
import WidgetRenderer from './widgets/WidgetRenderer.vue';

interface Props {
  screen: ScreenConfig;
  components: ScreenComponent[];
  datasets: DatasetItem[];
  isStreaming: boolean;
  screens?: ScreenItem[];
  activeScreenId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  screens: () => []
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle:streaming'): void;
  (e: 'switch:screen', screenId: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);
const scaleMode = ref<'fit' | 'fill' | 'original'>('fit');
const isBrowserFullscreen = ref(false);
const showToolbar = ref(true);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

// Calculate scale factor
const scaleRatio = computed(() => {
  if (scaleMode.value === 'original') return { scaleX: 1, scaleY: 1 };
  const sx = windowWidth.value / props.screen.width;
  const sy = windowHeight.value / props.screen.height;

  if (scaleMode.value === 'fill') {
    return { scaleX: sx, scaleY: sy };
  }

  // 'fit' maintains aspect ratio
  const s = Math.min(sx, sy);
  return { scaleX: s, scaleY: s };
});

const toggleBrowserFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    isBrowserFullscreen.value = true;
  } else {
    document.exitFullscreen().catch(() => {});
    isBrowserFullscreen.value = false;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close');
  }
};

let hideTimer: any = null;
const handleMouseMove = () => {
  showToolbar.value = true;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    showToolbar.value = false;
  }, 4000);
};

// Component click handler for screen jump & interaction actions
const handlePreviewCompClick = (comp: ScreenComponent) => {
  const act = comp.data?.action;
  if (!act || act.type === 'none') return;
  if ((act.type === 'jump-screen' || act.type === 'switch-screen') && act.targetScreenId) {
    emit('switch:screen', act.targetScreenId);
  } else if (act.type === 'link' && act.url) {
    window.open(act.url, '_blank');
  }
};

// Global inter-screen jump event listener inside preview
const handleGlobalJump = (e: any) => {
  if (e.detail) {
    emit('switch:screen', e.detail);
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('datav:jump:screen', handleGlobalJump);
  handleResize();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('datav:jump:screen', handleGlobalJump);
  clearTimeout(hideTimer);
});
</script>

<template>
  <div
    ref="containerRef"
    @mousemove="handleMouseMove"
    class="fixed inset-0 bg-[#02050b] z-50 overflow-hidden flex items-center justify-center select-none font-sans"
  >
    <!-- Scaled Screen Canvas View -->
    <div
      class="relative transition-transform duration-100 ease-out origin-center"
      :style="{
        width: `${screen.width}px`,
        height: `${screen.height}px`,
        transform: `scale(${scaleRatio.scaleX}, ${scaleRatio.scaleY})`,
        backgroundColor: screen.backgroundColor || '#040810',
        backgroundImage: screen.backgroundGrid 
          ? `radial-gradient(circle, ${screen.gridColor || 'rgba(0, 242, 255, 0.15)'} 1.5px, transparent 1.5px)` 
          : 'none',
        backgroundSize: `${screen.gridSize || 30}px ${screen.gridSize || 30}px`,
        boxShadow: '0 0 50px rgba(0,0,0,0.9)'
      }"
    >
      <!-- Components in Z-Index Order -->
      <div
        v-for="comp in components"
        :key="comp.id"
        class="absolute"
        :class="{
          'opacity-0 pointer-events-none': comp.visible === false,
          'cursor-pointer pointer-events-auto': comp.data?.action && comp.data.action.type !== 'none'
        }"
        :style="{
          left: `${comp.x}px`,
          top: `${comp.y}px`,
          width: `${comp.width}px`,
          height: `${comp.height}px`,
          transform: comp.rotation ? `rotate(${comp.rotation}deg)` : 'none',
          zIndex: comp.zIndex || 1
        }"
        @click="handlePreviewCompClick(comp)"
      >
        <WidgetRenderer
          :component="comp"
          :datasets="datasets"
          @jump:screen="emit('switch:screen', $event)"
        />
      </div>
    </div>

    <!-- Floating Top Control Bar (Fades out when inactive) -->
    <div
      class="fixed top-4 left-1/2 -translate-x-1/2 bg-[#080e1a]/90 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 transition-opacity duration-300 z-50 text-xs font-mono"
      :class="showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div class="flex items-center gap-2 pr-2 border-r border-slate-800">
        <Monitor class="w-4 h-4 text-cyan-400" />
        <span class="font-bold text-white tracking-wider">{{ screen.name }}</span>
        <span class="text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
          {{ screen.width }} × {{ screen.height }}
        </span>
      </div>

      <!-- Multi-Screen Quick Switcher in Preview -->
      <div v-if="screens && screens.length > 1" class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          v-for="s in screens"
          :key="s.id"
          @click="emit('switch:screen', s.id)"
          class="px-2 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
          :class="s.id === activeScreenId 
            ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40' 
            : 'text-slate-400 hover:text-white'"
        >
          {{ s.name }}
        </button>
      </div>

      <!-- Scale mode selector -->
      <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          @click="scaleMode = 'fit'"
          class="px-2 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
          :class="scaleMode === 'fit' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'"
          title="等比自适应视口 (推荐)"
        >
          自适应
        </button>
        <button
          @click="scaleMode = 'fill'"
          class="px-2 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
          :class="scaleMode === 'fill' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'"
          title="铺满拉伸"
        >
          铺满
        </button>
        <button
          @click="scaleMode = 'original'"
          class="px-2 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
          :class="scaleMode === 'original' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'"
          title="100% 原始像素"
        >
          1:1
        </button>
      </div>

      <!-- Data stream toggle -->
      <button
        @click="emit('toggle:streaming')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer"
        :class="isStreaming 
          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
          : 'bg-slate-900 border-slate-700 text-slate-400'"
        title="实时数据流推送"
      >
        <Pause v-if="isStreaming" class="w-3.5 h-3.5" />
        <Play v-else class="w-3.5 h-3.5" />
        <span class="text-[10px]">{{ isStreaming ? '数据流播送中' : '数据流已暂停' }}</span>
      </button>

      <!-- Browser Fullscreen toggle -->
      <button
        @click="toggleBrowserFullscreen"
        class="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        title="切换浏览器全屏"
      >
        <Minimize v-if="isBrowserFullscreen" class="w-4 h-4" />
        <Maximize v-else class="w-4 h-4" />
      </button>

      <!-- Close preview button -->
      <button
        @click="emit('close')"
        class="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 transition-colors cursor-pointer ml-1"
        title="退出全屏演示 (ESC)"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
