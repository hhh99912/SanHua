<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { CustomSymbolDef, ScreenComponent } from '../types';
import { getCustomSymbols, saveCustomSymbols, addCustomSymbol, removeCustomSymbol } from '../utils/customSymbolStorage';
import WidgetRenderer from './widgets/WidgetRenderer.vue';
import { 
  Plus, Trash2, Edit2, Copy, Sparkles, Box, Check, X, 
  Zap, Layers, Upload, Download, Tag, Search,
  Square, Circle, MoveRight, Type, Workflow,
  ToggleRight, CircleDot, Activity, Cpu, Binary, Eye,
  ArrowUp, ArrowDown, Grid, RefreshCw, BookmarkPlus,
  SlidersHorizontal, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-vue-next';

interface Props {
  visible: boolean;
  selectedComponent?: ScreenComponent | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'use:symbol', symbol: CustomSymbolDef): void;
  (e: 'update:symbols', symbols: CustomSymbolDef[]): void;
}>();

const symbols = ref<CustomSymbolDef[]>([]);
const searchQuery = ref('');
const activeCategory = ref<'all' | 'electrical' | 'custom' | 'industrial'>('all');

// Preview State Map for interactive preview in library cards
const previewActiveStates = ref<Record<string, string>>({});

// Smart Wizard Modal State
const isWizardOpen = ref<boolean>(false);
const wizardTemplate = ref<'handcart-breaker' | 'three-winding-transformer' | 'isolator-switch' | 'inverter-cabinet'>('handcart-breaker');
const wizardConfig = ref({
  voltageLevel: '10kV',
  colorTheme: '#00f2ff',
  name: '10kV 真空手车断路器'
});

const loadSymbols = () => {
  symbols.value = getCustomSymbols();
};

watch(() => props.visible, (val) => {
  if (val) {
    loadSymbols();
  }
});

const filteredSymbols = computed(() => {
  return symbols.value.filter(s => {
    const matchesCat = activeCategory.value === 'all' || s.category === activeCategory.value;
    const matchesQuery = !searchQuery.value.trim() || 
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase())));
    return matchesCat && matchesQuery;
  });
});

const handleUseSymbol = (sym: CustomSymbolDef) => {
  emit('use:symbol', sym);
  emit('close');
};

const handleDeleteSymbol = (id: string, name: string) => {
  if (confirm(`确定要删除自定义图元「${name}」吗？`)) {
    removeCustomSymbol(id);
    loadSymbols();
    emit('update:symbols', symbols.value);
  }
};

const handleDuplicateSymbol = (sym: CustomSymbolDef) => {
  const newSym: CustomSymbolDef = {
    ...JSON.parse(JSON.stringify(sym)),
    id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${sym.name} (副本)`,
    createdAt: new Date().toISOString()
  };
  addCustomSymbol(newSym);
  loadSymbols();
  emit('update:symbols', symbols.value);
};

// Export All Symbols to JSON
const handleExportSymbols = () => {
  const json = JSON.stringify(symbols.value, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scada-custom-symbols-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Import Symbols from JSON
const fileInputRef = ref<HTMLInputElement | null>(null);

const handleImportClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target?.result as string);
      if (Array.isArray(imported)) {
        const merged = [...symbols.value];
        imported.forEach(item => {
          if (item.name && (item.states || item.children)) {
            const exists = merged.some(m => m.id === item.id);
            if (exists) {
              item.id = `sym-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            }
            merged.push(item);
          }
        });
        saveCustomSymbols(merged);
        loadSymbols();
        emit('update:symbols', merged);
        alert(`成功导入 ${imported.length} 个图元资产！`);
      }
    } catch (err) {
      alert('图元 JSON 文件格式错误，无法导入。');
    }
  };
  reader.readAsText(file);
};

// Generate Multi-State Standard Industrial Symbol Wizard
const handleGenerateWizardSymbol = () => {
  const color = wizardConfig.value.colorTheme;
  const level = wizardConfig.value.voltageLevel;

  let newSym: CustomSymbolDef;

  if (wizardTemplate.value === 'handcart-breaker') {
    newSym = {
      id: `sym-breaker-${Date.now()}`,
      name: wizardConfig.value.name || `${level} 手车断路器`,
      category: 'electrical',
      description: `${level} 等级真空手车断路器，支持合闸/分闸/试验/检修四态切换`,
      defaultWidth: 90,
      defaultHeight: 130,
      tags: ['电力', '断路器', '手车', level],
      createdAt: new Date().toISOString(),
      activeState: '1',
      states: [
        {
          id: '1',
          name: '工作位·合闸 (闭合运行)',
          children: [
            {
              id: 'c1',
              name: '手车底盘框架',
              type: 'draw-rect',
              category: 'basic',
              x: 10,
              y: 10,
              width: 70,
              height: 110,
              rotation: 0,
              zIndex: 1,
              style: { fill: 'rgba(6, 15, 30, 0.9)', stroke: color, strokeWidth: 2, borderRadius: 4 },
              data: { mapping: {} }
            },
            {
              id: 'c2',
              name: '上动静触头座',
              type: 'draw-rect',
              category: 'basic',
              x: 35,
              y: 0,
              width: 20,
              height: 14,
              rotation: 0,
              zIndex: 2,
              style: { fill: '#00f2ff', stroke: '#00f2ff', strokeWidth: 1, borderRadius: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c3',
              name: '下动静触头座',
              type: 'draw-rect',
              category: 'basic',
              x: 35,
              y: 116,
              width: 20,
              height: 14,
              rotation: 0,
              zIndex: 2,
              style: { fill: '#00f2ff', stroke: '#00f2ff', strokeWidth: 1, borderRadius: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c4',
              name: '合闸灭弧触头',
              type: 'draw-rect',
              category: 'basic',
              x: 30,
              y: 40,
              width: 30,
              height: 50,
              rotation: 0,
              zIndex: 3,
              style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2, borderRadius: 4 },
              data: { mapping: {} }
            }
          ]
        },
        {
          id: '0',
          name: '工作位·分闸 (断开就绪)',
          children: [
            {
              id: 'c1',
              name: '手车底盘框架',
              type: 'draw-rect',
              category: 'basic',
              x: 10,
              y: 10,
              width: 70,
              height: 110,
              rotation: 0,
              zIndex: 1,
              style: { fill: 'rgba(6, 15, 30, 0.9)', stroke: color, strokeWidth: 2, borderRadius: 4 },
              data: { mapping: {} }
            },
            {
              id: 'c2',
              name: '上动静触头座',
              type: 'draw-rect',
              category: 'basic',
              x: 35,
              y: 0,
              width: 20,
              height: 14,
              rotation: 0,
              zIndex: 2,
              style: { fill: '#00f2ff', stroke: '#00f2ff', strokeWidth: 1, borderRadius: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c3',
              name: '下动静触头座',
              type: 'draw-rect',
              category: 'basic',
              x: 35,
              y: 116,
              width: 20,
              height: 14,
              rotation: 0,
              zIndex: 2,
              style: { fill: '#00f2ff', stroke: '#00f2ff', strokeWidth: 1, borderRadius: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c4',
              name: '分闸状态触头',
              type: 'draw-rect',
              category: 'basic',
              x: 30,
              y: 40,
              width: 30,
              height: 50,
              rotation: 0,
              zIndex: 3,
              style: { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981', strokeWidth: 2, borderRadius: 4 },
              data: { mapping: {} }
            }
          ]
        },
        {
          id: '2',
          name: '试验位置 (拉出隔离)',
          children: [
            {
              id: 'c1',
              name: '手车底盘框架',
              type: 'draw-rect',
              category: 'basic',
              x: 10,
              y: 10,
              width: 70,
              height: 110,
              rotation: 0,
              zIndex: 1,
              style: { fill: 'rgba(6, 15, 30, 0.6)', stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '4,4', borderRadius: 4 },
              data: { mapping: {} }
            },
            {
              id: 'c4',
              name: '试验触头',
              type: 'draw-rect',
              category: 'basic',
              x: 30,
              y: 40,
              width: 30,
              height: 50,
              rotation: 0,
              zIndex: 3,
              style: { fill: 'rgba(245, 158, 11, 0.25)', stroke: '#f59e0b', strokeWidth: 2, borderRadius: 4 },
              data: { mapping: {} }
            }
          ]
        }
      ]
    };
  } else if (wizardTemplate.value === 'three-winding-transformer') {
    newSym = {
      id: `sym-xfmr-${Date.now()}`,
      name: wizardConfig.value.name || `${level} 三卷电力变压器`,
      category: 'electrical',
      description: `${level} 主变压器 (高/中/低三绕组耦合带运行潮流显示)`,
      defaultWidth: 100,
      defaultHeight: 140,
      tags: ['变压器', '三卷变', level],
      createdAt: new Date().toISOString(),
      activeState: '1',
      states: [
        {
          id: '1',
          name: '正常运行 (带电潮流)',
          children: [
            {
              id: 'c1',
              name: '高压绕组圈',
              type: 'draw-circle',
              category: 'basic',
              x: 25,
              y: 10,
              width: 50,
              height: 50,
              rotation: 0,
              zIndex: 1,
              style: { fill: 'rgba(0, 242, 255, 0.15)', stroke: color, strokeWidth: 3 },
              data: { mapping: {} }
            },
            {
              id: 'c2',
              name: '中压绕组圈',
              type: 'draw-circle',
              category: 'basic',
              x: 10,
              y: 45,
              width: 50,
              height: 50,
              rotation: 0,
              zIndex: 2,
              style: { fill: 'rgba(0, 229, 163, 0.15)', stroke: '#00e5a3', strokeWidth: 3 },
              data: { mapping: {} }
            },
            {
              id: 'c3',
              name: '低压绕组圈',
              type: 'draw-circle',
              category: 'basic',
              x: 40,
              y: 45,
              width: 50,
              height: 50,
              rotation: 0,
              zIndex: 3,
              style: { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6', strokeWidth: 3 },
              data: { mapping: {} }
            }
          ]
        },
        {
          id: '0',
          name: '停运检修',
          children: [
            {
              id: 'c1',
              name: '高压绕组圈',
              type: 'draw-circle',
              category: 'basic',
              x: 25,
              y: 10,
              width: 50,
              height: 50,
              rotation: 0,
              zIndex: 1,
              style: { fill: 'rgba(100, 116, 139, 0.15)', stroke: '#64748b', strokeWidth: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c2',
              name: '中压绕组圈',
              type: 'draw-circle',
              category: 'basic',
              x: 10,
              y: 45,
              width: 50,
              height: 50,
              rotation: 0,
              zIndex: 2,
              style: { fill: 'rgba(100, 116, 139, 0.15)', stroke: '#64748b', strokeWidth: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c3',
              name: '低压绕组圈',
              type: 'draw-circle',
              category: 'basic',
              x: 40,
              y: 45,
              width: 50,
              height: 50,
              rotation: 0,
              zIndex: 3,
              style: { fill: 'rgba(100, 116, 139, 0.15)', stroke: '#64748b', strokeWidth: 2 },
              data: { mapping: {} }
            }
          ]
        }
      ]
    };
  } else {
    // Isolator switch
    newSym = {
      id: `sym-iso-${Date.now()}`,
      name: wizardConfig.value.name || `${level} 旋转隔离开关`,
      category: 'electrical',
      description: `${level} 隔离开关带刀闸分合动态与闭锁`,
      defaultWidth: 70,
      defaultHeight: 90,
      tags: ['隔离开关', '刀闸', level],
      createdAt: new Date().toISOString(),
      activeState: '1',
      states: [
        {
          id: '1',
          name: '合闸连通',
          children: [
            {
              id: 'c1',
              name: '上触头',
              type: 'draw-circle',
              category: 'basic',
              x: 30,
              y: 5,
              width: 10,
              height: 10,
              rotation: 0,
              zIndex: 1,
              style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c2',
              name: '闭合导电触刀',
              type: 'draw-polyline',
              category: 'basic',
              x: 34,
              y: 15,
              width: 2,
              height: 60,
              rotation: 0,
              zIndex: 2,
              style: { stroke: '#ef4444', strokeWidth: 3 },
              data: { mapping: {} },
              customProps: {
                points: [{ x: 1, y: 0, xRatio: 0.5, yRatio: 0 }, { x: 1, y: 60, xRatio: 0.5, yRatio: 1 }]
              }
            },
            {
              id: 'c3',
              name: '下触头',
              type: 'draw-circle',
              category: 'basic',
              x: 30,
              y: 75,
              width: 10,
              height: 10,
              rotation: 0,
              zIndex: 3,
              style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 },
              data: { mapping: {} }
            }
          ]
        },
        {
          id: '0',
          name: '分闸断开 (45°打开)',
          children: [
            {
              id: 'c1',
              name: '上触头',
              type: 'draw-circle',
              category: 'basic',
              x: 30,
              y: 5,
              width: 10,
              height: 10,
              rotation: 0,
              zIndex: 1,
              style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2 },
              data: { mapping: {} }
            },
            {
              id: 'c2',
              name: '断开触刀 (45度斜开)',
              type: 'draw-polyline',
              category: 'basic',
              x: 10,
              y: 20,
              width: 25,
              height: 55,
              rotation: 0,
              zIndex: 2,
              style: { stroke: '#10b981', strokeWidth: 3 },
              data: { mapping: {} },
              customProps: {
                points: [{ x: 0, y: 0, xRatio: 0, yRatio: 0 }, { x: 25, y: 55, xRatio: 1, yRatio: 1 }]
              }
            },
            {
              id: 'c3',
              name: '下触头',
              type: 'draw-circle',
              category: 'basic',
              x: 30,
              y: 75,
              width: 10,
              height: 10,
              rotation: 0,
              zIndex: 3,
              style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2 },
              data: { mapping: {} }
            }
          ]
        }
      ]
    };
  }

  addCustomSymbol(newSym);
  loadSymbols();
  emit('update:symbols', symbols.value);
  isWizardOpen.value = false;
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none">
    <!-- Hidden input for JSON importing -->
    <input 
      type="file" 
      ref="fileInputRef" 
      accept=".json" 
      class="hidden" 
      @change="handleFileChange" 
    />

    <div class="w-[96vw] max-w-6xl h-[88vh] bg-[#050914] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden">
      <!-- Modal Header -->
      <div class="h-14 bg-[#080e1c] border-b border-slate-800 px-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.3)]">
            <Box class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>自定义图元资产工坊</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                SCADA Symbol Workshop
              </span>
            </h2>
            <p class="text-[11px] text-slate-400">
              与主画布全面共用无限画布、网格吸附与折线编辑引擎，支持多态封装与一键实例化
            </p>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-3">
          <button
            @click="isWizardOpen = true"
            class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>智能向导生成图元</span>
          </button>

          <button
            @click="handleImportClick"
            class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/50 text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="导入图元 JSON 资产包"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>导入资产包</span>
          </button>

          <button
            @click="handleExportSymbols"
            class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/50 text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="导出全部图元为 JSON 文件"
          >
            <Download class="w-3.5 h-3.5" />
            <span>导出资产包</span>
          </button>

          <div class="h-4 w-[1px] bg-slate-800" />

          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Main Content Area: Category Bar + Search + Grid of Symbols -->
      <div class="flex-1 flex flex-col overflow-hidden p-5 gap-4">
        <!-- Filter Controls -->
        <div class="flex items-center justify-between gap-4 bg-[#070c18] p-3 rounded-xl border border-slate-800/80">
          <div class="flex items-center gap-2">
            <button
              @click="activeCategory = 'all'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              :class="activeCategory === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
            >
              全部图元 ({{ symbols.length }})
            </button>
            <button
              @click="activeCategory = 'electrical'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              :class="activeCategory === 'electrical' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
            >
              <Zap class="w-3 h-3" />
              <span>电力一次设备</span>
            </button>
            <button
              @click="activeCategory = 'industrial'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              :class="activeCategory === 'industrial' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
            >
              <Cpu class="w-3 h-3" />
              <span>工业光储</span>
            </button>
            <button
              @click="activeCategory = 'custom'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              :class="activeCategory === 'custom' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'"
            >
              <BookmarkPlus class="w-3 h-3" />
              <span>自定义封装图元</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative w-64">
            <Search class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索图元名称或标签..."
              class="w-full bg-[#040810] border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden"
            />
          </div>
        </div>

        <!-- Symbols Grid View -->
        <div class="flex-1 overflow-y-auto pr-1">
          <div v-if="filteredSymbols.length === 0" class="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
            <Box class="w-12 h-12 text-slate-700" />
            <div class="text-sm">暂无匹配的自定义图元</div>
            <button
              @click="isWizardOpen = true"
              class="px-4 py-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
            >
              使用智能向导生成第一个标准图元
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="sym in filteredSymbols"
              :key="sym.id"
              class="bg-[#070c18] border border-slate-800/90 hover:border-cyan-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group hover:shadow-[0_4px_20px_rgba(0,242,255,0.08)]"
            >
              <!-- Card Top -->
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 class="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {{ sym.name }}
                    </h3>
                    <p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {{ sym.description || 'SCADA 工业图元' }}
                    </p>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    {{ sym.defaultWidth }} × {{ sym.defaultHeight }}
                  </span>
                </div>

                <!-- Multi-State Selector Tabs (If has states) -->
                <div v-if="sym.states && sym.states.length > 1" class="flex items-center gap-1 mb-2.5 overflow-x-auto py-1">
                  <button
                    v-for="st in sym.states"
                    :key="st.id"
                    @click="previewActiveStates[sym.id] = st.id"
                    class="px-2 py-0.5 rounded text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer"
                    :class="(previewActiveStates[sym.id] || sym.activeState || sym.states[0]?.id) === st.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'"
                  >
                    {{ st.name }}
                  </button>
                </div>

                <!-- Live Symbol Rendering Canvas Preview -->
                <div class="h-44 w-full bg-[#03060f] border border-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden my-2 group-hover:border-cyan-500/30 transition-colors">
                  <div 
                    class="relative"
                    :style="{
                      width: `${sym.defaultWidth}px`,
                      height: `${sym.defaultHeight}px`,
                      transform: `scale(${Math.min(1, 140 / Math.max(sym.defaultWidth, sym.defaultHeight))})`,
                      transformOrigin: 'center center'
                    }"
                  >
                    <template v-if="sym.states && sym.states.length > 0">
                      <template v-for="child in (sym.states.find(s => s.id === (previewActiveStates[sym.id] || sym.activeState || sym.states?.[0]?.id))?.children || sym.children || [])" :key="child.id">
                        <div
                          class="absolute"
                          :style="{
                            left: `${child.x}px`,
                            top: `${child.y}px`,
                            width: `${child.width}px`,
                            height: `${child.height}px`,
                            transform: `rotate(${child.rotation || 0}deg)`,
                            zIndex: child.zIndex || 1
                          }"
                        >
                          <WidgetRenderer :component="child" />
                        </div>
                      </template>
                    </template>
                    <template v-else-if="sym.children">
                      <div
                        v-for="child in sym.children"
                        :key="child.id"
                        class="absolute"
                        :style="{
                          left: `${child.x}px`,
                          top: `${child.y}px`,
                          width: `${child.width}px`,
                          height: `${child.height}px`,
                          transform: `rotate(${child.rotation || 0}deg)`,
                          zIndex: child.zIndex || 1
                        }"
                      >
                        <WidgetRenderer :component="child" />
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Tags list -->
                <div class="flex items-center gap-1.5 flex-wrap my-1.5">
                  <span
                    v-for="tag in sym.tags"
                    :key="tag"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 text-cyan-400/80 border border-cyan-500/20"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>

              <!-- Card Bottom Actions -->
              <div class="flex items-center justify-between pt-3 border-t border-slate-900 mt-2">
                <div class="flex items-center gap-1">
                  <button
                    @click="handleDuplicateSymbol(sym)"
                    class="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="复制副本"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteSymbol(sym.id, sym.name)"
                    class="p-1.5 rounded-md hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                    title="删除图元"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  @click="handleUseSymbol(sym)"
                  class="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>放置到主画布</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Smart Generator Wizard Modal -->
    <div v-if="isWizardOpen" class="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <div class="w-[520px] bg-[#070d1a] border border-cyan-500/50 rounded-xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2 text-cyan-300 font-bold text-sm">
            <Sparkles class="w-4 h-4" />
            <span>智能多态电气图元向导生成</span>
          </div>
          <button @click="isWizardOpen = false" class="text-slate-400 hover:text-white cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="text-slate-400 font-medium block mb-1">选择标准化电气图元模板</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="wizardTemplate = 'handcart-breaker'; wizardConfig.name = `${wizardConfig.voltageLevel} 手车断路器`;"
                class="p-2.5 rounded-lg border text-left cursor-pointer transition-all"
                :class="wizardTemplate === 'handcart-breaker' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
              >
                <div class="font-bold">真空手车断路器</div>
                <div class="text-[10px] text-slate-400 mt-0.5">带工作/分闸/试验三态切换</div>
              </button>
              <button
                @click="wizardTemplate = 'three-winding-transformer'; wizardConfig.name = `${wizardConfig.voltageLevel} 三卷主变压器`;"
                class="p-2.5 rounded-lg border text-left cursor-pointer transition-all"
                :class="wizardTemplate === 'three-winding-transformer' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
              >
                <div class="font-bold">三卷电力变压器</div>
                <div class="text-[10px] text-slate-400 mt-0.5">高/中/低三绕组耦合潮流</div>
              </button>
              <button
                @click="wizardTemplate = 'isolator-switch'; wizardConfig.name = `${wizardConfig.voltageLevel} 旋转隔离开关`;"
                class="p-2.5 rounded-lg border text-left cursor-pointer transition-all"
                :class="wizardTemplate === 'isolator-switch' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'"
              >
                <div class="font-bold">旋转隔离开关</div>
                <div class="text-[10px] text-slate-400 mt-0.5">带45度刀闸开合动态</div>
              </button>
            </div>
          </div>

          <div>
            <label class="text-slate-400 font-medium block mb-1">图元名称</label>
            <input
              v-model="wizardConfig.name"
              type="text"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 focus:outline-hidden"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-slate-400 font-medium block mb-1">电压等级</label>
              <select
                v-model="wizardConfig.voltageLevel"
                @change="wizardConfig.name = `${wizardConfig.voltageLevel} ${wizardTemplate === 'handcart-breaker' ? '手车断路器' : wizardTemplate === 'three-winding-transformer' ? '三卷主变压器' : '旋转隔离开关'}`"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 focus:outline-hidden"
              >
                <option value="10kV">10kV 中压</option>
                <option value="35kV">35kV 高压</option>
                <option value="110kV">110kV 超高压</option>
                <option value="220kV">220kV 特高压</option>
                <option value="0.4kV">0.4kV 低压配电</option>
              </select>
            </div>

            <div>
              <label class="text-slate-400 font-medium block mb-1">发光主题色彩</label>
              <select
                v-model="wizardConfig.colorTheme"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 focus:outline-hidden"
              >
                <option value="#00f2ff">青蓝科技 (#00f2ff)</option>
                <option value="#00e5a3">翠绿环保 (#00e5a3)</option>
                <option value="#f59e0b">琥珀暖金 (#f59e0b)</option>
                <option value="#3b82f6">经典电网蓝 (#3b82f6)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            @click="isWizardOpen = false"
            class="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer text-xs"
          >
            取消
          </button>
          <button
            @click="handleGenerateWizardSymbol"
            class="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer text-xs"
          >
            立即生成图元并入库
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
