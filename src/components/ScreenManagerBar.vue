<script setup lang="ts">
import { ref } from 'vue';
import { ScreenItem } from '../types';
import { 
  Plus, Copy, Trash2, Edit3, Monitor, Layers, 
  ChevronRight, ExternalLink, Sparkles, Layout
} from 'lucide-vue-next';

interface Props {
  screens: ScreenItem[];
  activeScreenId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'switch:screen', screenId: string): void;
  (e: 'add:screen', payload: { name: string; width: number; height: number }): void;
  (e: 'duplicate:screen', screenId: string): void;
  (e: 'rename:screen', payload: { screenId: string; newName: string }): void;
  (e: 'delete:screen', screenId: string): void;
}>();

const showAddModal = ref(false);
const newScreenName = ref('');
const newScreenWidth = ref(1920);
const newScreenHeight = ref(1080);

const renamingScreenId = ref<string | null>(null);
const renamingText = ref('');

const handleStartRename = (screen: ScreenItem) => {
  renamingScreenId.value = screen.id;
  renamingText.value = screen.name;
};

const handleConfirmRename = () => {
  if (renamingScreenId.value && renamingText.value.trim()) {
    emit('rename:screen', {
      screenId: renamingScreenId.value,
      newName: renamingText.value.trim()
    });
  }
  renamingScreenId.value = null;
};

const handleConfirmAdd = () => {
  if (!newScreenName.value.trim()) return;
  emit('add:screen', {
    name: newScreenName.value.trim(),
    width: newScreenWidth.value,
    height: newScreenHeight.value
  });
  newScreenName.value = '';
  showAddModal.value = false;
};
</script>

<template>
  <div class="h-10 bg-[#050914] border-t border-slate-800/80 flex items-center justify-between px-3 z-30 select-none font-mono">
    <!-- Left: Screen Tabs List -->
    <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 mr-4 py-1">
      <div class="flex items-center gap-1.5 text-xs text-cyan-400 font-bold px-2 shrink-0 border-r border-slate-800">
        <Layout class="w-3.5 h-3.5" />
        <span>大屏页面 ({{ screens.length }})</span>
      </div>

      <div
        v-for="item in screens"
        :key="item.id"
        class="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer shrink-0 border"
        :class="activeScreenId === item.id 
          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]' 
          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80'"
        @click="emit('switch:screen', item.id)"
      >
        <Monitor class="w-3 h-3 text-cyan-400 shrink-0" />
        
        <!-- Screen Name / Inline Rename Input -->
        <input 
          v-if="renamingScreenId === item.id"
          v-model="renamingText"
          @blur="handleConfirmRename"
          @keydown.enter="handleConfirmRename"
          @click.stop
          class="bg-slate-950 px-1 py-0.5 rounded text-xs text-cyan-200 border border-cyan-400 focus:outline-hidden w-36 font-mono"
          autofocus
        />
        <span v-else class="truncate max-w-[150px] font-bold">
          {{ item.name }}
        </span>

        <span class="text-[9px] px-1 py-0.2 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
          {{ item.components?.length || 0 }}
        </span>

        <!-- Hover Quick Actions (Duplicate / Rename / Delete) -->
        <div class="hidden group-hover:flex items-center gap-1 ml-1 pl-1 border-l border-slate-700/60">
          <button
            @click.stop="handleStartRename(item)"
            class="p-0.5 text-slate-400 hover:text-cyan-300 transition-colors"
            title="重命名大屏"
          >
            <Edit3 class="w-2.5 h-2.5" />
          </button>
          <button
            @click.stop="emit('duplicate:screen', item.id)"
            class="p-0.5 text-slate-400 hover:text-emerald-300 transition-colors"
            title="复制此大屏"
          >
            <Copy class="w-2.5 h-2.5" />
          </button>
          <button
            v-if="screens.length > 1"
            @click.stop="emit('delete:screen', item.id)"
            class="p-0.5 text-slate-400 hover:text-red-400 transition-colors"
            title="删除大屏"
          >
            <Trash2 class="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <!-- Add Screen Button -->
      <button
        @click="showAddModal = true"
        class="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-all cursor-pointer shrink-0"
        title="新建大屏页面"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>添加大屏</span>
      </button>
    </div>

    <!-- Right: Screen Resolution Info -->
    <div class="text-[11px] text-slate-500 flex items-center gap-2 shrink-0">
      <span>当前分辨率: <strong class="text-slate-300">1920×1080</strong> (16:9)</span>
    </div>

    <!-- Add Screen Modal -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div class="bg-[#080e1c] border border-cyan-500/40 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
        <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Plus class="w-4 h-4 text-cyan-400" />
          新建大屏页面
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">大屏名称 *</label>
            <input 
              v-model="newScreenName"
              placeholder="例如：变电站二次回路与直流屏"
              class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:outline-hidden"
              autofocus
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">宽度 (px)</label>
              <input 
                type="number" 
                v-model.number="newScreenWidth" 
                class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">高度 (px)</label>
              <input 
                type="number" 
                v-model.number="newScreenHeight" 
                class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button 
            @click="showAddModal = false"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
          >
            取消
          </button>
          <button 
            @click="handleConfirmAdd"
            class="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
          >
            立即创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
