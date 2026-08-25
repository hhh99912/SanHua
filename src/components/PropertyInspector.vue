<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  SlidersHorizontal,
  Palette,
  Database,
  Move,
  RotateCw,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Layers,
  Activity,
  Check,
  Zap,
  BookmarkPlus,
  ExternalLink,
  Navigation,
  Lock,
  Trash2,
  Copy,
  Workflow,
  ToggleRight,
  CircleDot,
  Binary
} from 'lucide-vue-next';
import { ScreenComponent, ScreenConfig, DatasetItem, ScreenItem } from '../types';

interface Props {
  component: ScreenComponent | null;
  selectedComponents?: ScreenComponent[];
  screen: ScreenConfig;
  datasets: DatasetItem[];
  screens?: ScreenItem[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedComponents: () => [],
  screens: () => []
});

const emit = defineEmits<{
  (e: 'update:component', comp: ScreenComponent): void;
  (e: 'update:components', comps: ScreenComponent[]): void;
  (e: 'update:screen', screen: ScreenConfig): void;
  (e: 'align:component', type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v'): void;
  (e: 'save:symbol', comps: ScreenComponent[]): void;
  (e: 'delete', ids: string[]): void;
}>();

const activeTab = ref<'geometry' | 'style' | 'data' | 'interaction'>('geometry');

const themeColors = [
  '#00f2ff', // Cyber Cyan
  '#3b82f6', // Electric Blue
  '#00e5a3', // Tech Emerald
  '#f59e0b', // Industrial Amber
  '#ef4444', // Crimson Alert
  '#a855f7', // Cyber Purple
  '#ffffff', // Clean White
  '#1e293b', // Deep Slate
];

const boundDataset = computed(() => {
  if (!props.component?.data?.datasetId) return null;
  return props.datasets.find(d => d.id === props.component?.data?.datasetId);
});

// Update component helper
const updateComponentProps = (updates: Partial<ScreenComponent>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    ...updates
  });
};

const updateComponentStyle = (styleUpdates: Partial<ScreenComponent['style']>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    style: {
      ...props.component.style,
      ...styleUpdates
    }
  });
};

const updateComponentCustomProps = (customPropsUpdates: Record<string, any>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    customProps: {
      ...(props.component.customProps || {}),
      ...customPropsUpdates
    }
  });
};

const updateComponentData = (dataUpdates: Partial<ScreenComponent['data']>) => {
  if (!props.component) return;
  emit('update:component', {
    ...props.component,
    data: {
      ...props.component.data,
      ...dataUpdates,
      mapping: {
        ...props.component.data.mapping,
        ...(dataUpdates.mapping || {})
      }
    }
  });
};

const updateComponentAction = (actionUpdates: Record<string, any>) => {
  if (!props.component) return;
  const currentAction = props.component.data.action || { type: 'none' };
  emit('update:component', {
    ...props.component,
    data: {
      ...props.component.data,
      action: {
        ...currentAction,
        ...actionUpdates
      }
    }
  });
};

// Batch Lock/Unlock
const toggleBatchLock = () => {
  const anyLocked = props.selectedComponents.some(c => c.locked);
  const updated = props.selectedComponents.map(c => ({
    ...c,
    locked: !anyLocked
  }));
  emit('update:components', updated);
};
</script>

<template>
  <aside class="w-80 h-full bg-[#070c18] border-l border-cyan-500/25 flex flex-col select-none z-30 shadow-xl overflow-hidden font-sans">
    <!-- Header -->
    <div class="p-3 border-b border-cyan-500/20 bg-[#040813]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 font-mono font-bold text-xs text-cyan-200">
          <SlidersHorizontal class="w-3.5 h-3.5 text-cyan-400" />
          <span v-if="selectedComponents.length > 1">多选元件配置 ({{ selectedComponents.length }})</span>
          <span v-else-if="component">组件属性配置</span>
          <span v-else>大屏全局画布配置</span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            v-if="selectedComponents.length > 0"
            @click="emit('save:symbol', selectedComponents.length > 0 ? selectedComponents : (component ? [component] : []))"
            class="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 text-[10px] font-mono cursor-pointer transition-colors shadow-sm"
            title="将选中图元封装为多态自定义图元"
          >
            <BookmarkPlus class="w-3.5 h-3.5 text-emerald-400" />
            <span>存为图元</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 1. MULTI-SELECTION BATCH INSPECTOR ================= -->
    <template v-if="selectedComponents.length > 1">
      <div class="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs custom-scrollbar">
        <div class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
          <div class="text-cyan-300 font-bold flex items-center justify-between">
            <span>已多选 {{ selectedComponents.length }} 个元件</span>
            <span class="text-[10px] text-slate-400">批量编辑</span>
          </div>
          <div class="text-[10px] text-slate-400">
            按住 Shift 点击元件或在画布拉框可进行增减选择。
          </div>
        </div>

        <!-- Batch Alignment Tools -->
        <div class="space-y-2">
          <label class="text-[11px] text-slate-300 font-bold block">多选对齐与等间距分布</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button @click="emit('align:component', 'left')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="左对齐">
              <AlignLeft class="w-3.5 h-3.5" />
              <span class="text-[10px]">左对齐</span>
            </button>
            <button @click="emit('align:component', 'center')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="水平居中">
              <AlignCenter class="w-3.5 h-3.5" />
              <span class="text-[10px]">水平居中</span>
            </button>
            <button @click="emit('align:component', 'right')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="右对齐">
              <AlignRight class="w-3.5 h-3.5" />
              <span class="text-[10px]">右对齐</span>
            </button>
            <button @click="emit('align:component', 'distribute-h')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="水平等间距分布">
              <AlignHorizontalSpaceAround class="w-3.5 h-3.5" />
              <span class="text-[10px]">水平均布</span>
            </button>

            <button @click="emit('align:component', 'top')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="顶对齐">
              <AlignVerticalSpaceAround class="w-3.5 h-3.5 rotate-90" />
              <span class="text-[10px]">顶对齐</span>
            </button>
            <button @click="emit('align:component', 'middle')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="垂直居中">
              <AlignHorizontalSpaceAround class="w-3.5 h-3.5" />
              <span class="text-[10px]">垂直居中</span>
            </button>
            <button @click="emit('align:component', 'bottom')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="底对齐">
              <AlignVerticalSpaceAround class="w-3.5 h-3.5 -rotate-90" />
              <span class="text-[10px]">底对齐</span>
            </button>
            <button @click="emit('align:component', 'distribute-v')" class="p-1.5 rounded bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 cursor-pointer" title="垂直等间距分布">
              <AlignVerticalSpaceAround class="w-3.5 h-3.5" />
              <span class="text-[10px]">垂直均布</span>
            </button>
          </div>
        </div>

        <!-- Batch Operations -->
        <div class="space-y-2 pt-2 border-t border-slate-800">
          <label class="text-[11px] text-slate-300 font-bold block">批量操作</label>
          <div class="space-y-2">
            <button
              @click="emit('save:symbol', selectedComponents)"
              class="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <BookmarkPlus class="w-4 h-4" />
              <span>📦 设为自定义图元 (支持多状态)</span>
            </button>

            <button
              @click="toggleBatchLock"
              class="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Lock class="w-3.5 h-3.5" />
              <span>批量锁定 / 解锁</span>
            </button>

            <button
              @click="emit('delete', selectedComponents.map(c => c.id))"
              class="w-full py-2 px-3 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>批量删除选中元件 (Del)</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 2. SINGLE COMPONENT INSPECTOR VIEW ================= -->
    <template v-else-if="component">
      <!-- Tabs Selector -->
      <div class="flex items-center border-b border-slate-800 bg-[#050914] px-1">
        <button
          @click="activeTab = 'geometry'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'geometry' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Move class="w-3.5 h-3.5" />
          <span>几何</span>
        </button>
        <button
          @click="activeTab = 'style'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'style' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Palette class="w-3.5 h-3.5" />
          <span>样式</span>
        </button>
        <button
          @click="activeTab = 'data'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'data' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Database class="w-3.5 h-3.5" />
          <span>数据</span>
        </button>
        <button
          @click="activeTab = 'interaction'"
          class="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border-b-2"
          :class="activeTab === 'interaction' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold' : 'border-transparent text-slate-300 hover:text-white'"
        >
          <Navigation class="w-3.5 h-3.5" />
          <span>交互跳转</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs font-mono">
        
        <!-- MULTI-STATE SELECTOR (For Custom Symbols with States) -->
        <div v-if="component.states && component.states.length > 0" class="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/50 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span class="flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span>当前呈现状态 (Active State)</span>
            </span>
            <span class="text-[10px] text-slate-400">共 {{ component.states.length }} 个状态</span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button
              v-for="st in component.states"
              :key="st.id"
              @click="updateComponentProps({ activeState: st.id })"
              class="py-1.5 px-2 rounded-lg text-xs font-mono cursor-pointer border transition-all truncate text-left flex items-center justify-between gap-1"
              :class="String(component.activeState ?? '1') === String(st.id)
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-500/40'"
            >
              <span class="truncate">{{ st.name }}</span>
              <span class="text-[9px] px-1 rounded font-bold" :class="String(component.activeState ?? '1') === String(st.id) ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'">
                ={{ st.matchValue ?? st.id }}
              </span>
            </button>
          </div>
        </div>

        <!-- TAB 1: GEOMETRY & ALIGNMENT -->
        <div v-if="activeTab === 'geometry'" class="space-y-4">
          <!-- Component Name -->
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">组件标识名称</label>
            <input
              :value="component.name"
              @input="updateComponentProps({ name: ($event.target as HTMLInputElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
            />
          </div>

          <!-- Position (X, Y) -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">X 坐标 (px)</label>
              <input
                type="number"
                :value="Math.round(component.x)"
                @input="updateComponentProps({ x: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">Y 坐标 (px)</label>
              <input
                type="number"
                :value="Math.round(component.y)"
                @input="updateComponentProps({ y: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Size (Width, Height) -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">宽度 (px)</label>
              <input
                type="number"
                min="6"
                :value="Math.round(component.width)"
                @input="updateComponentProps({ width: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">高度 (px)</label>
              <input
                type="number"
                min="4"
                :value="Math.round(component.height)"
                @input="updateComponentProps({ height: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Rotation & Z-Index -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">旋转角度 (°)</label>
              <div class="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="360"
                  :value="component.rotation || 0"
                  @input="updateComponentProps({ rotation: Number(($event.target as HTMLInputElement).value) })"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
                />
                <button
                  @click="updateComponentProps({ rotation: ((component.rotation || 0) + 90) % 360 })"
                  class="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer"
                  title="顺时针旋转90°"
                >
                  <RotateCw class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">图层层级 (zIndex)</label>
              <input
                type="number"
                min="0"
                max="1000"
                :value="component.zIndex || 1"
                @input="updateComponentProps({ zIndex: Number(($event.target as HTMLInputElement).value) })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Quick Alignment Tools -->
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1.5">快速对齐工具</label>
            <div class="grid grid-cols-6 gap-1 bg-[#060b17] p-1.5 rounded-lg border border-slate-700/80">
              <button @click="emit('align:component', 'left')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="左对齐"><AlignLeft class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'center')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="水平居中"><AlignCenter class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'right')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="右对齐"><AlignRight class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'top')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="顶对齐"><AlignVerticalSpaceAround class="w-4 h-4 rotate-90" /></button>
              <button @click="emit('align:component', 'middle')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="垂直居中"><AlignHorizontalSpaceAround class="w-4 h-4" /></button>
              <button @click="emit('align:component', 'bottom')" class="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex justify-center cursor-pointer" title="底对齐"><AlignVerticalSpaceAround class="w-4 h-4 -rotate-90" /></button>
            </div>
          </div>

          <!-- Component Actions (Lock / Delete) -->
          <div class="pt-2 border-t border-slate-800/80 space-y-2">
            <label class="text-xs font-semibold text-slate-200 block mb-1">元件控制与删除</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="updateComponentProps({ locked: !component.locked })"
                class="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Lock class="w-3.5 h-3.5" :class="component.locked ? 'text-amber-400' : 'text-slate-300'" />
                <span>{{ component.locked ? '解除锁定' : '锁定元件' }}</span>
              </button>

              <button
                @click="emit('delete', [component.id])"
                class="py-1.5 px-2 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>删除此组件</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: STYLE & PALETTE -->
        <div v-if="activeTab === 'style'" class="space-y-4">
          <!-- Electrical Component Dedicated Controls -->
          <div v-if="component && ['elec-breaker', 'elec-disconnector', 'elec-grounding'].includes(component.type)" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Zap class="w-4 h-4 text-amber-400" />
              <span>开关元件合分闸状态</span>
            </div>

            <!-- Switch / Breaker State Switcher -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">开关当前呈现状态 (State)</label>
              <select
                :value="component.customProps?.state || 'closed'"
                @change="updateComponentCustomProps({ state: ($event.target as HTMLSelectElement).value })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 outline-hidden cursor-pointer font-bold text-xs"
              >
                <option value="closed">🔴 合闸 (Closed / 闭合导通)</option>
                <option value="open">🟢 分闸 (Open / 断开隔离)</option>
                <option value="fault">⚠️ 故障跳闸 (Fault)</option>
              </select>
            </div>
          </div>

          <!-- Line & Polyline Controls (Independent Free Color & Styles) -->
          <div v-if="component.type === 'draw-line' || component.type === 'draw-polyline' || component.type === 'draw-arrow' || component.type === 'elec-busbar'" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Workflow class="w-4 h-4 text-cyan-400" />
              <span>线条/走线样式自由配置</span>
            </div>

            <!-- Line Color Quick Presets -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">线条预设配色</label>
              <div class="grid grid-cols-8 gap-1.5">
                <button
                  v-for="c in ['#00f2ff', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#f97316', '#38bdf8', '#ffffff']"
                  :key="c"
                  @click="updateComponentStyle({ stroke: c, voltageLevel: undefined })"
                  class="w-6 h-6 rounded-md border transition-transform hover:scale-110 cursor-pointer shadow-xs"
                  :style="{ backgroundColor: c, borderColor: (component.style.stroke || '#00f2ff') === c ? '#ffffff' : 'transparent' }"
                />
              </div>
            </div>

            <!-- Custom Stroke Color -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">线条自定义颜色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ stroke: ($event.target as HTMLInputElement).value, voltageLevel: undefined })"
                  class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  :value="component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ stroke: ($event.target as HTMLInputElement).value, voltageLevel: undefined })"
                  class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
            </div>

            <!-- Line Style -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">线条类型</label>
              <select
                :value="component.style.lineStyle || 'solid'"
                @change="updateComponentStyle({ lineStyle: ($event.target as HTMLSelectElement).value })"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden cursor-pointer"
              >
                <option value="solid">实线 (Solid)</option>
                <option value="dashed">虚线 (Dashed)</option>
                <option value="dotted">点线 (Dotted)</option>
              </select>
            </div>

            <!-- Stroke Width -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">线宽粗细: {{ component.style.strokeWidth || 3 }}px</label>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                :value="component.style.strokeWidth || 3"
                @input="updateComponentStyle({ strokeWidth: Number(($event.target as HTMLInputElement).value) })"
                class="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <!-- Text & Button Specific Typography Controls -->
          <div v-if="component.type === 'draw-text' || component.type === 'ctrl-button'" class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Type class="w-4 h-4 text-cyan-400" />
              <span>文字与字号设置</span>
            </div>

            <!-- Text Content -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">展示文本</label>
              <input
                type="text"
                :value="component.type === 'ctrl-button' ? (component.style.buttonText || component.name) : (component.style.text || component.name)"
                @input="component.type === 'ctrl-button' ? updateComponentStyle({ buttonText: ($event.target as HTMLInputElement).value }) : (updateComponentProps({ name: ($event.target as HTMLInputElement).value }), updateComponentStyle({ text: ($event.target as HTMLInputElement).value }))"
                class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 outline-hidden text-xs font-bold"
              />
            </div>

            <!-- Font Size -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">字号大小: {{ component.style.fontSize || 16 }}px</label>
              <input
                type="range"
                min="10"
                max="72"
                step="1"
                :value="component.style.fontSize || 16"
                @input="updateComponentStyle({ fontSize: Number(($event.target as HTMLInputElement).value) })"
                class="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <!-- Text Color -->
            <div>
              <label class="text-xs font-semibold text-slate-200 block mb-1">文字颜色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  :value="component.style.textColor || component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ textColor: ($event.target as HTMLInputElement).value })"
                  class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  :value="component.style.textColor || component.style.stroke || '#00f2ff'"
                  @input="updateComponentStyle({ textColor: ($event.target as HTMLInputElement).value })"
                  class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          <!-- Stroke / Border Color (For shapes/rect/circle) -->
          <div v-if="!['draw-line', 'draw-polyline', 'draw-arrow'].includes(component.type)">
            <label class="text-xs font-semibold text-slate-200 block mb-1">线条 / 轮廓色</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="component.style.stroke || '#00f2ff'"
                @input="updateComponentStyle({ stroke: ($event.target as HTMLInputElement).value })"
                class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
              />
              <input
                type="text"
                :value="component.style.stroke || '#00f2ff'"
                @input="updateComponentStyle({ stroke: ($event.target as HTMLInputElement).value })"
                class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- Fill Color Input -->
          <div v-if="!['draw-line', 'draw-polyline', 'draw-arrow', 'elec-busbar'].includes(component.type)">
            <label class="text-xs font-semibold text-slate-200 block mb-1">填充背景色</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="component.style.fill || '#00f2ff'"
                @input="updateComponentStyle({ fill: ($event.target as HTMLInputElement).value })"
                class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
              />
              <input
                type="text"
                :value="component.style.fill || 'transparent'"
                @input="updateComponentStyle({ fill: ($event.target as HTMLInputElement).value })"
                class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
              />
            </div>
          </div>

          <!-- SPECIFIC CONTROLS: Metric Float -->
          <div v-if="component.type === 'metric-float'" class="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2.5">
            <div class="text-xs font-bold text-cyan-300">浮点数数据显示设置</div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">小数位数 (Decimals)</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  :value="component.style.decimals ?? 2"
                  @input="updateComponentStyle({ decimals: Number(($event.target as HTMLInputElement).value) })"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">后缀单位 (Suffix)</label>
                <input
                  type="text"
                  :value="component.style.suffix || ''"
                  @input="updateComponentStyle({ suffix: ($event.target as HTMLInputElement).value })"
                  placeholder="如: kV, A, MW, ℃"
                  class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
                />
              </div>
            </div>
          </div>
          <!-- Streamer & Dynamic Glow Effect (流光动效) -->
          <div class="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2.5">
            <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
              <div class="flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-amber-400" />
                <span>动态流光特效 (Streamer Glow)</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="component.style.streamer?.active || false"
                  @change="updateComponentStyle({
                    streamer: {
                      ...(component.style.streamer || { color: '#00f2ff', speed: 2, direction: 'forward', type: 'laser', width: 2 }),
                      active: ($event.target as HTMLInputElement).checked
                    }
                  })"
                  class="sr-only peer"
                />
                <div class="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div v-if="component.style.streamer?.active" class="space-y-2 pt-1 border-t border-slate-800">
              <!-- Streamer Color -->
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">流光色彩</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    :value="component.style.streamer?.color || '#00f2ff'"
                    @input="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        color: ($event.target as HTMLInputElement).value
                      }
                    })"
                    class="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    :value="component.style.streamer?.color || '#00f2ff'"
                    @input="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        color: ($event.target as HTMLInputElement).value
                      }
                    })"
                    class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 font-semibold text-xs outline-hidden"
                  />
                </div>
              </div>

              <!-- Streamer Type & Direction -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-semibold text-slate-200 block mb-1">流光样式</label>
                  <select
                    :value="component.style.streamer?.type || 'laser'"
                    @change="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        type: ($event.target as HTMLSelectElement).value as any
                      }
                    })"
                    class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 text-xs outline-hidden cursor-pointer"
                  >
                    <option value="laser">激光流动 (Laser)</option>
                    <option value="pulse">脉冲波光 (Pulse)</option>
                    <option value="dots">光粒子虚点 (Dots)</option>
                  </select>
                </div>

                <div>
                  <label class="text-xs font-semibold text-slate-200 block mb-1">流动方向</label>
                  <select
                    :value="component.style.streamer?.direction || 'forward'"
                    @change="updateComponentStyle({
                      streamer: {
                        ...(component.style.streamer || {}),
                        direction: ($event.target as HTMLSelectElement).value as any
                      }
                    })"
                    class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2 py-1 text-slate-100 text-xs outline-hidden cursor-pointer"
                  >
                    <option value="forward">正向流动 (Forward)</option>
                    <option value="reverse">反向流动 (Reverse)</option>
                  </select>
                </div>
              </div>

              <!-- Streamer Speed -->
              <div>
                <label class="text-xs font-semibold text-slate-200 block mb-1">流速周期: {{ component.style.streamer?.speed || 2 }} 秒/圈</label>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.2"
                  :value="component.style.streamer?.speed || 2"
                  @input="updateComponentStyle({
                    streamer: {
                      ...(component.style.streamer || {}),
                      speed: Number(($event.target as HTMLInputElement).value)
                    }
                  })"
                  class="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: DATA BINDING -->
        <div v-if="activeTab === 'data'" class="space-y-4">
          <!-- State Simulation Test for Custom Symbols -->
          <div v-if="component.states && component.states.length > 0" class="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span class="flex items-center gap-1.5">
                <Workflow class="w-4 h-4 text-emerald-400" />
                <span>图元状态快速模拟测试</span>
              </span>
              <span class="text-[10px] text-slate-400">点击即时切换</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button
                v-for="st in component.states"
                :key="st.id"
                @click="updateComponentProps({ activeState: st.id })"
                class="py-1.5 px-2 rounded-lg text-xs font-mono cursor-pointer border transition-all truncate text-left flex items-center justify-between"
                :class="String(component.activeState ?? '1') === String(st.id)
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-xs'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50'"
              >
                <span class="truncate">{{ st.name }}</span>
                <span class="text-[10px] opacity-75 font-bold">值:{{ st.matchValue ?? st.id }}</span>
              </button>
            </div>
          </div>
          <!-- Bound Dataset Picker -->
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">关联动态数据集</label>
            <select
              :value="component.data.datasetId || ''"
              @change="updateComponentData({ datasetId: ($event.target as HTMLSelectElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 font-semibold text-xs outline-hidden cursor-pointer"
            >
              <option value="">未绑定 (使用组件默认数据)</option>
              <option v-for="ds in datasets" :key="ds.id" :value="ds.id">
                {{ ds.name }} ({{ ds.type }})
              </option>
            </select>
          </div>

          <!-- Dataset Field Inspector / Mappings -->
          <div v-if="boundDataset" class="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
              <span>可用遥测数据字段</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              <div
                v-for="field in (boundDataset?.fields || [])"
                :key="field.name"
                class="flex items-center justify-between p-2 rounded-lg bg-[#060b17] border border-slate-800 hover:border-cyan-500/60 text-xs cursor-pointer transition-colors"
                @click="updateComponentData({ mapping: { ...component.data.mapping, valueKey: field.name, stateKey: field.name } })"
              >
                <div class="flex items-center gap-1.5">
                  <span class="text-cyan-300 font-bold">{{ field.label || field.name }}</span>
                  <span class="text-slate-400 text-[11px]">({{ field.name }})</span>
                </div>
                <span class="text-slate-200 font-mono font-bold">
                  {{ (Array.isArray(boundDataset.data) ? boundDataset.data[0]?.[field.name] : boundDataset.data?.[field.name]) ?? '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: INTERACTION & SCREEN NAVIGATION -->
        <div v-if="activeTab === 'interaction'" class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">点击触发行为 (Action)</label>
            <select
              :value="(component.data.action?.type === 'switch-screen' ? 'jump-screen' : component.data.action?.type) || 'none'"
              @change="updateComponentAction({ type: ($event.target as HTMLSelectElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 outline-hidden cursor-pointer font-bold text-xs"
            >
              <option value="none">无交互事件</option>
              <option value="jump-screen">🔗 切换跳转至子大屏页面</option>
              <option value="link">🌐 打开外部系统链接</option>
            </select>
          </div>

          <!-- Target Screen Selector -->
          <div v-if="component.data.action?.type === 'jump-screen' || component.data.action?.type === 'switch-screen'" class="space-y-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
            <label class="text-xs text-cyan-300 font-bold block">选择目标子大屏</label>
            <select
              :value="component.data.action?.targetScreenId || ''"
              @change="updateComponentAction({ targetScreenId: ($event.target as HTMLSelectElement).value })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-cyan-200 font-semibold outline-hidden cursor-pointer text-xs"
            >
              <option value="" disabled>请选择要跳转的大屏...</option>
              <option v-for="sc in screens" :key="sc.id" :value="sc.id">
                {{ sc.name }} ({{ sc.screen.width }} × {{ sc.screen.height }})
              </option>
            </select>
            <p class="text-[11px] text-slate-300 leading-relaxed">设置后，在大屏预览演示或点击按钮时将自动平滑切换至目标大屏。</p>
          </div>

          <!-- External Link Input -->
          <div v-if="component.data.action?.type === 'link'" class="space-y-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
            <label class="text-xs text-cyan-300 font-bold block">外部系统链接 (URL)</label>
            <input
              type="url"
              :value="component.data.action?.url || ''"
              @input="updateComponentAction({ url: ($event.target as HTMLInputElement).value })"
              placeholder="https://..."
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold outline-hidden text-xs"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 3. GLOBAL SCREEN INSPECTOR VIEW ================= -->
    <template v-else>
      <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
        <div class="text-xs font-bold text-cyan-300 uppercase tracking-wider">
          画布全局尺寸与风格
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-200 block mb-1">大屏名称</label>
          <input
            :value="screen.name"
            @input="emit('update:screen', { ...screen, name: ($event.target as HTMLInputElement).value })"
            class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">宽度 (px)</label>
            <input
              type="number"
              :value="screen.width"
              @input="emit('update:screen', { ...screen, width: Number(($event.target as HTMLInputElement).value) })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-200 block mb-1">高度 (px)</label>
            <input
              type="number"
              :value="screen.height"
              @input="emit('update:screen', { ...screen, height: Number(($event.target as HTMLInputElement).value) })"
              class="w-full bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
            />
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-200 block mb-1">画布背景底色</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="screen.backgroundColor || '#040810'"
              @input="emit('update:screen', { ...screen, backgroundColor: ($event.target as HTMLInputElement).value })"
              class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
            />
            <input
              type="text"
              :value="screen.backgroundColor || '#040810'"
              @input="emit('update:screen', { ...screen, backgroundColor: ($event.target as HTMLInputElement).value })"
              class="flex-1 bg-[#060b17] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs outline-hidden"
            />
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>
