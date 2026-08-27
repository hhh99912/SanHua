<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  Box, Plus, Trash2, Edit3, Copy, Download, Upload, X, Search, Sparkles,
  Check, ChevronDown, Layers, Move, ZoomIn, ZoomOut, Maximize2, Grid, Magnet,
  ArrowRight, ShieldCheck, Zap, Cpu, BookmarkPlus, Sliders, Type, Circle,
  Square, Minus, MousePointer, RotateCw, AlignLeft, AlignCenter, AlignRight,
  MoveRight, RefreshCw, AlertCircle, Eye, HelpCircle
} from 'lucide-vue-next';
import { CustomSymbolDef, ScreenComponent, SymbolState } from '../types';
import {
  getCustomSymbols,
  saveCustomSymbols,
  addCustomSymbol,
  updateCustomSymbol,
  deleteCustomSymbol,
  exportSymbolsAsJSON,
  importSymbolsFromJSON
} from '../utils/customSymbolStorage';
import WidgetRenderer from './widgets/WidgetRenderer.vue';

interface Props {
  visible: boolean;
  initialSymbol?: CustomSymbolDef | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'use:symbol', symbol: CustomSymbolDef): void;
  (e: 'update:symbols', symbols: CustomSymbolDef[]): void;
}>();

// Workshop Mode: 'gallery' (资产库) | 'editor' (无限画布设计器)
const currentMode = ref<'gallery' | 'editor'>('gallery');

// 1. Gallery State
const symbols = ref<CustomSymbolDef[]>([]);
const activeCategory = ref<string>('all');
const searchQuery = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const previewActiveStates = ref<Record<string, string>>({});
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error'>('success');

const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
  notificationMessage.value = msg;
  notificationType.value = type;
  setTimeout(() => {
    notificationMessage.value = '';
  }, 3000);
};

// 2. Editor State
const editingSymbolId = ref<string | null>(null);
const editorSymbolName = ref('新建自定义图元');
const editorSymbolCategory = ref<'electrical' | 'industrial' | 'custom'>('electrical');
const editorSymbolDesc = ref('');
const editorSymbolTags = ref('断路器, 电力图元');
const editorStates = ref<SymbolState[]>([]);
const activeStateId = ref<string>('1');

// Canvas transform & settings
const canvasZoom = ref(1.0);
const canvasPan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const showEditorGrid = ref(true);
const editorGridSize = ref(20);
const snapToEditorGrid = ref(true);
const activeTool = ref<'select' | 'draw-rect' | 'draw-circle' | 'draw-line' | 'draw-arrow' | 'draw-polyline' | 'draw-text' | 'ctrl-indicator'>('select');

// Selection & Dragging on workshop canvas
const selectedCompIds = ref<string[]>([]);
const isDraggingComps = ref(false);
const dragStartMouse = ref({ x: 0, y: 0 });
const dragInitialPositions = ref<Record<string, { x: number; y: number }>>({});
const isResizingComp = ref(false);
const resizeHandle = ref<string>('');
const resizeInitialBounds = ref<{ x: number; y: number; width: number; height: number } | null>(null);

// Interactive Polyline / Arrow Drawing on Canvas
const isDrawingPolyline = ref(false);
const polylinePoints = ref<Array<{ x: number; y: number }>>([]);
const polylineCurrentMouse = ref<{ x: number; y: number }>({ x: 0, y: 0 });

// Smart Generator Wizard State
const isWizardOpen = ref(false);
const wizardTemplate = ref<'handcart-breaker' | 'three-winding-transformer' | 'isolator-switch'>('handcart-breaker');
const wizardConfig = ref({
  name: '10kV 手车断路器',
  voltageLevel: '10kV',
  colorTheme: '#00f2ff'
});

const loadSymbols = () => {
  symbols.value = getCustomSymbols();
};

onMounted(() => {
  loadSymbols();
});

watch(() => props.visible, (val) => {
  if (val) {
    loadSymbols();
    if (props.initialSymbol) {
      openEditorWithSymbol(props.initialSymbol);
    } else {
      currentMode.value = 'gallery';
    }
  }
});

// Filtered symbols in gallery
const filteredSymbols = computed(() => {
  return symbols.value.filter(s => {
    const matchCategory = activeCategory.value === 'all' || s.category === activeCategory.value;
    const matchSearch = !searchQuery.value.trim() ||
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
    return matchCategory && matchSearch;
  });
});

// Current active state's components
const currentEditingComponents = computed<ScreenComponent[]>({
  get() {
    const st = editorStates.value.find(s => s.id === activeStateId.value);
    return st ? st.children : [];
  },
  set(newChildren: ScreenComponent[]) {
    const st = editorStates.value.find(s => s.id === activeStateId.value);
    if (st) {
      st.children = newChildren;
    }
  }
});

// Single selected component for inspector
const selectedComponent = computed(() => {
  if (selectedCompIds.value.length === 0) return null;
  return currentEditingComponents.value.find(c => c.id === selectedCompIds.value[0]) || null;
});

// Real-time Bounding Box of all components on workshop canvas
const currentBoundingBox = computed(() => {
  const comps = currentEditingComponents.value;
  if (!comps || comps.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  comps.forEach(c => {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  });

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(20, Math.round(maxX - minX)),
    height: Math.max(20, Math.round(maxY - minY))
  };
});

// Helper to open editor with a symbol
const openEditorWithSymbol = (sym: CustomSymbolDef) => {
  editingSymbolId.value = sym.id;
  editorSymbolName.value = sym.name;
  editorSymbolCategory.value = (sym.category as any) || 'electrical';
  editorSymbolDesc.value = sym.description || '';
  editorSymbolTags.value = sym.tags?.join(', ') || '电力图元';

  // Deep clone states or build states from children
  if (sym.states && sym.states.length > 0) {
    editorStates.value = JSON.parse(JSON.stringify(sym.states));
    activeStateId.value = sym.states[0].id;
  } else {
    editorStates.value = [
      {
        id: '1',
        name: '默认工作状态',
        matchValue: '1',
        children: JSON.parse(JSON.stringify(sym.children || []))
      }
    ];
    activeStateId.value = '1';
  }

  selectedCompIds.value = [];
  canvasZoom.value = 1.0;
  canvasPan.value = { x: 120, y: 80 };
  currentMode.value = 'editor';
};

// Open editor for a brand new blank symbol
const handleCreateNewBlankSymbol = () => {
  editingSymbolId.value = `custom-sym-${Date.now()}`;
  editorSymbolName.value = `自定义图元 #${symbols.value.length + 1}`;
  editorSymbolCategory.value = 'electrical';
  editorSymbolDesc.value = '由基础图元在工坊画布中自由构建组合';
  editorSymbolTags.value = '自定义, 基础图元';

  // Create initial default states
  editorStates.value = [
    {
      id: '1',
      name: '合闸 (带电运行)',
      matchValue: '1',
      children: [
        {
          id: `prim-${Date.now()}-1`,
          name: '灭弧室主体',
          type: 'draw-rect',
          category: 'basic',
          x: 40,
          y: 40,
          width: 50,
          height: 60,
          rotation: 0,
          zIndex: 1,
          style: { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444', strokeWidth: 2, borderRadius: 4 },
          data: { mapping: {} }
        },
        {
          id: `prim-${Date.now()}-2`,
          name: '主触头合闸线',
          type: 'draw-line',
          category: 'basic',
          x: 65,
          y: 20,
          width: 2,
          height: 100,
          rotation: 0,
          zIndex: 2,
          style: { stroke: '#ef4444', strokeWidth: 3 },
          data: { mapping: {} },
          customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 0, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 0, y: 100 }] }
        }
      ]
    },
    {
      id: '0',
      name: '分闸 (断开隔离)',
      matchValue: '0',
      children: [
        {
          id: `prim-${Date.now()}-3`,
          name: '灭弧室主体',
          type: 'draw-rect',
          category: 'basic',
          x: 40,
          y: 40,
          width: 50,
          height: 60,
          rotation: 0,
          zIndex: 1,
          style: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981', strokeWidth: 2, borderRadius: 4 },
          data: { mapping: {} }
        },
        {
          id: `prim-${Date.now()}-4`,
          name: '分闸断开触刀',
          type: 'draw-polyline',
          category: 'basic',
          x: 45,
          y: 25,
          width: 40,
          height: 90,
          rotation: 0,
          zIndex: 2,
          style: { stroke: '#10b981', strokeWidth: 3 },
          data: { mapping: {} },
          customProps: {
            points: [
              { x: 20, y: 0, xRatio: 0.5, yRatio: 0 },
              { x: 5, y: 45, xRatio: 0.1, yRatio: 0.5 },
              { x: 20, y: 90, xRatio: 0.5, yRatio: 1 }
            ]
          }
        }
      ]
    }
  ];
  activeStateId.value = '1';
  selectedCompIds.value = [];
  canvasZoom.value = 1.0;
  canvasPan.value = { x: 120, y: 80 };
  currentMode.value = 'editor';
};

// Add basic primitive to canvas
const handleAddPrimitive = (type: string) => {
  const currentList = [...currentEditingComponents.value];
  const maxZ = currentList.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  const id = `prim-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  // Default coordinate centered in view
  const targetX = Math.round((-canvasPan.value.x + 300) / (snapToEditorGrid.value ? editorGridSize.value : 1)) * (snapToEditorGrid.value ? editorGridSize.value : 1);
  const targetY = Math.round((-canvasPan.value.y + 200) / (snapToEditorGrid.value ? editorGridSize.value : 1)) * (snapToEditorGrid.value ? editorGridSize.value : 1);

  let newComp: ScreenComponent;

  if (type === 'draw-rect') {
    newComp = {
      id,
      name: `矩形 #${currentList.length + 1}`,
      type: 'draw-rect',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 60,
      height: 40,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { fill: 'rgba(0, 242, 255, 0.15)', stroke: '#00f2ff', strokeWidth: 2, borderRadius: 2 },
      data: { mapping: {} }
    };
  } else if (type === 'draw-circle') {
    newComp = {
      id,
      name: `圆形触头 #${currentList.length + 1}`,
      type: 'draw-circle',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 30,
      height: 30,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { fill: 'rgba(0, 242, 255, 0.25)', stroke: '#00f2ff', strokeWidth: 2 },
      data: { mapping: {} }
    };
  } else if (type === 'draw-line') {
    newComp = {
      id,
      name: `导线/管道 #${currentList.length + 1}`,
      type: 'draw-line',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 80,
      height: 4,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { stroke: '#00f2ff', strokeWidth: 3 },
      data: { mapping: {} },
      customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 2 }, { xRatio: 1, yRatio: 0.5, x: 80, y: 2 }] }
    };
  } else if (type === 'draw-arrow') {
    newComp = {
      id,
      name: `潮流指示箭头 #${currentList.length + 1}`,
      type: 'draw-arrow',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 60,
      height: 24,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { fill: '#00f2ff', stroke: '#00f2ff', strokeWidth: 2 },
      data: { mapping: {} },
      customProps: { arrowType: 'forward', arrowSize: 10 }
    };
  } else if (type === 'draw-text') {
    newComp = {
      id,
      name: `文字标签 #${currentList.length + 1}`,
      type: 'draw-text',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 60,
      height: 24,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { fill: 'transparent', fontSize: 13, textColor: '#00f2ff', fontWeight: 'bold' },
      data: { mapping: {} }
    };
  } else if (type === 'ctrl-indicator') {
    newComp = {
      id,
      name: `状态指示灯 #${currentList.length + 1}`,
      type: 'ctrl-indicator',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 24,
      height: 24,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2, glow: true },
      data: { mapping: {} }
    };
  } else {
    // Fallback rect
    newComp = {
      id,
      name: `图元组件 #${currentList.length + 1}`,
      type: 'draw-rect',
      category: 'basic',
      x: targetX,
      y: targetY,
      width: 40,
      height: 40,
      rotation: 0,
      zIndex: maxZ + 1,
      style: { fill: 'rgba(0, 242, 255, 0.2)', stroke: '#00f2ff', strokeWidth: 2 },
      data: { mapping: {} }
    };
  }

  currentEditingComponents.value = [...currentList, newComp];
  selectedCompIds.value = [newComp.id];
  showNotice(`已添加基础图元: ${newComp.name}`);
};

// Auto Crop & Tight Encapsulation
const handleAutoCropSymbol = () => {
  const comps = currentEditingComponents.value;
  if (!comps || comps.length === 0) {
    showNotice('当前画布无图元，无法截取', 'error');
    return;
  }

  const padding = 10; // Clean 10px margin around bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  comps.forEach(c => {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  });

  const shiftX = minX - padding;
  const shiftY = minY - padding;

  // Apply coordinate shift to all states so states stay aligned!
  editorStates.value.forEach(st => {
    st.children = st.children.map(c => ({
      ...c,
      x: Math.max(0, Math.round(c.x - shiftX)),
      y: Math.max(0, Math.round(c.y - shiftY))
    }));
  });

  const finalW = Math.max(20, Math.round(maxX - minX + padding * 2));
  const finalH = Math.max(20, Math.round(maxY - minY + padding * 2));

  showNotice(`已自动截取并对齐！封装尺寸: ${finalW} × ${finalH} px`);
};

// Save Symbol and Store
const handleSaveSymbol = (andPlaceToCanvas = false) => {
  const trimmedName = editorSymbolName.value.trim();
  if (!trimmedName) {
    showNotice('请输入图元名称', 'error');
    return;
  }

  if (editorStates.value.length === 0 || editorStates.value.every(s => s.children.length === 0)) {
    showNotice('图元内无基础图元组件，请先绘制图元！', 'error');
    return;
  }

  // 1. Auto crop first
  handleAutoCropSymbol();

  // Calculate default width & height from first state
  const firstStateChildren = editorStates.value[0]?.children || [];
  let maxW = 80;
  let maxH = 80;
  if (firstStateChildren.length > 0) {
    maxW = Math.max(...firstStateChildren.map(c => c.x + c.width)) + 10;
    maxH = Math.max(...firstStateChildren.map(c => c.y + c.height)) + 10;
  }

  const tagsArr = editorSymbolTags.value.split(/[,，]/).map(t => t.trim()).filter(Boolean);

  const symDef: CustomSymbolDef = {
    id: editingSymbolId.value || `custom-sym-${Date.now()}`,
    name: trimmedName,
    category: editorSymbolCategory.value,
    iconName: editorSymbolCategory.value === 'electrical' ? 'Zap' : (editorSymbolCategory.value === 'industrial' ? 'Cpu' : 'Box'),
    description: editorSymbolDesc.value.trim() || '工坊自定义封装图元',
    tags: tagsArr.length > 0 ? tagsArr : ['自定义图元'],
    defaultWidth: maxW,
    defaultHeight: maxH,
    type: 'composite-symbol',
    defaultStyle: {
      fill: 'transparent',
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 4
    },
    states: JSON.parse(JSON.stringify(editorStates.value)),
    children: JSON.parse(JSON.stringify(editorStates.value[0]?.children || []))
  };

  const existingIndex = symbols.value.findIndex(s => s.id === symDef.id);
  if (existingIndex >= 0) {
    updateCustomSymbol(symDef);
  } else {
    addCustomSymbol(symDef);
  }

  loadSymbols();
  emit('update:symbols', symbols.value);
  showNotice(`图元「${symDef.name}」已成功保存并入库！`);

  if (andPlaceToCanvas) {
    emit('use:symbol', symDef);
    emit('close');
  } else {
    currentMode.value = 'gallery';
  }
};

// Multi-state Management
const handleAddState = () => {
  const newId = String(Date.now());
  const currentList = currentEditingComponents.value;
  const newState: SymbolState = {
    id: newId,
    name: `状态 ${editorStates.value.length + 1}`,
    matchValue: String(editorStates.value.length),
    children: JSON.parse(JSON.stringify(currentList)) // clone current for quick editing
  };
  editorStates.value.push(newState);
  activeStateId.value = newId;
  showNotice(`已添加新状态: ${newState.name}`);
};

const handleDuplicateState = () => {
  const current = editorStates.value.find(s => s.id === activeStateId.value);
  if (!current) return;
  const newId = String(Date.now());
  const cloned: SymbolState = {
    id: newId,
    name: `${current.name} (副本)`,
    matchValue: `${current.matchValue}_copy`,
    children: JSON.parse(JSON.stringify(current.children))
  };
  editorStates.value.push(cloned);
  activeStateId.value = newId;
  showNotice(`已复制状态: ${cloned.name}`);
};

const handleDeleteState = (id: string) => {
  if (editorStates.value.length <= 1) {
    showNotice('至少需要保留一个图元状态', 'error');
    return;
  }
  editorStates.value = editorStates.value.filter(s => s.id !== id);
  if (activeStateId.value === id) {
    activeStateId.value = editorStates.value[0].id;
  }
  showNotice('已删除状态');
};

// Canvas Mouse Interactions (Pan, Zoom, Drag components)
const handleCanvasWheel = (e: WheelEvent) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = Math.min(3.0, Math.max(0.3, canvasZoom.value * zoomFactor));
  canvasZoom.value = Number(newZoom.toFixed(2));
};

const handleCanvasMouseDown = (e: MouseEvent) => {
  // Polyline drawing mode
  if (activeTool.value === 'draw-polyline' || activeTool.value === 'draw-arrow') {
    handleCanvasClickDraw(e);
    return;
  }

  // Middle mouse click or Space key panning
  if (e.button === 1 || e.altKey || (e.target as HTMLElement).id === 'workshop-canvas-bg') {
    isPanning.value = true;
    panStart.value = { x: e.clientX - canvasPan.value.x, y: e.clientY - canvasPan.value.y };
    if ((e.target as HTMLElement).id === 'workshop-canvas-bg') {
      selectedCompIds.value = [];
    }
  }
};

const handleCanvasMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    canvasPan.value = {
      x: e.clientX - panStart.value.x,
      y: e.clientY - panStart.value.y
    };
  } else if (isDraggingComps.value) {
    const dx = (e.clientX - dragStartMouse.value.x) / canvasZoom.value;
    const dy = (e.clientY - dragStartMouse.value.y) / canvasZoom.value;

    currentEditingComponents.value = currentEditingComponents.value.map(c => {
      if (selectedCompIds.value.includes(c.id) && dragInitialPositions.value[c.id]) {
        let newX = dragInitialPositions.value[c.id].x + dx;
        let newY = dragInitialPositions.value[c.id].y + dy;

        if (snapToEditorGrid.value) {
          newX = Math.round(newX / editorGridSize.value) * editorGridSize.value;
          newY = Math.round(newY / editorGridSize.value) * editorGridSize.value;
        }

        return {
          ...c,
          x: Math.round(newX),
          y: Math.round(newY)
        };
      }
      return c;
    });
  } else if (isDrawingPolyline.value) {
    const canvasRect = (document.getElementById('workshop-canvas-inner') as HTMLElement)?.getBoundingClientRect();
    if (canvasRect) {
      polylineCurrentMouse.value = {
        x: Math.round((e.clientX - canvasRect.left) / canvasZoom.value),
        y: Math.round((e.clientY - canvasRect.top) / canvasZoom.value)
      };
    }
  }
};

const handleCanvasMouseUp = () => {
  isPanning.value = false;
  isDraggingComps.value = false;
  isResizingComp.value = false;
};

// Component Click / Drag Start
const handleCompMouseDown = (comp: ScreenComponent, e: MouseEvent) => {
  e.stopPropagation();
  if (activeTool.value !== 'select') return;

  if (e.shiftKey) {
    if (selectedCompIds.value.includes(comp.id)) {
      selectedCompIds.value = selectedCompIds.value.filter(id => id !== comp.id);
    } else {
      selectedCompIds.value.push(comp.id);
    }
  } else {
    if (!selectedCompIds.value.includes(comp.id)) {
      selectedCompIds.value = [comp.id];
    }
  }

  isDraggingComps.value = true;
  dragStartMouse.value = { x: e.clientX, y: e.clientY };
  dragInitialPositions.value = {};
  currentEditingComponents.value.forEach(c => {
    dragInitialPositions.value[c.id] = { x: c.x, y: c.y };
  });
};

// Interactive Polyline / Arrow Click
const handleCanvasClickDraw = (e: MouseEvent) => {
  const canvasInner = document.getElementById('workshop-canvas-inner');
  if (!canvasInner) return;
  const rect = canvasInner.getBoundingClientRect();
  const clickX = Math.round((e.clientX - rect.left) / canvasZoom.value);
  const clickY = Math.round((e.clientY - rect.top) / canvasZoom.value);

  if (!isDrawingPolyline.value) {
    isDrawingPolyline.value = true;
    polylinePoints.value = [{ x: clickX, y: clickY }];
  } else {
    polylinePoints.value.push({ x: clickX, y: clickY });
  }
};

const handleFinishPolyline = () => {
  if (polylinePoints.value.length < 2) {
    isDrawingPolyline.value = false;
    polylinePoints.value = [];
    return;
  }

  const currentList = [...currentEditingComponents.value];
  const maxZ = currentList.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  const minX = Math.min(...polylinePoints.value.map(p => p.x));
  const minY = Math.min(...polylinePoints.value.map(p => p.y));
  const maxX = Math.max(...polylinePoints.value.map(p => p.x));
  const maxY = Math.max(...polylinePoints.value.map(p => p.y));
  const w = Math.max(10, maxX - minX);
  const h = Math.max(10, maxY - minY);

  const relativePts = polylinePoints.value.map(p => ({
    x: p.x - minX,
    y: p.y - minY,
    xRatio: w > 0 ? (p.x - minX) / w : 0,
    yRatio: h > 0 ? (p.y - minY) / h : 0
  }));

  const isArrow = activeTool.value === 'draw-arrow';
  const newComp: ScreenComponent = {
    id: `prim-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: isArrow ? `箭头连线 #${currentList.length + 1}` : `折线连线 #${currentList.length + 1}`,
    type: isArrow ? 'draw-arrow' : 'draw-polyline',
    category: 'basic',
    x: minX,
    y: minY,
    width: w,
    height: h,
    rotation: 0,
    zIndex: maxZ + 1,
    style: { stroke: '#00f2ff', strokeWidth: 3, fill: isArrow ? '#00f2ff' : 'transparent' },
    data: { mapping: {} },
    customProps: {
      points: relativePts,
      arrowType: 'forward'
    }
  };

  currentEditingComponents.value = [...currentList, newComp];
  selectedCompIds.value = [newComp.id];
  isDrawingPolyline.value = false;
  polylinePoints.value = [];
  activeTool.value = 'select';
  showNotice(`已创建${newComp.name}`);
};

// Delete selected primitive
const handleDeleteSelectedPrimitives = () => {
  if (selectedCompIds.value.length === 0) return;
  const toDelete = new Set(selectedCompIds.value);
  currentEditingComponents.value = currentEditingComponents.value.filter(c => !toDelete.has(c.id));
  selectedCompIds.value = [];
  showNotice('已删除选中基础图元');
};

// Layer reordering
const handleMoveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
  if (selectedCompIds.value.length === 0) return;
  const list = [...currentEditingComponents.value];
  const targetId = selectedCompIds.value[0];
  const idx = list.findIndex(c => c.id === targetId);
  if (idx < 0) return;

  if (direction === 'up' && idx < list.length - 1) {
    const temp = list[idx];
    list[idx] = list[idx + 1];
    list[idx + 1] = temp;
  } else if (direction === 'down' && idx > 0) {
    const temp = list[idx];
    list[idx] = list[idx - 1];
    list[idx - 1] = temp;
  } else if (direction === 'top') {
    const item = list.splice(idx, 1)[0];
    list.push(item);
  } else if (direction === 'bottom') {
    const item = list.splice(idx, 1)[0];
    list.unshift(item);
  }

  list.forEach((c, i) => {
    c.zIndex = i + 1;
  });
  currentEditingComponents.value = list;
};

// Gallery Operations
const handleUseSymbol = (sym: CustomSymbolDef) => {
  emit('use:symbol', sym);
  emit('close');
};

const handleDuplicateSymbol = (sym: CustomSymbolDef) => {
  const cloned: CustomSymbolDef = {
    ...JSON.parse(JSON.stringify(sym)),
    id: `custom-sym-${Date.now()}`,
    name: `${sym.name} (副本)`
  };
  addCustomSymbol(cloned);
  loadSymbols();
  emit('update:symbols', symbols.value);
  showNotice(`已复制图元: ${cloned.name}`);
};

const handleDeleteSymbol = (id: string, name: string) => {
  if (!confirm(`确定要删除图元「${name}」吗？`)) return;
  deleteCustomSymbol(id);
  loadSymbols();
  emit('update:symbols', symbols.value);
  showNotice(`已删除图元: ${name}`);
};

const handleExportSymbols = () => {
  exportSymbolsAsJSON();
  showNotice('图元资产包已导出');
};

const handleImportClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  const success = await importSymbolsFromJSON(file);
  if (success) {
    loadSymbols();
    emit('update:symbols', symbols.value);
    showNotice('图元资产包导入成功！');
  } else {
    showNotice('导入失败，请检查 JSON 文件格式', 'error');
  }
  target.value = '';
};

// Smart Wizard Generator
const handleGenerateWizardSymbol = () => {
  const templateKey = wizardTemplate.value;
  const theme = wizardConfig.value.colorTheme;
  const name = wizardConfig.value.name;

  let newSym: CustomSymbolDef;

  if (templateKey === 'handcart-breaker') {
    newSym = {
      id: `symbol-wizard-${Date.now()}`,
      name,
      category: 'electrical',
      iconName: 'Zap',
      description: '标准手车断路器 (含工作合闸/分闸/试验位置3态)',
      defaultWidth: 90,
      defaultHeight: 120,
      type: 'composite-symbol',
      defaultStyle: { fill: 'transparent', stroke: theme, strokeWidth: 2 },
      tags: ['手车断路器', '多态图元', wizardConfig.value.voltageLevel],
      states: [
        {
          id: '1',
          name: '工作位置 (合闸)',
          matchValue: '1',
          children: [
            { id: 'c1', name: '灭弧室外框', type: 'draw-rect', category: 'basic', x: 20, y: 25, width: 50, height: 60, rotation: 0, zIndex: 1, style: { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444', strokeWidth: 2, borderRadius: 4 }, data: { mapping: {} } },
            { id: 'c2', name: '合闸导线', type: 'draw-line', category: 'basic', x: 45, y: 5, width: 2, height: 100, rotation: 0, zIndex: 2, style: { stroke: '#ef4444', strokeWidth: 3 }, data: { mapping: {} }, customProps: { points: [{ x: 0, y: 0, xRatio: 0.5, yRatio: 0 }, { x: 0, y: 100, xRatio: 0.5, yRatio: 1 }] } },
            { id: 'c3', name: '合闸符号', type: 'draw-text', category: 'basic', x: 25, y: 45, width: 40, height: 20, rotation: 0, zIndex: 3, style: { fill: 'transparent', fontSize: 14, textColor: '#ef4444', fontWeight: 'bold' }, data: { mapping: {} } }
          ]
        },
        {
          id: '0',
          name: '工作位置 (分闸)',
          matchValue: '0',
          children: [
            { id: 'c1', name: '灭弧室外框', type: 'draw-rect', category: 'basic', x: 20, y: 25, width: 50, height: 60, rotation: 0, zIndex: 1, style: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981', strokeWidth: 2, borderRadius: 4 }, data: { mapping: {} } },
            { id: 'c2', name: '分闸触刀', type: 'draw-polyline', category: 'basic', x: 25, y: 15, width: 40, height: 80, rotation: 0, zIndex: 2, style: { stroke: '#10b981', strokeWidth: 3 }, data: { mapping: {} }, customProps: { points: [{ x: 20, y: 0, xRatio: 0.5, yRatio: 0 }, { x: 5, y: 40, xRatio: 0.1, yRatio: 0.5 }, { x: 20, y: 80, xRatio: 0.5, yRatio: 1 }] } }
          ]
        }
      ]
    };
  } else {
    // Transformer or disconnector
    newSym = {
      id: `symbol-wizard-${Date.now()}`,
      name,
      category: 'electrical',
      iconName: 'Zap',
      description: '高压旋转隔离开关 (带45度触刀开合动态)',
      defaultWidth: 80,
      defaultHeight: 100,
      type: 'composite-symbol',
      defaultStyle: { fill: 'transparent', stroke: theme, strokeWidth: 2 },
      tags: ['隔离开关', wizardConfig.value.voltageLevel],
      states: [
        {
          id: '1',
          name: '合闸接通',
          matchValue: '1',
          children: [
            { id: 'c1', name: '上触头', type: 'draw-circle', category: 'basic', x: 30, y: 5, width: 10, height: 10, rotation: 0, zIndex: 1, style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 }, data: { mapping: {} } },
            { id: 'c2', name: '直通触刀', type: 'draw-line', category: 'basic', x: 34, y: 15, width: 2, height: 60, rotation: 0, zIndex: 2, style: { stroke: '#ef4444', strokeWidth: 3 }, data: { mapping: {} }, customProps: { points: [{ x: 0, y: 0, xRatio: 0.5, yRatio: 0 }, { x: 0, y: 60, xRatio: 0.5, yRatio: 1 }] } },
            { id: 'c3', name: '下触头', type: 'draw-circle', category: 'basic', x: 30, y: 75, width: 10, height: 10, rotation: 0, zIndex: 3, style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 }, data: { mapping: {} } }
          ]
        },
        {
          id: '0',
          name: '分闸断开',
          matchValue: '0',
          children: [
            { id: 'c1', name: '上触头', type: 'draw-circle', category: 'basic', x: 30, y: 5, width: 10, height: 10, rotation: 0, zIndex: 1, style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2 }, data: { mapping: {} } },
            { id: 'c2', name: '断开触刀 (斜开)', type: 'draw-polyline', category: 'basic', x: 10, y: 20, width: 25, height: 55, rotation: 0, zIndex: 2, style: { stroke: '#10b981', strokeWidth: 3 }, data: { mapping: {} }, customProps: { points: [{ x: 0, y: 0, xRatio: 0, yRatio: 0 }, { x: 25, y: 55, xRatio: 1, yRatio: 1 }] } },
            { id: 'c3', name: '下触头', type: 'draw-circle', category: 'basic', x: 30, y: 75, width: 10, height: 10, rotation: 0, zIndex: 3, style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2 }, data: { mapping: {} } }
          ]
        }
      ]
    };
  }

  addCustomSymbol(newSym);
  loadSymbols();
  emit('update:symbols', symbols.value);
  isWizardOpen.value = false;
  showNotice(`已通过向导生成图元: ${newSym.name}`);
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none font-sans">
    <!-- Hidden input for JSON importing -->
    <input
      type="file"
      ref="fileInputRef"
      accept=".json"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Global Floating Toast Notification -->
    <div
      v-if="notificationMessage"
      class="fixed top-6 left-1/2 -translate-x-1/2 z-70 px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-150"
      :class="notificationType === 'success' ? 'bg-cyan-950 border border-cyan-400 text-cyan-200' : 'bg-rose-950 border border-rose-500 text-rose-200'"
    >
      <Check v-if="notificationType === 'success'" class="w-4 h-4 text-cyan-400" />
      <AlertCircle v-else class="w-4 h-4 text-rose-400" />
      <span>{{ notificationMessage }}</span>
    </div>

    <!-- MAIN MODAL CONTAINER -->
    <div class="w-[96vw] max-w-7xl h-[90vh] bg-[#050914] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden">
      
      <!-- ==================== VIEW 1: GALLERY ASSET BROWSER ==================== -->
      <div v-if="currentMode === 'gallery'" class="flex-1 flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="h-14 bg-[#080e1c] border-b border-slate-800 px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.3)]">
              <Box class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>自定义图元资产工坊</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                  SCADA Workshop
                </span>
              </h2>
              <p class="text-[11px] text-slate-400">
                支持无限画布自由拼装基础图元、多态封装与一键自动截取包围盒
              </p>
            </div>
          </div>

          <!-- Header Actions -->
          <div class="flex items-center gap-2.5">
            <!-- Create New Blank Symbol in Canvas Editor -->
            <button
              @click="handleCreateNewBlankSymbol"
              class="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all font-mono"
            >
              <Plus class="w-4 h-4" />
              <span>新建自定义图元</span>
            </button>

            <button
              @click="isWizardOpen = true"
              class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>智能向导生成</span>
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

            <div class="h-4 w-[1px] bg-slate-800 mx-1" />

            <button
              @click="emit('close')"
              class="w-8 h-8 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="p-4 bg-[#060b18] border-b border-slate-800/80 flex items-center justify-between gap-4">
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
          <div class="relative w-72">
            <Search class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索图元名称或标签..."
              class="w-full bg-[#040810] border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <!-- Symbols Grid View -->
        <div class="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div v-if="filteredSymbols.length === 0" class="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-16">
            <Box class="w-12 h-12 text-slate-700" />
            <div class="text-sm">暂无匹配的自定义图元</div>
            <button
              @click="handleCreateNewBlankSymbol"
              class="px-4 py-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
            >
              在无限画布工坊中创建第一个图元
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="sym in filteredSymbols"
              :key="sym.id"
              class="bg-[#070c18] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group hover:shadow-[0_4px_25px_rgba(0,242,255,0.08)]"
            >
              <!-- Card Top -->
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="truncate">
                    <h3 class="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                      {{ sym.name }}
                    </h3>
                    <p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {{ sym.description || 'SCADA 工业图元' }}
                    </p>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono shrink-0">
                    {{ sym.defaultWidth }} × {{ sym.defaultHeight }}
                  </span>
                </div>

                <!-- Multi-State Selector Tabs (If has states) -->
                <div v-if="sym.states && sym.states.length > 1" class="flex items-center gap-1 mb-2 overflow-x-auto py-1 custom-scrollbar">
                  <button
                    v-for="st in sym.states"
                    :key="st.id"
                    @click="previewActiveStates[sym.id] = st.id"
                    class="px-2 py-0.5 rounded text-[10px] font-medium transition-all whitespace-nowrap cursor-pointer"
                    :class="(previewActiveStates[sym.id] || sym.states[0]?.id) === st.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'"
                  >
                    {{ st.name }}
                  </button>
                </div>

                <!-- Live Symbol Rendering Canvas Preview -->
                <div class="h-36 w-full bg-[#03060f] border border-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden my-2 group-hover:border-cyan-500/30 transition-colors">
                  <div
                    class="relative"
                    :style="{
                      width: `${sym.defaultWidth}px`,
                      height: `${sym.defaultHeight}px`,
                      transform: `scale(${Math.min(1, 110 / Math.max(sym.defaultWidth, sym.defaultHeight))})`,
                      transformOrigin: 'center center'
                    }"
                  >
                    <template v-if="sym.states && sym.states.length > 0">
                      <template v-for="child in (sym.states.find(s => s.id === (previewActiveStates[sym.id] || sym.states?.[0]?.id))?.children || sym.children || [])" :key="child.id">
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
                    class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 text-cyan-400/80 border border-cyan-500/20 font-mono"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>

              <!-- Card Bottom Actions -->
              <div class="flex items-center justify-between pt-3 border-t border-slate-900 mt-2">
                <div class="flex items-center gap-1">
                  <!-- Enter Workshop Canvas Editor -->
                  <button
                    @click="openEditorWithSymbol(sym)"
                    class="p-1.5 rounded-md bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 cursor-pointer"
                    title="在工坊画布中编辑图元"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>

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
                  class="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors font-mono"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>放置到主画布</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== VIEW 2: INFINITE CANVAS SYMBOL WORKSHOP EDITOR ==================== -->
      <div v-else class="flex-1 flex flex-col overflow-hidden bg-[#03060f]">
        <!-- Top Toolbar of Canvas Editor -->
        <div class="h-12 bg-[#070c18] border-b border-slate-800 px-4 flex items-center justify-between z-20">
          <!-- Left: Back & Symbol Info & Multi-State Switcher -->
          <div class="flex items-center gap-3">
            <button
              @click="currentMode = 'gallery'"
              class="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>← 返回图元库</span>
            </button>

            <div class="flex items-center gap-2">
              <input
                v-model="editorSymbolName"
                type="text"
                placeholder="图元名称"
                class="bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1 text-xs text-cyan-300 font-bold w-48 font-mono focus:outline-hidden"
              />
            </div>

            <!-- Multi-State Manager Selector -->
            <div class="flex items-center gap-1 pl-2 border-l border-slate-800">
              <span class="text-[11px] text-slate-400">状态:</span>
              <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                <button
                  v-for="st in editorStates"
                  :key="st.id"
                  @click="activeStateId = st.id; selectedCompIds = [];"
                  class="px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors"
                  :class="activeStateId === st.id ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                >
                  {{ st.name }}
                </button>
              </div>

              <button
                @click="handleAddState"
                class="p-1 rounded hover:bg-slate-800 text-cyan-400 cursor-pointer"
                title="添加新状态"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
              <button
                @click="handleDuplicateState"
                class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="复制当前状态"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="editorStates.length > 1"
                @click="handleDeleteState(activeStateId)"
                class="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 cursor-pointer"
                title="删除当前状态"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Center: Drawing Tools Switcher -->
          <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              @click="activeTool = 'select'"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer"
              :class="activeTool === 'select' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
              title="选择与变换工具"
            >
              <MousePointer class="w-3.5 h-3.5" />
              <span>选择</span>
            </button>
            <button
              @click="handleAddPrimitive('draw-rect')"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
              title="添加矩形"
            >
              <Square class="w-3.5 h-3.5" />
              <span>矩形</span>
            </button>
            <button
              @click="handleAddPrimitive('draw-circle')"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
              title="添加圆形触头"
            >
              <Circle class="w-3.5 h-3.5" />
              <span>触头</span>
            </button>
            <button
              @click="handleAddPrimitive('draw-line')"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
              title="添加导线/直线"
            >
              <Minus class="w-3.5 h-3.5" />
              <span>导线</span>
            </button>
            <button
              @click="activeTool = 'draw-polyline'; isDrawingPolyline = false;"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer"
              :class="activeTool === 'draw-polyline' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
              title="折线走线工具 (画布点击定点，双击或按回车结束)"
            >
              <CornerDownRight class="w-3.5 h-3.5" />
              <span>折线走线</span>
            </button>
            <button
              @click="activeTool = 'draw-arrow'; isDrawingPolyline = false;"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer"
              :class="activeTool === 'draw-arrow' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
              title="潮流导向箭头工具"
            >
              <MoveRight class="w-3.5 h-3.5" />
              <span>箭头</span>
            </button>
            <button
              @click="handleAddPrimitive('draw-text')"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
              title="添加文字标签"
            >
              <Type class="w-3.5 h-3.5" />
              <span>文字</span>
            </button>
            <button
              @click="handleAddPrimitive('ctrl-indicator')"
              class="px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
              title="添加指示灯"
            >
              <Zap class="w-3.5 h-3.5" />
              <span>指示灯</span>
            </button>
          </div>

          <!-- Right: Canvas Controls & Auto-Crop & Save -->
          <div class="flex items-center gap-2">
            <!-- Grid and Snap Controls -->
            <button
              @click="showEditorGrid = !showEditorGrid"
              class="p-1.5 rounded-md border text-xs cursor-pointer"
              :class="showEditorGrid ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
              title="网格显示"
            >
              <Grid class="w-3.5 h-3.5" />
            </button>

            <button
              @click="snapToEditorGrid = !snapToEditorGrid"
              class="p-1.5 rounded-md border text-xs cursor-pointer"
              :class="snapToEditorGrid ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
              title="网格吸附"
            >
              <Magnet class="w-3.5 h-3.5" />
            </button>

            <!-- Zoom -->
            <div class="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 text-[11px] font-mono">
              <button @click="canvasZoom = Math.max(0.3, Number((canvasZoom - 0.1).toFixed(2)))" class="hover:text-white cursor-pointer">-</button>
              <span class="text-cyan-300 w-10 text-center">{{ Math.round(canvasZoom * 100) }}%</span>
              <button @click="canvasZoom = Math.min(3.0, Number((canvasZoom + 0.1).toFixed(2)))" class="hover:text-white cursor-pointer">+</button>
            </div>

            <!-- Auto Crop Button -->
            <button
              @click="handleAutoCropSymbol"
              class="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              title="自动截取所有图元的最小包围盒并居中归零"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>自动截取包围盒</span>
            </button>

            <!-- Save & Publish -->
            <button
              @click="handleSaveSymbol(false)"
              class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check class="w-3.5 h-3.5" />
              <span>保存入库</span>
            </button>

            <!-- Save & Place on Canvas -->
            <button
              @click="handleSaveSymbol(true)"
              class="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all font-mono"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>保存并放置</span>
            </button>
          </div>
        </div>

        <!-- Main Body of Canvas Editor: Left Palette + Center Infinite Canvas + Right Inspector -->
        <div class="flex-1 flex overflow-hidden">
          <!-- LEFT PALETTE: Quick Basic Primitives Library -->
          <div class="w-48 bg-[#060b18] border-r border-slate-800/80 flex flex-col p-3 gap-3 overflow-y-auto custom-scrollbar select-none">
            <div class="text-[11px] font-bold text-cyan-400 font-mono flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5" />
              <span>基础构成图元库</span>
            </div>

            <div class="space-y-1.5 text-xs">
              <button
                @click="handleAddPrimitive('draw-rect')"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Square class="w-4 h-4 text-cyan-400" />
                <span>矩形 / 灭弧室</span>
              </button>

              <button
                @click="handleAddPrimitive('draw-circle')"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Circle class="w-4 h-4 text-cyan-400" />
                <span>触头 / 圆环</span>
              </button>

              <button
                @click="handleAddPrimitive('draw-line')"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Minus class="w-4 h-4 text-cyan-400" />
                <span>水平/垂直导线</span>
              </button>

              <button
                @click="activeTool = 'draw-polyline'"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <CornerDownRight class="w-4 h-4 text-cyan-400" />
                <span>折线 / 刀闸触刀</span>
              </button>

              <button
                @click="activeTool = 'draw-arrow'"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <MoveRight class="w-4 h-4 text-cyan-400" />
                <span>导向箭头</span>
              </button>

              <button
                @click="handleAddPrimitive('draw-text')"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Type class="w-4 h-4 text-cyan-400" />
                <span>文本 / 符号标注</span>
              </button>

              <button
                @click="handleAddPrimitive('ctrl-indicator')"
                class="w-full px-2.5 py-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Zap class="w-4 h-4 text-cyan-400" />
                <span>状态指示灯</span>
              </button>
            </div>

            <!-- Auto Crop Bounding Box Info Card -->
            <div class="mt-auto bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1 font-mono text-slate-400">
              <div class="text-cyan-300 font-bold flex items-center gap-1">
                <Box class="w-3 h-3" />
                <span>截取包围盒尺寸</span>
              </div>
              <div>宽: <strong class="text-white">{{ currentBoundingBox.width }} px</strong></div>
              <div>高: <strong class="text-white">{{ currentBoundingBox.height }} px</strong></div>
              <div class="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                保存时将自动截取并紧凑对齐
              </div>
            </div>
          </div>

          <!-- CENTER: INFINITE CANVAS WORKSPACE -->
          <div
            id="workshop-canvas-bg"
            class="flex-1 relative overflow-hidden cursor-crosshair"
            :style="{
              backgroundColor: '#02050b',
              backgroundImage: showEditorGrid 
                ? `radial-gradient(circle, rgba(0, 242, 255, 0.2) 1.5px, transparent 1.5px)` 
                : 'none',
              backgroundSize: `${editorGridSize * canvasZoom}px ${editorGridSize * canvasZoom}px`,
              backgroundPosition: `${canvasPan.x}px ${canvasPan.y}px`
            }"
            @wheel="handleCanvasWheel"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
          >
            <!-- Canvas Scaled & Panned Content Container -->
            <div
              id="workshop-canvas-inner"
              class="absolute origin-top-left"
              :style="{
                transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`
              }"
            >
              <!-- Real-time Bounding Box Visual Outline (自动截取边界框预览) -->
              <div
                v-if="currentEditingComponents.length > 0"
                class="absolute border border-dashed border-cyan-400/60 rounded pointer-events-none transition-all duration-75"
                :style="{
                  left: `${currentBoundingBox.minX - 6}px`,
                  top: `${currentBoundingBox.minY - 6}px`,
                  width: `${currentBoundingBox.width + 12}px`,
                  height: `${currentBoundingBox.height + 12}px`
                }"
              >
                <div class="absolute -top-5 left-0 px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-500/40 text-[9px] text-cyan-300 font-mono whitespace-nowrap">
                  自动截取范围: {{ currentBoundingBox.width }} × {{ currentBoundingBox.height }} px
                </div>
              </div>

              <!-- Render All Basic Primitives in Current State -->
              <div
                v-for="comp in currentEditingComponents"
                :key="comp.id"
                class="absolute cursor-move group select-none"
                :class="{
                  'ring-2 ring-cyan-400 ring-offset-1 ring-offset-transparent': selectedCompIds.includes(comp.id)
                }"
                :style="{
                  left: `${comp.x}px`,
                  top: `${comp.y}px`,
                  width: `${comp.width}px`,
                  height: `${comp.height}px`,
                  transform: comp.rotation ? `rotate(${comp.rotation}deg)` : 'none',
                  zIndex: comp.zIndex || 1
                }"
                @mousedown.stop="handleCompMouseDown(comp, $event)"
              >
                <WidgetRenderer :component="comp" />

                <!-- Selection Handles -->
                <template v-if="selectedCompIds.includes(comp.id)">
                  <div class="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full" />
                  <div class="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                  <div class="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full" />
                  <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                </template>
              </div>

              <!-- Interactive Polyline Drawing Preview SVG Overlay -->
              <svg
                v-if="isDrawingPolyline && polylinePoints.length > 0"
                class="absolute inset-0 overflow-visible pointer-events-none"
                style="width: 2000px; height: 2000px;"
              >
                <polyline
                  :points="[...polylinePoints, polylineCurrentMouse].map(p => `${p.x},${p.y}`).join(' ')"
                  fill="none"
                  stroke="#00f2ff"
                  stroke-width="3"
                  stroke-dasharray="4,4"
                />
                <circle
                  v-for="(pt, i) in polylinePoints"
                  :key="i"
                  :cx="pt.x"
                  :cy="pt.y"
                  r="4"
                  fill="#00f2ff"
                />
              </svg>
            </div>

            <!-- Polyline drawing floating tip -->
            <div
              v-if="isDrawingPolyline"
              class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-cyan-950/95 border border-cyan-400 px-4 py-2 rounded-xl text-xs text-cyan-200 font-mono shadow-2xl flex items-center gap-3 z-30"
            >
              <span>折线绘制中 (已点击 {{ polylinePoints.length }} 点) · 点击继续添加定点</span>
              <button
                @click="handleFinishPolyline"
                class="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded cursor-pointer text-xs"
              >
                完成绘制
              </button>
            </div>
          </div>

          <!-- RIGHT SIDEBAR: Properties & Layers Inspector -->
          <div class="w-64 bg-[#060b18] border-l border-slate-800/80 flex flex-col p-3 gap-3 overflow-y-auto custom-scrollbar font-mono text-xs select-none">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold text-slate-200">图元属性与图层</span>
              <button
                v-if="selectedCompIds.length > 0"
                @click="handleDeleteSelectedPrimitives"
                class="p-1 rounded hover:bg-rose-950 text-rose-400 cursor-pointer"
                title="删除选中图元"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Selected Component Props -->
            <div v-if="selectedComponent" class="space-y-3">
              <div class="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                <Sliders class="w-3.5 h-3.5" />
                <span>选中: {{ selectedComponent.name }}</span>
              </div>

              <!-- Position & Size -->
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label class="text-slate-400 block mb-0.5">X 坐标</label>
                  <input
                    type="number"
                    v-model.number="selectedComponent.x"
                    class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <div>
                  <label class="text-slate-400 block mb-0.5">Y 坐标</label>
                  <input
                    type="number"
                    v-model.number="selectedComponent.y"
                    class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <div>
                  <label class="text-slate-400 block mb-0.5">宽度 W</label>
                  <input
                    type="number"
                    v-model.number="selectedComponent.width"
                    class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <div>
                  <label class="text-slate-400 block mb-0.5">高度 H</label>
                  <input
                    type="number"
                    v-model.number="selectedComponent.height"
                    class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                </div>
              </div>

              <!-- Styling Props -->
              <div class="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <label class="text-slate-400 block mb-0.5">填充颜色</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      v-model="selectedComponent.style.fill"
                      class="w-7 h-7 bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      v-model="selectedComponent.style.fill"
                      class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label class="text-slate-400 block mb-0.5">边框颜色</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      v-model="selectedComponent.style.stroke"
                      class="w-7 h-7 bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      v-model="selectedComponent.style.stroke"
                      class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-slate-400 block mb-0.5">线条粗细</label>
                    <input
                      type="number"
                      v-model.number="selectedComponent.style.strokeWidth"
                      class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label class="text-slate-400 block mb-0.5">圆角半径</label>
                    <input
                      type="number"
                      v-model.number="selectedComponent.style.borderRadius"
                      class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <!-- Layer Order Actions -->
              <div class="pt-2 border-t border-slate-800">
                <label class="text-slate-400 block mb-1 text-[11px]">图层层级顺序</label>
                <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button @click="handleMoveLayer('up')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 cursor-pointer">
                    上移一层
                  </button>
                  <button @click="handleMoveLayer('down')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 cursor-pointer">
                    下移一层
                  </button>
                  <button @click="handleMoveLayer('top')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 cursor-pointer">
                    置于顶层
                  </button>
                  <button @click="handleMoveLayer('bottom')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-slate-300 cursor-pointer">
                    置于底层
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="text-center text-slate-500 py-6 text-[11px]">
              点击画布上的基础图元查看并调整属性
            </div>

            <!-- Layer List of Current State -->
            <div class="mt-auto pt-3 border-t border-slate-800 space-y-1.5">
              <div class="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>当前状态图层 ({{ currentEditingComponents.length }})</span>
              </div>
              <div class="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                <button
                  v-for="c in currentEditingComponents"
                  :key="c.id"
                  @click="selectedCompIds = [c.id]"
                  class="w-full px-2 py-1 rounded text-left text-[11px] flex items-center justify-between cursor-pointer"
                  :class="selectedCompIds.includes(c.id) ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-900'"
                >
                  <span class="truncate">{{ c.name }}</span>
                  <span class="text-[9px] text-slate-500 font-mono">z:{{ c.zIndex || 1 }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Smart Generator Wizard Modal -->
    <div v-if="isWizardOpen" class="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <div class="w-[520px] bg-[#070d1a] border border-cyan-500/50 rounded-xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200 font-mono text-xs">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2 text-cyan-300 font-bold text-sm">
            <Sparkles class="w-4 h-4" />
            <span>智能多态电气图元向导生成</span>
          </div>
          <button @click="isWizardOpen = false" class="text-slate-400 hover:text-white cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
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
                @change="wizardConfig.name = `${wizardConfig.voltageLevel} ${wizardTemplate === 'handcart-breaker' ? '手车断路器' : '旋转隔离开关'}`"
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
