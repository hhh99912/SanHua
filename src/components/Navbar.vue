<script setup lang="ts">
import { ref } from 'vue';
import {
  Monitor,
  Play,
  Pause,
  Database,
  Code,
  Eye,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  LayoutTemplate,
  ChevronDown,
  Check,
  RotateCcw,
  Zap,
  FolderOpen,
  MousePointer,
  Minus,
  Workflow,
  Laptop
} from 'lucide-vue-next';
import { ScreenConfig } from '../types';
import { templates } from '../data/templates';
import { detectPlatform, isElectron } from '../utils/platform';

interface Props {
  screen: ScreenConfig;
  zoom: number;
  isStreaming: boolean;
  canUndo: boolean;
  canRedo: boolean;
  drawTool?: 'select' | 'draw-line' | 'draw-polyline';
}

const props = withDefaults(defineProps<Props>(), {
  drawTool: 'select'
});

const emit = defineEmits<{
  (e: 'update:screen', value: ScreenConfig): void;
  (e: 'update:zoom', value: number): void;
  (e: 'update:drawTool', tool: 'select' | 'draw-line' | 'draw-polyline'): void;
  (e: 'toggle:streaming'): void;
  (e: 'open:preview'): void;
  (e: 'open:datasets'): void;
  (e: 'open:json'): void;
  (e: 'open:symbols'): void;
  (e: 'open:platform'): void;
  (e: 'load:template', templateId: string): void;
  (e: 'clear:canvas'): void;
  (e: 'fit:screen'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();

const currentPlatform = detectPlatform();

const showResolutionMenu = ref(false);
const showTemplateMenu = ref(false);

const resolutionPresets = [
  { label: '1080P 全高清 (1920 × 1080)', w: 1920, h: 1080, tag: '推荐 16:9' },
  { label: '2K 工业宽屏 (2560 × 1440)', w: 2560, h: 1440, tag: '高分屏 16:9' },
  { label: '4K 超高清 (3840 × 2160)', w: 3840, h: 2160, tag: '4K 巨幕' },
  { label: '工控触控屏 (1366 × 768)', w: 1366, h: 768, tag: '嵌入式' },
  { label: '720P 标清 (1280 × 720)', w: 1280, h: 720, tag: '便携屏' },
  { label: '带鱼环幕屏 (3840 × 1080)', w: 3840, h: 1080, tag: '32:9 展厅' },
];

const handleSelectResolution = (w: number, h: number) => {
  emit('update:screen', {
    ...props.screen,
    width: w,
    height: h
  });
  showResolutionMenu.value = false;
  emit('fit:screen');
};

const handleSelectTemplate = (id: string) => {
  emit('load:template', id);
  showTemplateMenu.value = false;
};
</script>

<template>
  <header class="h-13 bg-[#060b17] border-b border-cyan-500/25 px-4 flex items-center justify-between select-none z-40 relative shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
    <!-- Brand & Screen Name -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.5)] border border-cyan-300/40">
          <Monitor class="w-4 h-4 text-slate-950 font-bold" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono font-black text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-100 to-blue-300">
              DATAV STUDIO
            </span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-semibold">
              SCADA 组态版
            </span>
          </div>
        </div>
      </div>

      <div class="h-5 w-[1px] bg-slate-800 mx-1" />

      <!-- Resolution Selector Dropdown -->
      <div class="relative">
        <button
          @click="showResolutionMenu = !showResolutionMenu"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all cursor-pointer shadow-sm"
        >
          <span class="text-slate-400">分辨率:</span>
          <span class="font-bold text-white">{{ screen.width }} × {{ screen.height }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-cyan-400" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showResolutionMenu"
          class="absolute top-full left-0 mt-1.5 w-64 bg-[#0a1122] border border-cyan-500/40 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md"
        >
          <div class="text-[10px] font-mono text-slate-400 px-2 py-1 border-b border-slate-800">
            常用大屏显示比例与分辨率预设
          </div>
          <div class="space-y-0.5 mt-1">
            <button
              v-for="res in resolutionPresets"
              :key="res.label"
              @click="handleSelectResolution(res.w, res.h)"
              class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left hover:bg-cyan-500/20 text-slate-200 cursor-pointer"
              :class="{ 'bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30': screen.width === res.w && screen.height === res.h }"
            >
              <div class="flex items-center gap-1.5">
                <Check v-if="screen.width === res.w && screen.height === res.h" class="w-3.5 h-3.5 text-cyan-400" />
                <span v-else class="w-3.5" />
                <span>{{ res.w }} × {{ res.h }}</span>
              </div>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                {{ res.tag }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Preset Template Switcher -->
      <div class="relative">
        <button
          @click="showTemplateMenu = !showTemplateMenu"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-slate-200 transition-all cursor-pointer"
        >
          <LayoutTemplate class="w-3.5 h-3.5 text-cyan-400" />
          <span>大屏模版库</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div
          v-if="showTemplateMenu"
          class="absolute top-full left-0 mt-1.5 w-72 bg-[#0a1122] border border-cyan-500/40 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md"
        >
          <div class="text-[10px] font-mono text-slate-400 px-2 py-1 border-b border-slate-800">
            载入官方工业与科技大屏预设
          </div>
          <div class="space-y-1 mt-1">
            <button
              v-for="tpl in templates"
              :key="tpl.id"
              @click="handleSelectTemplate(tpl.id)"
              class="w-full flex items-start gap-2 p-2 rounded-lg text-xs font-mono transition-colors text-left hover:bg-cyan-500/20 text-slate-200 cursor-pointer"
            >
              <div class="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
              <div>
                <div class="font-bold text-white">{{ tpl.name }}</div>
                <div class="text-[10px] text-slate-400 line-clamp-1">{{ tpl.description }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Center Workspace Action Toolbar & Drawing Mode Toggle -->
    <div class="flex items-center gap-2">
      <!-- Interactive Tool Switcher (选择 / 绘制直线 / 绘制折线) -->
      <div class="flex items-center bg-slate-950 p-0.5 rounded-xl border border-cyan-500/30 shadow-inner font-mono text-xs">
        <button
          @click="emit('update:drawTool', 'select')"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          :class="drawTool === 'select' 
            ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' 
            : 'text-slate-400 hover:text-white'"
          title="选择与多选移动模式 (支持拉框多选、旋转)"
        >
          <MousePointer class="w-3.5 h-3.5" />
          <span>选择/移动</span>
        </button>

        <button
          @click="emit('update:drawTool', 'draw-line')"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          :class="drawTool === 'draw-line' 
            ? 'bg-amber-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(251,191,36,0.5)]' 
            : 'text-slate-400 hover:text-white'"
          title="直线连线绘制: 单击确定起点，再单击确定落点"
        >
          <Minus class="w-3.5 h-3.5" />
          <span>画直线</span>
        </button>

        <button
          @click="emit('update:drawTool', 'draw-polyline')"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          :class="drawTool === 'draw-polyline' 
            ? 'bg-amber-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(251,191,36,0.5)]' 
            : 'text-slate-400 hover:text-white'"
          title="折线连线绘制: 单击连续添加拐点，双击结束绘制"
        >
          <Workflow class="w-3.5 h-3.5" />
          <span>画折线</span>
        </button>
      </div>

      <!-- Undo / Redo & Zoom Tools -->
      <div class="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          @click="emit('undo')"
          :disabled="!canUndo"
          class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 class="w-4 h-4" />
        </button>
        <button
          @click="emit('redo')"
          :disabled="!canRedo"
          class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="重做 (Ctrl+Y)"
        >
          <Redo2 class="w-4 h-4" />
        </button>

        <div class="h-4 w-[1px] bg-slate-800 mx-0.5" />

        <button
          @click="emit('update:zoom', Math.max(0.1, Number((zoom - 0.1).toFixed(2))))"
          class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer transition-colors"
          title="缩小"
        >
          <ZoomOut class="w-4 h-4" />
        </button>
        <span class="text-xs font-mono font-bold text-cyan-300 px-1 w-11 text-center">
          {{ Math.round(zoom * 100) }}%
        </span>
        <button
          @click="emit('update:zoom', Math.min(2.5, Number((zoom + 0.1).toFixed(2))))"
          class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer transition-colors"
          title="放大"
        >
          <ZoomIn class="w-4 h-4" />
        </button>

        <button
          @click="emit('fit:screen')"
          class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono cursor-pointer transition-colors"
          title="自适应画布大小到当前视口"
        >
          <Maximize2 class="w-3.5 h-3.5" />
          <span>自适应</span>
        </button>
      </div>
    </div>

    <!-- Right Feature Buttons -->
    <div class="flex items-center gap-2">
      <!-- Real-time Simulation Switch -->
      <button
        @click="emit('toggle:streaming')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border"
        :class="isStreaming 
          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
          : 'bg-slate-900 border-slate-700 text-slate-400'"
      >
        <Pause v-if="isStreaming" class="w-3.5 h-3.5" />
        <Play v-else class="w-3.5 h-3.5" />
        <span>{{ isStreaming ? '数据流: 运行' : '数据流: 暂停' }}</span>
      </button>

      <!-- Dataset Manager -->
      <button
        @click="emit('open:datasets')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono text-slate-300 transition-all cursor-pointer"
      >
        <Database class="w-3.5 h-3.5 text-cyan-400" />
        <span>数据集</span>
      </button>

      <!-- Custom Symbol Library Button -->
      <button
        @click="emit('open:symbols')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono text-slate-300 transition-all cursor-pointer"
        title="打开自定义图元与符号资产库"
      >
        <FolderOpen class="w-3.5 h-3.5 text-cyan-400" />
        <span>图元资产/工坊</span>
      </button>

      <!-- JSON Schema Export / Import -->
      <button
        @click="emit('open:json')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono text-slate-300 transition-all cursor-pointer"
      >
        <Code class="w-3.5 h-3.5 text-cyan-400" />
        <span>JSON</span>
      </button>

      <!-- Multi-Platform Desktop & Packaging Hub -->
      <button
        @click="emit('open:platform')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono text-slate-300 transition-all cursor-pointer"
        title="跨平台兼容与桌面端打包分发中心 (Web / Windows / Linux)"
      >
        <Laptop class="w-3.5 h-3.5 text-cyan-400" />
        <span>多端分发/打包</span>
        <span 
          class="text-[9px] px-1 py-0.2 rounded font-bold"
          :class="currentPlatform === 'windows' 
            ? 'bg-blue-950 text-blue-300 border border-blue-500/40' 
            : currentPlatform === 'linux' 
              ? 'bg-amber-950 text-amber-300 border border-amber-500/40' 
              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'"
        >
          {{ currentPlatform === 'windows' ? 'Win' : currentPlatform === 'linux' ? 'Linux' : 'Web' }}
        </span>
      </button>

      <!-- Clear Canvas -->
      <button
        @click="emit('clear:canvas')"
        class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/30 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
        title="清空画布"
      >
        <Trash2 class="w-4 h-4" />
      </button>

      <!-- Big Screen Full Preview -->
      <button
        @click="emit('open:preview')"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer"
      >
        <Eye class="w-4 h-4" />
        <span>大屏预览</span>
      </button>
    </div>
  </header>
</template>
