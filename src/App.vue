<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { 
  ScreenConfig, 
  ScreenComponent, 
  DatasetItem, 
  MultiScreenProjectSchema, 
  HistorySnapshot,
  ScreenItem,
  CustomSymbolDef
} from './types';
import { INITIAL_DATASETS, tickDataset } from './data/presetDatasets';
import { PRESET_MULTI_SCREENS } from './data/presetMultiScreens';
import { getCustomSymbols, addCustomSymbol } from './utils/customSymbolStorage';
import Navbar from './components/Navbar.vue';
import ComponentPalette from './components/ComponentPalette.vue';
import LayerManager from './components/LayerManager.vue';
import CanvasEditor from './components/CanvasEditor.vue';
import PropertyInspector from './components/PropertyInspector.vue';
import ScreenManagerBar from './components/ScreenManagerBar.vue';
import CustomSymbolModal from './components/CustomSymbolModal.vue';
import SaveSymbolModal from './components/SaveSymbolModal.vue';
import DatasetManagerModal from './components/DatasetManagerModal.vue';
import JsonExportImportModal from './components/JsonExportImportModal.vue';
import PreviewScreen from './components/PreviewScreen.vue';
import DesktopPlatformModal from './components/DesktopPlatformModal.vue';
import { Sparkles, Layers, Box, Zap } from 'lucide-vue-next';

// 1. Initial State: Load Multi-Screen Electrical Project
const screens = ref<ScreenItem[]>(JSON.parse(JSON.stringify(PRESET_MULTI_SCREENS)));
const activeScreenId = ref<string>(PRESET_MULTI_SCREENS[0].id);

// Current active screen object & components ref
const currentScreenItem = computed(() => {
  return screens.value.find(s => s.id === activeScreenId.value) || screens.value[0];
});

const screen = ref<ScreenConfig>({
  ...currentScreenItem.value.screen,
  updatedAt: new Date().toISOString()
});

const components = ref<ScreenComponent[]>([...currentScreenItem.value.components]);
const datasets = ref<DatasetItem[]>([...INITIAL_DATASETS]);
const selectedIds = ref<string[]>([]);
const zoom = ref<number>(0.62);
const isStreaming = ref<boolean>(true);
const leftSidebarTab = ref<'palette' | 'layers'>('palette');
const drawTool = ref<'select' | 'draw-line' | 'draw-polyline'>('select');

// Modals
const showDatasetsModal = ref(false);
const showJsonModal = ref(false);
const showPreviewModal = ref(false);
const showSymbolModal = ref(false);
const showSaveSymbolModal = ref(false);
const showPlatformModal = ref(false);
const componentsToSave = ref<ScreenComponent[]>([]);

// Synchronize current components & screen configuration back to screens array
const syncActiveScreenToProject = () => {
  const target = screens.value.find(s => s.id === activeScreenId.value);
  if (target) {
    target.screen = JSON.parse(JSON.stringify(screen.value));
    target.components = JSON.parse(JSON.stringify(components.value));
  }
};

// Switch active screen
const handleSwitchScreen = (screenId: string) => {
  if (screenId === activeScreenId.value) return;
  // 1. Save current screen state
  syncActiveScreenToProject();

  // 2. Find target screen
  const target = screens.value.find(s => s.id === screenId);
  if (!target) return;

  activeScreenId.value = screenId;
  screen.value = JSON.parse(JSON.stringify(target.screen));
  components.value = JSON.parse(JSON.stringify(target.components));
  selectedIds.value = [];

  fitToScreen();
  recordHistory();
};

// Add new screen
const handleAddScreen = (payload: { name: string; width: number; height: number }) => {
  syncActiveScreenToProject();
  const newId = `screen-${Date.now()}`;
  const newScreenItem: ScreenItem = {
    id: newId,
    name: payload.name,
    screen: {
      id: newId,
      name: payload.name,
      width: payload.width || 1920,
      height: payload.height || 1080,
      backgroundColor: '#040914',
      backgroundGrid: true,
      gridSize: 20,
      gridColor: 'rgba(0, 242, 255, 0.05)',
      theme: 'cyber-dark',
      version: '2.0.0',
      updatedAt: new Date().toISOString()
    },
    components: [
      {
        id: `comp-nav-${Date.now()}`,
        name: '大屏导航条',
        type: 'nav-tabs',
        category: 'custom',
        x: 60,
        y: 20,
        width: payload.width - 120,
        height: 52,
        rotation: 0,
        zIndex: 10,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          strokeWidth: 1,
          borderRadius: 10
        },
        data: { mapping: {} }
      }
    ]
  };

  screens.value.push(newScreenItem);
  handleSwitchScreen(newId);
};

// Duplicate screen
const handleDuplicateScreen = (screenId: string) => {
  syncActiveScreenToProject();
  const source = screens.value.find(s => s.id === screenId);
  if (!source) return;

  const newId = `screen-${Date.now()}`;
  const cloned: ScreenItem = {
    id: newId,
    name: `${source.name} (副本)`,
    description: source.description,
    screen: {
      ...JSON.parse(JSON.stringify(source.screen)),
      id: newId,
      name: `${source.name} (副本)`
    },
    components: JSON.parse(JSON.stringify(source.components))
  };

  screens.value.push(cloned);
  handleSwitchScreen(newId);
};

// Rename screen
const handleRenameScreen = (payload: { screenId: string; newName: string }) => {
  const target = screens.value.find(s => s.id === payload.screenId);
  if (target) {
    target.name = payload.newName;
    target.screen.name = payload.newName;
    if (target.id === activeScreenId.value) {
      screen.value.name = payload.newName;
    }
  }
};

// Delete screen
const handleDeleteScreen = (screenId: string) => {
  if (screens.value.length <= 1) {
    alert('至少需要保留一个大屏页面。');
    return;
  }
  if (!confirm('确定要删除该大屏页面及其所有组件吗？')) return;

  screens.value = screens.value.filter(s => s.id !== screenId);
  if (activeScreenId.value === screenId) {
    const nextScreen = screens.value[0];
    activeScreenId.value = nextScreen.id;
    screen.value = JSON.parse(JSON.stringify(nextScreen.screen));
    components.value = JSON.parse(JSON.stringify(nextScreen.components));
    selectedIds.value = [];
  }
  recordHistory();
};

// 2. Undo / Redo History System
const historyStack = ref<HistorySnapshot[]>([]);
const historyIndex = ref<number>(-1);
const isPerformingHistory = ref(false);

const recordHistory = () => {
  if (isPerformingHistory.value) return;
  syncActiveScreenToProject();

  const snapshot: HistorySnapshot = {
    screen: JSON.parse(JSON.stringify(screen.value)),
    components: JSON.parse(JSON.stringify(components.value)),
    datasets: JSON.parse(JSON.stringify(datasets.value)),
    selectedId: selectedIds.value[0] || null
  };

  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  }

  historyStack.value.push(snapshot);
  if (historyStack.value.length > 40) {
    historyStack.value.shift();
  }
  historyIndex.value = historyStack.value.length - 1;
};

const handleUndo = () => {
  if (historyIndex.value > 0) {
    isPerformingHistory.value = true;
    historyIndex.value -= 1;
    const snapshot = historyStack.value[historyIndex.value];
    screen.value = JSON.parse(JSON.stringify(snapshot.screen));
    components.value = JSON.parse(JSON.stringify(snapshot.components));
    datasets.value = JSON.parse(JSON.stringify(snapshot.datasets));
    selectedIds.value = snapshot.selectedId ? [snapshot.selectedId] : [];
    syncActiveScreenToProject();
    setTimeout(() => {
      isPerformingHistory.value = false;
    }, 50);
  }
};

const handleRedo = () => {
  if (historyIndex.value < historyStack.value.length - 1) {
    isPerformingHistory.value = true;
    historyIndex.value += 1;
    const snapshot = historyStack.value[historyIndex.value];
    screen.value = JSON.parse(JSON.stringify(snapshot.screen));
    components.value = JSON.parse(JSON.stringify(snapshot.components));
    datasets.value = JSON.parse(JSON.stringify(snapshot.datasets));
    selectedIds.value = snapshot.selectedId ? [snapshot.selectedId] : [];
    syncActiveScreenToProject();
    setTimeout(() => {
      isPerformingHistory.value = false;
    }, 50);
  }
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1);

// 3. Auto Fit to Screen helper
const fitToScreen = () => {
  const availableWidth = window.innerWidth - 272 - 320 - 60; // Palette width + Inspector width + padding
  const availableHeight = window.innerHeight - 56 - 40 - 60; // Navbar + ScreenBar + padding
  if (availableWidth <= 0 || availableHeight <= 0) return;

  const scaleX = availableWidth / screen.value.width;
  const scaleY = availableHeight / screen.value.height;
  const fitScale = Math.min(scaleX, scaleY);
  zoom.value = Number(Math.max(0.2, Math.min(1.5, fitScale)).toFixed(2));
};

// 4. Component Operations
const handleAddComponentFromPalette = (def: any) => {
  const compWidth = def.width || def.defaultWidth || 160;
  const compHeight = def.height || def.defaultHeight || 160;
  const centerX = Math.max(0, Math.round((screen.value.width - compWidth) / 2));
  const centerY = Math.max(0, Math.round((screen.value.height - compHeight) / 2));
  const maxZ = components.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);

  const newComp: ScreenComponent = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${def.name} #${components.value.length + 1}`,
    type: def.type,
    category: def.category,
    x: centerX,
    y: centerY,
    width: compWidth,
    height: compHeight,
    rotation: 0,
    zIndex: maxZ + 1,
    locked: false,
    visible: true,
    states: def.states ? JSON.parse(JSON.stringify(def.states)) : undefined,
    activeState: def.activeState || (def.states?.[0]?.id ?? '1'),
    children: def.children ? JSON.parse(JSON.stringify(def.children)) : (def.states?.[0]?.children ? JSON.parse(JSON.stringify(def.states[0].children)) : undefined),
    style: JSON.parse(JSON.stringify(def.style || def.defaultStyle || {})),
    animation: def.animation ? JSON.parse(JSON.stringify(def.animation)) : (def.defaultAnimation ? JSON.parse(JSON.stringify(def.defaultAnimation)) : undefined),
    data: JSON.parse(JSON.stringify(def.data || def.defaultData || { mapping: {} })),
    customProps: def.customProps ? JSON.parse(JSON.stringify(def.customProps)) : (def.defaultCustomProps ? JSON.parse(JSON.stringify(def.defaultCustomProps)) : undefined)
  };

  components.value.push(newComp);
  selectedIds.value = [newComp.id];
  recordHistory();
};

const handleAddComponentAt = (def: any, x: number, y: number) => {
  const maxZ = components.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  const compWidth = def.width || def.defaultWidth || 200;
  const compHeight = def.height || def.defaultHeight || 150;

  const newComp: ScreenComponent = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${def.name} #${components.value.length + 1}`,
    type: def.type,
    category: def.category,
    x,
    y,
    width: compWidth,
    height: compHeight,
    rotation: 0,
    zIndex: maxZ + 1,
    locked: false,
    visible: true,
    states: def.states ? JSON.parse(JSON.stringify(def.states)) : undefined,
    activeState: def.activeState || (def.states?.[0]?.id ?? '1'),
    children: def.children ? JSON.parse(JSON.stringify(def.children)) : (def.states?.[0]?.children ? JSON.parse(JSON.stringify(def.states[0].children)) : undefined),
    style: JSON.parse(JSON.stringify(def.style || def.defaultStyle || {})),
    animation: def.animation ? JSON.parse(JSON.stringify(def.animation)) : (def.defaultAnimation ? JSON.parse(JSON.stringify(def.defaultAnimation)) : undefined),
    data: JSON.parse(JSON.stringify(def.data || def.defaultData || { mapping: {} })),
    customProps: def.customProps ? JSON.parse(JSON.stringify(def.customProps)) : (def.defaultCustomProps ? JSON.parse(JSON.stringify(def.defaultCustomProps)) : undefined)
  };

  components.value.push(newComp);
  selectedIds.value = [newComp.id];
  recordHistory();
};

const handleAddCustomSymbolToCanvas = (sym: CustomSymbolDef) => {
  const centerX = Math.max(0, Math.round((screen.value.width - sym.defaultWidth) / 2));
  const centerY = Math.max(0, Math.round((screen.value.height - sym.defaultHeight) / 2));
  const maxZ = components.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);

  const newComp: ScreenComponent = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${sym.name}`,
    type: sym.type,
    category: sym.category,
    x: centerX,
    y: centerY,
    width: sym.defaultWidth,
    height: sym.defaultHeight,
    rotation: 0,
    zIndex: maxZ + 1,
    locked: false,
    visible: true,
    states: sym.states ? JSON.parse(JSON.stringify(sym.states)) : undefined,
    activeState: sym.activeState || (sym.states?.[0]?.id ?? '1'),
    children: sym.children ? JSON.parse(JSON.stringify(sym.children)) : undefined,
    style: JSON.parse(JSON.stringify(sym.defaultStyle || {})),
    data: JSON.parse(JSON.stringify(sym.defaultData || { mapping: {} })),
    customProps: sym.defaultCustomProps ? JSON.parse(JSON.stringify(sym.defaultCustomProps)) : undefined
  };

  components.value.push(newComp);
  selectedIds.value = [newComp.id];
  recordHistory();
};

const handleUpdateComponent = (comp: ScreenComponent) => {
  const idx = components.value.findIndex(c => c.id === comp.id);
  if (idx !== -1) {
    components.value[idx] = comp;
    recordHistory();
  }
};

const handleUpdateComponents = (updatedComps: ScreenComponent[]) => {
  const map = new Map(updatedComps.map(c => [c.id, c]));
  components.value = components.value.map(c => map.has(c.id) ? map.get(c.id)! : c);
  recordHistory();
};

// Component Clipboard Buffer
const clipboard = ref<ScreenComponent[]>([]);

const handleCopy = (target?: ScreenComponent | ScreenComponent[]) => {
  const items = target 
    ? (Array.isArray(target) ? target : [target]) 
    : selectedComponents.value;
  if (!items || items.length === 0) return;
  clipboard.value = JSON.parse(JSON.stringify(items));
};

const handleCut = (target?: ScreenComponent | ScreenComponent[]) => {
  const items = target 
    ? (Array.isArray(target) ? target : [target]) 
    : selectedComponents.value;
  if (!items || items.length === 0) return;
  handleCopy(items);
  handleDelete(items.map(c => c.id));
};

const handlePaste = (pos?: { x: number; y: number }) => {
  if (!clipboard.value || clipboard.value.length === 0) return;
  
  const maxZ = components.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  
  let minX = Infinity;
  let minY = Infinity;
  clipboard.value.forEach(c => {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
  });

  const pasted: ScreenComponent[] = clipboard.value.map((comp, idx) => {
    const targetX = pos ? Math.max(0, pos.x + (comp.x - minX)) : (comp.x + 24);
    const targetY = pos ? Math.max(0, pos.y + (comp.y - minY)) : (comp.y + 24);
    return {
      ...JSON.parse(JSON.stringify(comp)),
      id: `comp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${comp.name} (副本)`,
      x: targetX,
      y: targetY,
      zIndex: maxZ + idx + 1
    };
  });

  components.value.push(...pasted);
  selectedIds.value = pasted.map(p => p.id);
  // Cascade next paste
  clipboard.value = pasted.map(p => ({ ...p, x: p.x + 20, y: p.y + 20 }));
  recordHistory();
};

const handleDuplicate = (target: ScreenComponent | ScreenComponent[]) => {
  const items = Array.isArray(target) ? target : [target];
  if (!items || items.length === 0) return;

  const maxZ = components.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  const duplicates: ScreenComponent[] = items.map((comp, idx) => ({
    ...JSON.parse(JSON.stringify(comp)),
    id: `comp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${comp.name} (副本)`,
    x: comp.x + 24,
    y: comp.y + 24,
    zIndex: maxZ + idx + 1
  }));

  components.value.push(...duplicates);
  selectedIds.value = duplicates.map(d => d.id);
  recordHistory();
};

const handleDelete = (target: string | string[]) => {
  const idsToDelete = Array.isArray(target) ? target : [target];
  const set = new Set(idsToDelete);
  components.value = components.value.filter(c => !set.has(c.id));
  selectedIds.value = selectedIds.value.filter(i => !set.has(i));
  recordHistory();
};

const handleDeleteBatch = (ids: string[]) => {
  handleDelete(ids);
};

const handleUngroup = (comp: ScreenComponent) => {
  if (!comp.children || comp.children.length === 0) return;
  const maxZ = components.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  
  const unbundled: ScreenComponent[] = comp.children.map((child, index) => {
    return {
      ...JSON.parse(JSON.stringify(child)),
      id: `comp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      x: comp.x + child.x,
      y: comp.y + child.y,
      zIndex: maxZ + index + 1
    };
  });

  components.value = components.value.filter(c => c.id !== comp.id);
  components.value.push(...unbundled);
  selectedIds.value = unbundled.map(u => u.id);
  recordHistory();
};

const handleClearCanvas = () => {
  if (window.confirm('确定要清空当前大屏中的所有组件吗？')) {
    components.value = [];
    selectedIds.value = [];
    recordHistory();
  }
};

// Z-index layer order (Normalized Stack Sequencing)
const handleBringToFront = (ids: string | string[]) => {
  const targetIds = Array.isArray(ids) ? ids : [ids];
  if (targetIds.length === 0) return;

  const currentStack = [...components.value].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
  const nonTargets = currentStack.filter(c => !targetIds.includes(c.id));
  const targets = currentStack.filter(c => targetIds.includes(c.id));

  const newStack = [...nonTargets, ...targets];
  newStack.forEach((c, idx) => {
    c.zIndex = idx + 1;
  });
  components.value = newStack;
  recordHistory();
};

const handleSendToBack = (ids: string | string[]) => {
  const targetIds = Array.isArray(ids) ? ids : [ids];
  if (targetIds.length === 0) return;

  const currentStack = [...components.value].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
  const nonTargets = currentStack.filter(c => !targetIds.includes(c.id));
  const targets = currentStack.filter(c => targetIds.includes(c.id));

  const newStack = [...targets, ...nonTargets];
  newStack.forEach((c, idx) => {
    c.zIndex = idx + 1;
  });
  components.value = newStack;
  recordHistory();
};

const handleMoveUp = (ids: string | string[]) => {
  const targetIds = Array.isArray(ids) ? ids : [ids];
  if (targetIds.length === 0) return;

  const currentStack = [...components.value].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
  for (let i = currentStack.length - 2; i >= 0; i--) {
    if (targetIds.includes(currentStack[i].id) && !targetIds.includes(currentStack[i + 1].id)) {
      const temp = currentStack[i];
      currentStack[i] = currentStack[i + 1];
      currentStack[i + 1] = temp;
    }
  }

  currentStack.forEach((c, idx) => {
    c.zIndex = idx + 1;
  });
  components.value = currentStack;
  recordHistory();
};

const handleMoveDown = (ids: string | string[]) => {
  const targetIds = Array.isArray(ids) ? ids : [ids];
  if (targetIds.length === 0) return;

  const currentStack = [...components.value].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
  for (let i = 1; i < currentStack.length; i++) {
    if (targetIds.includes(currentStack[i].id) && !targetIds.includes(currentStack[i - 1].id)) {
      const temp = currentStack[i];
      currentStack[i] = currentStack[i - 1];
      currentStack[i - 1] = temp;
    }
  }

  currentStack.forEach((c, idx) => {
    c.zIndex = idx + 1;
  });
  components.value = currentStack;
  recordHistory();
};

// Alignment tools (Supports single, multi-selection, and even distribution)
const handleAlignComponent = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v') => {
  const targets = components.value.filter(c => selectedIds.value.includes(c.id) && !c.locked);
  if (targets.length === 0) return;

  if (targets.length === 1 && !type.startsWith('distribute')) {
    const target = targets[0];
    if (type === 'left') target.x = 0;
    if (type === 'center') target.x = Math.round((screen.value.width - target.width) / 2);
    if (type === 'right') target.x = Math.round(screen.value.width - target.width);
    if (type === 'top') target.y = 0;
    if (type === 'middle') target.y = Math.round((screen.value.height - target.height) / 2);
    if (type === 'bottom') target.y = Math.round(screen.value.height - target.height);
  } else if (targets.length >= 2) {
    if (type === 'distribute-h') {
      if (targets.length >= 3) {
        const sorted = [...targets].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpan = (last.x + last.width) - first.x;
        const totalElemWidths = sorted.reduce((sum, c) => sum + c.width, 0);
        const availableGap = totalSpan - totalElemWidths;
        const gap = availableGap / (sorted.length - 1);
        
        let currX = first.x + first.width + gap;
        for (let i = 1; i < sorted.length - 1; i++) {
          sorted[i].x = Math.round(currX);
          currX += sorted[i].width + gap;
        }
      }
    } else if (type === 'distribute-v') {
      if (targets.length >= 3) {
        const sorted = [...targets].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpan = (last.y + last.height) - first.y;
        const totalElemHeights = sorted.reduce((sum, c) => sum + c.height, 0);
        const availableGap = totalSpan - totalElemHeights;
        const gap = availableGap / (sorted.length - 1);

        let currY = first.y + first.height + gap;
        for (let i = 1; i < sorted.length - 1; i++) {
          sorted[i].y = Math.round(currY);
          currY += sorted[i].height + gap;
        }
      }
    } else {
      // Multi-selection alignment
      const minX = Math.min(...targets.map(c => c.x));
      const maxX = Math.max(...targets.map(c => c.x + c.width));
      const minY = Math.min(...targets.map(c => c.y));
      const maxY = Math.max(...targets.map(c => c.y + c.height));
      const midX = minX + (maxX - minX) / 2;
      const midY = minY + (maxY - minY) / 2;

      targets.forEach(c => {
        if (type === 'left') c.x = minX;
        if (type === 'center') c.x = Math.round(midX - c.width / 2);
        if (type === 'right') c.x = Math.round(maxX - c.width);
        if (type === 'top') c.y = minY;
        if (type === 'middle') c.y = Math.round(midY - c.height / 2);
        if (type === 'bottom') c.y = Math.round(maxY - c.height);
      });
    }
  }

  recordHistory();
};

// Save as Custom Symbol Flow
const handleOpenSaveSymbolModal = (comps: ScreenComponent[]) => {
  if (comps.length === 0) return;
  componentsToSave.value = comps;
  showSaveSymbolModal.value = true;
};

// Import Project JSON
const handleImportProject = (data: any) => {
  if (Array.isArray(data.screens) && data.screens.length > 0) {
    screens.value = JSON.parse(JSON.stringify(data.screens));
    const targetId = data.activeScreenId || data.screens[0].id;
    activeScreenId.value = targetId;
    const active = screens.value.find(s => s.id === targetId) || screens.value[0];
    screen.value = JSON.parse(JSON.stringify(active.screen));
    components.value = JSON.parse(JSON.stringify(active.components));
  } else if (data.screen && Array.isArray(data.components)) {
    screen.value = JSON.parse(JSON.stringify(data.screen));
    components.value = JSON.parse(JSON.stringify(data.components));
    screens.value = [
      {
        id: data.screen.id || `screen-${Date.now()}`,
        name: data.screen.name || '导入的大屏工程',
        screen: JSON.parse(JSON.stringify(data.screen)),
        components: JSON.parse(JSON.stringify(data.components))
      }
    ];
    activeScreenId.value = screens.value[0].id;
  }

  if (Array.isArray(data.datasets) && data.datasets.length > 0) {
    datasets.value = JSON.parse(JSON.stringify(data.datasets));
  }

  selectedIds.value = [];
  fitToScreen();
  recordHistory();
};

// Selected Components reactive computed
const selectedComponents = computed(() => {
  return components.value.filter(c => selectedIds.value.includes(c.id));
});

const selectedComponent = computed(() => {
  return selectedComponents.value.length === 1 ? selectedComponents.value[0] : null;
});

// Dynamic Dataset Simulation Loop & Jump Screen Event Listener
let simulationTimer: any = null;

const handleGlobalJumpEvent = (e: any) => {
  if (e.detail) {
    handleSwitchScreen(e.detail);
  }
};

onMounted(() => {
  recordHistory();
  fitToScreen();

  simulationTimer = setInterval(() => {
    if (isStreaming.value) {
      datasets.value = datasets.value.map(ds => tickDataset(ds));
    }
  }, 1500);

  window.addEventListener('resize', fitToScreen);
  window.addEventListener('datav:jump:screen', handleGlobalJumpEvent);
});

onBeforeUnmount(() => {
  if (simulationTimer) clearInterval(simulationTimer);
  window.removeEventListener('resize', fitToScreen);
  window.removeEventListener('datav:jump:screen', handleGlobalJumpEvent);
});
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#040810] text-slate-200 overflow-hidden font-sans select-none">
    <!-- Top Navigation & Global Controls -->
    <Navbar
      :screen="screen"
      :zoom="zoom"
      :isStreaming="isStreaming"
      :canUndo="canUndo"
      :canRedo="canRedo"
      :drawTool="drawTool"
      @update:screen="screen = $event; recordHistory();"
      @update:zoom="zoom = $event"
      @update:drawTool="drawTool = $event"
      @toggle:streaming="isStreaming = !isStreaming"
      @open:preview="showPreviewModal = true"
      @open:datasets="showDatasetsModal = true"
      @open:json="showJsonModal = true"
      @open:symbols="showSymbolModal = true"
      @open:platform="showPlatformModal = true"
      @load:template="handleSwitchScreen"
      @clear:canvas="handleClearCanvas"
      @fit:screen="fitToScreen"
      @undo="handleUndo"
      @redo="handleRedo"
    />

    <!-- Main Workspace Studio -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left Sidebar Navigation Tabs (Palette vs Layers) -->
      <div class="w-12 bg-[#050914] border-r border-slate-800/80 flex flex-col items-center py-2.5 gap-2 z-30">
        <button
          @click="leftSidebarTab = 'palette'"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          :class="leftSidebarTab === 'palette' 
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,242,255,0.3)]' 
            : 'text-slate-400 hover:text-white hover:bg-slate-900'"
          title="组件物料库 (含电力一次图元)"
        >
          <Box class="w-4 h-4" />
        </button>

        <button
          @click="leftSidebarTab = 'layers'"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative"
          :class="leftSidebarTab === 'layers' 
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,242,255,0.3)]' 
            : 'text-slate-400 hover:text-white hover:bg-slate-900'"
          title="图层层级列表"
        >
          <Layers class="w-4 h-4" />
          <span 
            v-if="components.length > 0" 
            class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 text-[8px] font-mono font-bold flex items-center justify-center"
          >
            {{ components.length }}
          </span>
        </button>
      </div>

      <!-- Left Tab Pane Content -->
      <ComponentPalette
        v-if="leftSidebarTab === 'palette'"
        @add:component="handleAddComponentFromPalette"
        @open:symbol-modal="showSymbolModal = true"
      />
      <LayerManager
        v-else
        :components="components"
        :selectedIds="selectedIds"
        @select="selectedIds = $event"
        @update:component="handleUpdateComponent"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
        @bring:front="handleBringToFront"
        @send:back="handleSendToBack"
        @move:up="handleMoveUp"
        @move:down="handleMoveDown"
      />

      <!-- Center Workspace (Canvas + Bottom Screen Manager Bar) -->
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <CanvasEditor
          :screen="screen"
          :components="components"
          :selectedIds="selectedIds"
          :zoom="zoom"
          :datasets="datasets"
          :drawTool="drawTool"
          :canPaste="clipboard.length > 0"
          @update:drawTool="drawTool = $event"
          @select="selectedIds = $event"
          @update:component="handleUpdateComponent"
          @update:components="handleUpdateComponents"
          @add:component:at="handleAddComponentAt"
          @copy="handleCopy"
          @cut="handleCut"
          @paste="handlePaste"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
          @bring:front="handleBringToFront"
          @send:back="handleSendToBack"
          @move:up="handleMoveUp"
          @move:down="handleMoveDown"
          @align="handleAlignComponent"
          @ungroup="handleUngroup"
          @save:symbol="handleOpenSaveSymbolModal"
        />

        <!-- Bottom Multi-Screen Page Manager Bar -->
        <ScreenManagerBar
          :screens="screens"
          :activeScreenId="activeScreenId"
          @switch:screen="handleSwitchScreen"
          @add:screen="handleAddScreen"
          @duplicate:screen="handleDuplicateScreen"
          @rename:screen="handleRenameScreen"
          @delete:screen="handleDeleteScreen"
        />
      </div>

      <!-- Right Property & Data Inspector Panel -->
      <PropertyInspector
        :component="selectedComponent"
        :selectedComponents="selectedComponents"
        :screen="screen"
        :datasets="datasets"
        :screens="screens"
        @update:component="handleUpdateComponent"
        @update:components="handleUpdateComponents"
        @update:screen="screen = $event; recordHistory();"
        @align:component="handleAlignComponent"
        @save:symbol="handleOpenSaveSymbolModal"
        @delete="handleDeleteBatch"
      />
    </div>

    <!-- 1. Datasets Management Modal -->
    <DatasetManagerModal
      :visible="showDatasetsModal"
      :datasets="datasets"
      @close="showDatasetsModal = false"
      @update:datasets="datasets = $event; recordHistory();"
    />

    <!-- 2. JSON Schema Export & Import Modal -->
    <JsonExportImportModal
      :visible="showJsonModal"
      :screen="screen"
      :components="components"
      :datasets="datasets"
      :screens="screens"
      :activeScreenId="activeScreenId"
      @close="showJsonModal = false"
      @import:project="handleImportProject"
    />

    <!-- 3. Reusable Custom Symbol Library & Studio Modal -->
    <CustomSymbolModal
      :visible="showSymbolModal"
      :selectedComponent="selectedComponent"
      @close="showSymbolModal = false"
      @use:symbol="handleAddCustomSymbolToCanvas"
    />

    <!-- 4. Save Selection as Multi-State Custom Symbol Modal -->
    <SaveSymbolModal
      :visible="showSaveSymbolModal"
      :selectedComponents="componentsToSave"
      @close="showSaveSymbolModal = false"
      @saved="handleAddCustomSymbolToCanvas"
    />

    <!-- 5. Fullscreen Big Screen Presentation Preview -->
    <PreviewScreen
      v-if="showPreviewModal"
      :screen="screen"
      :components="components"
      :datasets="datasets"
      :isStreaming="isStreaming"
      :screens="screens"
      :activeScreenId="activeScreenId"
      @close="showPreviewModal = false"
      @toggle:streaming="isStreaming = !isStreaming"
      @switch:screen="handleSwitchScreen"
    />

    <!-- 6. Multi-Platform Compatibility & Packaging Studio Modal -->
    <DesktopPlatformModal
      :visible="showPlatformModal"
      @close="showPlatformModal = false"
    />
  </div>
</template>
