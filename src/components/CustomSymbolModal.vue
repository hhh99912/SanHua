<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { CustomSymbolDef, CustomSymbolStateDef, ScreenComponent, ComponentType } from '../types';
import { getCustomSymbols, saveCustomSymbols, addCustomSymbol, removeCustomSymbol } from '../utils/customSymbolStorage';
import WidgetRenderer from './widgets/WidgetRenderer.vue';
import { 
  Plus, Trash2, Edit2, Copy, Sparkles, Box, Check, X, 
  Zap, Layers, Upload, Download, Tag, Search,
  Square, Circle, MoveRight, Type, Minus, Workflow,
  ToggleRight, CircleDot, Activity, Cpu, Binary, Eye,
  ArrowUp, ArrowDown, Grid, Undo, Redo, RefreshCw, RotateCw,
  SlidersHorizontal, BookmarkPlus, Hexagon, Star, MousePointer,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  FlipHorizontal, FlipVertical, Lock, Unlock, ZoomIn, ZoomOut, Maximize2,
  Scissors, CornerUpLeft, CornerUpRight, ChevronsUp, ChevronsDown
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

// Mode: 'library' (资产库) | 'studio' (图元组装工坊)
const activeView = ref<'library' | 'studio'>('library');

// Studio Material Tabs
const studioMaterialTab = ref<'primitives' | 'symbols'>('primitives');

// Drawing Tool in Studio Canvas: 'select' | 'draw-line' | 'draw-polyline'
const studioDrawTool = ref<'select' | 'draw-line' | 'draw-polyline'>('select');

// Studio Canvas Zoom and Pan
const studioZoom = ref<number>(1);
const showStudioGrid = ref<boolean>(true);

// Interactive Drawing States in Studio
const studioLineDrawing = ref<{
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}>({
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0
});

const studioPolylineDrawing = ref<{
  active: boolean;
  points: Array<{ x: number; y: number }>;
  currentX: number;
  currentY: number;
}>({
  active: false,
  points: [],
  currentX: 0,
  currentY: 0
});

// Studio Builder State
const studioSymbol = ref<{
  id: string;
  name: string;
  category: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  states: CustomSymbolStateDef[];
  activeStateId: string;
  tags: string[];
}>({
  id: '',
  name: '新组装复合图元',
  category: 'electrical',
  description: '由基础图元组合而成的 SCADA 复合图元',
  width: 200,
  height: 260,
  backgroundColor: 'transparent',
  states: [
    {
      id: '1',
      name: '状态 1 (合闸 / 运行)',
      children: []
    }
  ],
  activeStateId: '1',
  tags: ['电力', '断路器']
});

// Multi-Selection inside Studio
const selectedStudioChildIds = ref<string[]>([]);

// Undo / Redo History inside Studio
const studioHistoryStack = ref<Array<{
  symbol: typeof studioSymbol.value;
  selectedIds: string[];
}>>([]);
const studioHistoryIndex = ref<number>(-1);
const isPerformingStudioHistory = ref(false);

const recordStudioHistory = () => {
  if (isPerformingStudioHistory.value) return;
  const snapshot = {
    symbol: JSON.parse(JSON.stringify(studioSymbol.value)),
    selectedIds: [...selectedStudioChildIds.value]
  };
  if (studioHistoryIndex.value < studioHistoryStack.value.length - 1) {
    studioHistoryStack.value = studioHistoryStack.value.slice(0, studioHistoryIndex.value + 1);
  }
  studioHistoryStack.value.push(snapshot);
  if (studioHistoryStack.value.length > 40) {
    studioHistoryStack.value.shift();
  }
  studioHistoryIndex.value = studioHistoryStack.value.length - 1;
};

const handleStudioUndo = () => {
  if (studioHistoryIndex.value > 0) {
    isPerformingStudioHistory.value = true;
    studioHistoryIndex.value -= 1;
    const snap = studioHistoryStack.value[studioHistoryIndex.value];
    studioSymbol.value = JSON.parse(JSON.stringify(snap.symbol));
    selectedStudioChildIds.value = [...snap.selectedIds];
    setTimeout(() => { isPerformingStudioHistory.value = false; }, 40);
  }
};

const handleStudioRedo = () => {
  if (studioHistoryIndex.value < studioHistoryStack.value.length - 1) {
    isPerformingStudioHistory.value = true;
    studioHistoryIndex.value += 1;
    const snap = studioHistoryStack.value[studioHistoryIndex.value];
    studioSymbol.value = JSON.parse(JSON.stringify(snap.symbol));
    selectedStudioChildIds.value = [...snap.selectedIds];
    setTimeout(() => { isPerformingStudioHistory.value = false; }, 40);
  }
};

const activeStudioState = computed(() => {
  const st = studioSymbol.value.states.find(s => s.id === studioSymbol.value.activeStateId);
  return st || studioSymbol.value.states[0];
});

const currentStudioChildren = computed({
  get() {
    return activeStudioState.value?.children || [];
  },
  set(val: ScreenComponent[]) {
    if (activeStudioState.value) {
      activeStudioState.value.children = val;
    }
  }
});

const selectedStudioChildren = computed(() => {
  return currentStudioChildren.value.filter(c => selectedStudioChildIds.value.includes(c.id));
});

const primarySelectedStudioChild = computed(() => {
  if (selectedStudioChildIds.value.length === 1) {
    return currentStudioChildren.value.find(c => c.id === selectedStudioChildIds.value[0]) || null;
  }
  return null;
});

// Dragging inside Studio Canvas (Supports batch multi-drag)
const isStudioDragging = ref(false);
const studioDragStartMouse = ref({ x: 0, y: 0 });
const studioDragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map());

// Resizing inside Studio Canvas
const isStudioResizing = ref(false);
const studioResizeHandle = ref<string | null>(null);
const studioResizeStart = ref({ mouseX: 0, mouseY: 0, x: 0, y: 0, width: 0, height: 0 });

// Marquee Selection Box in Studio Canvas
const isStudioMarquee = ref(false);
const hasMovedStudioMarquee = ref(false);
const studioMarqueeBox = ref({ startX: 0, startY: 0, x: 0, y: 0, width: 0, height: 0 });

// Context Menu in Studio
const studioContextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  targetChildId: string | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  canvasX: 0,
  canvasY: 0,
  targetChildId: null
});

// Clipboard inside studio
const studioClipboard = ref<ScreenComponent[]>([]);

// Studio Canvas DOM Ref
const studioCanvasRef = ref<HTMLElement | null>(null);
const studioWorkspaceRef = ref<HTMLElement | null>(null);

// Primitives available in Studio Palette
const studioPrimitives: Array<{
  type: ComponentType;
  category: ScreenComponent['category'];
  name: string;
  icon: any;
  defaultW: number;
  defaultH: number;
  style: ScreenComponent['style'];
  customProps?: any;
}> = [
  {
    type: 'draw-line',
    category: 'basic',
    name: '直线走线',
    icon: Minus,
    defaultW: 140,
    defaultH: 12,
    style: { stroke: '#00f2ff', strokeWidth: 3, lineStyle: 'solid' },
    customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 6 }, { xRatio: 1, yRatio: 0.5, x: 140, y: 6 }] }
  },
  {
    type: 'draw-polyline',
    category: 'basic',
    name: '直角折线',
    icon: Workflow,
    defaultW: 120,
    defaultH: 80,
    style: { stroke: '#00f2ff', strokeWidth: 3, lineType: 'step-horizontal', lineStyle: 'solid' },
    customProps: {
      points: [
        { xRatio: 0, yRatio: 0, x: 0, y: 0 },
        { xRatio: 1, yRatio: 0, x: 120, y: 0 },
        { xRatio: 1, yRatio: 1, x: 120, y: 80 }
      ]
    }
  },
  {
    type: 'draw-arrow',
    category: 'basic',
    name: '导向箭头',
    icon: MoveRight,
    defaultW: 120,
    defaultH: 30,
    style: { stroke: '#00f2ff', strokeWidth: 3, fill: '#00f2ff' }
  },
  {
    type: 'draw-rect',
    category: 'basic',
    name: '矩形/底板',
    icon: Square,
    defaultW: 120,
    defaultH: 80,
    style: { fill: 'rgba(0, 242, 255, 0.12)', stroke: '#00f2ff', strokeWidth: 1.5, borderRadius: 4 }
  },
  {
    type: 'draw-circle',
    category: 'basic',
    name: '圆形/节点',
    icon: Circle,
    defaultW: 70,
    defaultH: 70,
    style: { fill: 'rgba(0, 229, 163, 0.15)', stroke: '#00e5a3', strokeWidth: 2 }
  },
  {
    type: 'draw-polygon',
    category: 'basic',
    name: '多边形/阀芯',
    icon: Hexagon,
    defaultW: 80,
    defaultH: 80,
    style: { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6', strokeWidth: 2 }
  },
  {
    type: 'draw-star',
    category: 'basic',
    name: '五角星/标记',
    icon: Star,
    defaultW: 60,
    defaultH: 60,
    style: { fill: 'rgba(245, 158, 11, 0.25)', stroke: '#f59e0b', strokeWidth: 2 }
  },
  {
    type: 'draw-text',
    category: 'basic',
    name: '发光文本',
    icon: Type,
    defaultW: 100,
    defaultH: 26,
    style: { fill: 'transparent', fontSize: 14, textColor: '#00f2ff', fontWeight: 'bold' }
  },
  {
    type: 'ctrl-button',
    category: 'basic',
    name: '控制按键/开关',
    icon: ToggleRight,
    defaultW: 90,
    defaultH: 30,
    style: { buttonText: '开关操作', buttonColorTheme: 'cyan', buttonVariant: 'solid', borderRadius: 4 }
  },
  {
    type: 'ctrl-indicator',
    category: 'basic',
    name: 'LED指示灯',
    icon: CircleDot,
    defaultW: 30,
    defaultH: 30,
    style: { indicatorShape: 'circle', indicatorState: 'normal', indicatorBlinkSpeed: 'none' }
  },
  {
    type: 'metric-float',
    category: 'metrics',
    name: '浮点数值遥测',
    icon: Binary,
    defaultW: 90,
    defaultH: 26,
    style: { textColor: '#00f2ff', fontSize: 14, decimals: 2, suffix: 'A', fill: 'transparent' }
  }
];

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
      s.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase())));
    return matchesCat && matchesQuery;
  });
});

// Helper to convert studio canvas screen coords with zoom scale
const getStudioCoords = (clientX: number, clientY: number) => {
  if (!studioCanvasRef.value) return { x: 0, y: 0 };
  const rect = studioCanvasRef.value.getBoundingClientRect();
  const rawX = (clientX - rect.left) / studioZoom.value;
  const rawY = (clientY - rect.top) / studioZoom.value;
  return {
    x: Math.round(Math.max(0, Math.min(studioSymbol.value.width, rawX))),
    y: Math.round(Math.max(0, Math.min(studioSymbol.value.height, rawY)))
  };
};

// Drag & Drop Primitive to Studio Canvas
const handleStudioPaletteDragStart = (e: DragEvent, item: typeof studioPrimitives[0]) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }
};

const handleStudioSymbolDragStart = (e: DragEvent, sym: CustomSymbolDef) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      isSymbol: true,
      symbol: sym
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }
};

const handleStudioCanvasDrop = (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  const raw = e.dataTransfer.getData('application/json');
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    const coords = getStudioCoords(e.clientX, e.clientY);
    const maxZ = currentStudioChildren.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);

    if (data.isSymbol && data.symbol) {
      const sym: CustomSymbolDef = data.symbol;
      const compW = sym.defaultWidth || 100;
      const compH = sym.defaultHeight || 100;
      const newComp: ScreenComponent = {
        id: `studio-sym-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: sym.name,
        type: 'composite-symbol',
        category: sym.category,
        x: Math.round(Math.max(0, coords.x - compW / 2)),
        y: Math.round(Math.max(0, coords.y - compH / 2)),
        width: compW,
        height: compH,
        rotation: 0,
        zIndex: maxZ + 1,
        states: sym.states ? JSON.parse(JSON.stringify(sym.states)) : undefined,
        children: sym.children ? JSON.parse(JSON.stringify(sym.children)) : undefined,
        style: sym.defaultStyle ? JSON.parse(JSON.stringify(sym.defaultStyle)) : {},
        data: { mapping: {} }
      };
      currentStudioChildren.value.push(newComp);
      selectedStudioChildIds.value = [newComp.id];
      recordStudioHistory();
    } else {
      const item: typeof studioPrimitives[0] = data;
      const compW = item.defaultW || 80;
      const compH = item.defaultH || 40;
      const newComp: ScreenComponent = {
        id: `studio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        type: item.type,
        category: item.category,
        x: Math.round(Math.max(0, coords.x - compW / 2)),
        y: Math.round(Math.max(0, coords.y - compH / 2)),
        width: compW,
        height: compH,
        rotation: 0,
        zIndex: maxZ + 1,
        style: { ...item.style },
        data: { mapping: {} },
        customProps: item.customProps ? { ...item.customProps } : {}
      };
      currentStudioChildren.value.push(newComp);
      selectedStudioChildIds.value = [newComp.id];
      recordStudioHistory();
    }
  } catch (err) {
    console.error('Failed to handle studio drop:', err);
  }
};

// Add primitive to studio canvas (Click to add)
const addPrimitiveToStudio = (item: typeof studioPrimitives[0]) => {
  const maxZ = currentStudioChildren.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  const newComp: ScreenComponent = {
    id: `studio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: item.name,
    type: item.type,
    category: item.category,
    x: Math.round(Math.max(10, (studioSymbol.value.width - item.defaultW) / 2)),
    y: Math.round(Math.max(10, (studioSymbol.value.height - item.defaultH) / 2)),
    width: item.defaultW,
    height: item.defaultH,
    rotation: 0,
    zIndex: maxZ + 1,
    style: { ...item.style },
    data: { mapping: {} },
    customProps: item.customProps ? { ...item.customProps } : {}
  };

  currentStudioChildren.value.push(newComp);
  selectedStudioChildIds.value = [newComp.id];
  recordStudioHistory();
};

// Add sub-symbol into current studio
const addSubSymbolToStudio = (sym: CustomSymbolDef) => {
  const maxZ = currentStudioChildren.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
  const compW = sym.defaultWidth || 100;
  const compH = sym.defaultHeight || 100;
  const newComp: ScreenComponent = {
    id: `studio-sym-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: sym.name,
    type: 'composite-symbol',
    category: sym.category,
    x: Math.round(Math.max(10, (studioSymbol.value.width - compW) / 2)),
    y: Math.round(Math.max(10, (studioSymbol.value.height - compH) / 2)),
    width: compW,
    height: compH,
    rotation: 0,
    zIndex: maxZ + 1,
    states: sym.states ? JSON.parse(JSON.stringify(sym.states)) : undefined,
    children: sym.children ? JSON.parse(JSON.stringify(sym.children)) : undefined,
    style: sym.defaultStyle ? JSON.parse(JSON.stringify(sym.defaultStyle)) : {},
    data: { mapping: {} }
  };
  currentStudioChildren.value.push(newComp);
  selectedStudioChildIds.value = [newComp.id];
  recordStudioHistory();
};

// Studio Canvas Click Handler (Supports interactive line/polyline drawing)
const handleStudioCanvasClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const isDirectCanvas = target === studioCanvasRef.value || target.classList.contains('studio-canvas-bg');
  const coords = getStudioCoords(e.clientX, e.clientY);

  // 1. Draw Straight Line Mode
  if (studioDrawTool.value === 'draw-line') {
    if (!studioLineDrawing.value.active) {
      studioLineDrawing.value.active = true;
      studioLineDrawing.value.startX = coords.x;
      studioLineDrawing.value.startY = coords.y;
      studioLineDrawing.value.currentX = coords.x;
      studioLineDrawing.value.currentY = coords.y;
    } else {
      const x1 = studioLineDrawing.value.startX;
      const y1 = studioLineDrawing.value.startY;
      const x2 = coords.x;
      const y2 = coords.y;

      const compX = Math.min(x1, x2);
      const compY = Math.min(y1, y2);
      const compW = Math.max(10, Math.abs(x2 - x1));
      const compH = Math.max(10, Math.abs(y2 - y1));

      const relX1 = x1 - compX;
      const relY1 = y1 - compY;
      const relX2 = x2 - compX;
      const relY2 = y2 - compY;

      const maxZ = currentStudioChildren.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
      const newComp: ScreenComponent = {
        id: `studio-line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '导线 / 直线',
        type: 'draw-line',
        category: 'basic',
        x: compX,
        y: compY,
        width: compW,
        height: compH,
        rotation: 0,
        zIndex: maxZ + 1,
        style: { stroke: '#00f2ff', strokeWidth: 3, lineStyle: 'solid' },
        customProps: {
          points: [
            { xRatio: compW > 0 ? relX1 / compW : 0, yRatio: compH > 0 ? relY1 / compH : 0, x: relX1, y: relY1 },
            { xRatio: compW > 0 ? relX2 / compW : 1, yRatio: compH > 0 ? relY2 / compH : 1, x: relX2, y: relY2 }
          ]
        },
        data: { mapping: {} }
      };

      currentStudioChildren.value.push(newComp);
      selectedStudioChildIds.value = [newComp.id];
      studioLineDrawing.value.active = false;
      studioDrawTool.value = 'select';
      recordStudioHistory();
    }
    return;
  }

  // 2. Draw Polyline Mode
  if (studioDrawTool.value === 'draw-polyline') {
    if (!studioPolylineDrawing.value.active) {
      studioPolylineDrawing.value.active = true;
      studioPolylineDrawing.value.points = [{ x: coords.x, y: coords.y }];
      studioPolylineDrawing.value.currentX = coords.x;
      studioPolylineDrawing.value.currentY = coords.y;
    } else {
      studioPolylineDrawing.value.points.push({ x: coords.x, y: coords.y });
    }
    return;
  }

  // Deselect only if clicked directly on empty background canvas without moving marquee
  if (isDirectCanvas && !hasMovedStudioMarquee.value) {
    selectedStudioChildIds.value = [];
  }
};

const handleStudioChildClick = (e: MouseEvent, comp: ScreenComponent) => {
  e.stopPropagation();
  if (studioDrawTool.value !== 'select') return;
  const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
  if (!isMulti) {
    selectedStudioChildIds.value = [comp.id];
  }
};

// Studio Canvas Double Click Handler (Finishes Polyline Drawing)
const handleStudioCanvasDblClick = (e: MouseEvent) => {
  if (studioDrawTool.value === 'draw-polyline' && studioPolylineDrawing.value.active) {
    const pts = studioPolylineDrawing.value.points;
    if (pts.length >= 2) {
      const minX = Math.min(...pts.map(p => p.x));
      const minY = Math.min(...pts.map(p => p.y));
      const maxX = Math.max(...pts.map(p => p.x));
      const maxY = Math.max(...pts.map(p => p.y));

      const compW = Math.max(10, maxX - minX);
      const compH = Math.max(10, maxY - minY);

      const relPoints = pts.map(p => ({
        xRatio: compW > 0 ? (p.x - minX) / compW : 0,
        yRatio: compH > 0 ? (p.y - minY) / compH : 0,
        x: p.x - minX,
        y: p.y - minY
      }));

      const maxZ = currentStudioChildren.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);
      const newComp: ScreenComponent = {
        id: `studio-poly-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '折线走线',
        type: 'draw-polyline',
        category: 'basic',
        x: minX,
        y: minY,
        width: compW,
        height: compH,
        rotation: 0,
        zIndex: maxZ + 1,
        style: { stroke: '#00f2ff', strokeWidth: 3, lineType: 'step-horizontal', lineStyle: 'solid' },
        customProps: { points: relPoints },
        data: { mapping: {} }
      };

      currentStudioChildren.value.push(newComp);
      selectedStudioChildIds.value = [newComp.id];
      recordStudioHistory();
    }

    studioPolylineDrawing.value.active = false;
    studioPolylineDrawing.value.points = [];
    studioDrawTool.value = 'select';
  }
};

const finishStudioPolyline = () => {
  handleStudioCanvasDblClick(new MouseEvent('dblclick'));
};

const cancelStudioDrawing = () => {
  studioLineDrawing.value.active = false;
  studioPolylineDrawing.value.active = false;
  studioPolylineDrawing.value.points = [];
  studioDrawTool.value = 'select';
};

// Studio Canvas Mouse Down: Supports Marquee Drag
const handleStudioCanvasMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;
  if (studioDrawTool.value !== 'select') return;

  const target = e.target as HTMLElement;
  if (target === studioCanvasRef.value || target.classList.contains('studio-canvas-bg')) {
    const coords = getStudioCoords(e.clientX, e.clientY);
    isStudioMarquee.value = true;
    hasMovedStudioMarquee.value = false;
    studioMarqueeBox.value = {
      startX: coords.x,
      startY: coords.y,
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0
    };
  }
};

// Studio Child Mouse Down & Selection (Supports Shift/Ctrl multi-selection & batch drag)
const handleStudioChildMouseDown = (e: MouseEvent, comp: ScreenComponent) => {
  if (e.button !== 0) return;
  if (studioDrawTool.value !== 'select') return;
  e.stopPropagation();

  const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
  if (isMulti) {
    if (selectedStudioChildIds.value.includes(comp.id)) {
      selectedStudioChildIds.value = selectedStudioChildIds.value.filter(id => id !== comp.id);
    } else {
      selectedStudioChildIds.value.push(comp.id);
    }
  } else {
    if (!selectedStudioChildIds.value.includes(comp.id)) {
      selectedStudioChildIds.value = [comp.id];
    }
  }

  isStudioDragging.value = true;
  studioDragStartMouse.value = { x: e.clientX, y: e.clientY };
  studioDragStartPositions.value.clear();
  currentStudioChildren.value.forEach(c => {
    if (selectedStudioChildIds.value.includes(c.id)) {
      studioDragStartPositions.value.set(c.id, { x: c.x, y: c.y });
    }
  });
};

const handleStudioMouseMove = (e: MouseEvent) => {
  // 1. Drawing preview updates
  if (studioLineDrawing.value.active || studioPolylineDrawing.value.active) {
    const coords = getStudioCoords(e.clientX, e.clientY);
    if (studioLineDrawing.value.active) {
      studioLineDrawing.value.currentX = coords.x;
      studioLineDrawing.value.currentY = coords.y;
    }
    if (studioPolylineDrawing.value.active) {
      studioPolylineDrawing.value.currentX = coords.x;
      studioPolylineDrawing.value.currentY = coords.y;
    }
    return;
  }

  // 2. Marquee Selection Drag
  if (isStudioMarquee.value) {
    const coords = getStudioCoords(e.clientX, e.clientY);
    const minX = Math.min(studioMarqueeBox.value.startX, coords.x);
    const minY = Math.min(studioMarqueeBox.value.startY, coords.y);
    const w = Math.abs(coords.x - studioMarqueeBox.value.startX);
    const h = Math.abs(coords.y - studioMarqueeBox.value.startY);

    if (w > 4 || h > 4) {
      hasMovedStudioMarquee.value = true;
    }

    studioMarqueeBox.value.x = minX;
    studioMarqueeBox.value.y = minY;
    studioMarqueeBox.value.width = w;
    studioMarqueeBox.value.height = h;

    if (hasMovedStudioMarquee.value) {
      const selected = currentStudioChildren.value.filter(c => {
        return (
          c.x < minX + w &&
          c.x + c.width > minX &&
          c.y < minY + h &&
          c.y + c.height > minY
        );
      });
      selectedStudioChildIds.value = selected.map(c => c.id);
    }
    return;
  }

  // 3. Batch Dragging Selected Children
  if (isStudioDragging.value && selectedStudioChildIds.value.length > 0) {
    const dx = (e.clientX - studioDragStartMouse.value.x) / studioZoom.value;
    const dy = (e.clientY - studioDragStartMouse.value.y) / studioZoom.value;

    currentStudioChildren.value.forEach(c => {
      if (selectedStudioChildIds.value.includes(c.id) && !c.locked) {
        const startPos = studioDragStartPositions.value.get(c.id) || { x: c.x, y: c.y };
        c.x = Math.round(startPos.x + dx);
        c.y = Math.round(startPos.y + dy);
      }
    });
    return;
  }

  // 4. Resizing Primary Selected Child
  if (isStudioResizing.value && primarySelectedStudioChild.value && studioResizeHandle.value && !primarySelectedStudioChild.value.locked) {
    const dx = (e.clientX - studioResizeStart.value.mouseX) / studioZoom.value;
    const dy = (e.clientY - studioResizeStart.value.mouseY) / studioZoom.value;
    const handle = studioResizeHandle.value;
    const comp = primarySelectedStudioChild.value;

    if (handle.includes('e')) comp.width = Math.max(10, Math.round(studioResizeStart.value.width + dx));
    if (handle.includes('s')) comp.height = Math.max(6, Math.round(studioResizeStart.value.height + dy));
    if (handle.includes('w')) {
      const potW = studioResizeStart.value.width - dx;
      if (potW >= 10) {
        comp.width = Math.round(potW);
        comp.x = Math.round(studioResizeStart.value.x + dx);
      }
    }
    if (handle.includes('n')) {
      const potH = studioResizeStart.value.height - dy;
      if (potH >= 6) {
        comp.height = Math.round(potH);
        comp.y = Math.round(studioResizeStart.value.y + dy);
      }
    }
  }
};

const handleStudioMouseUp = () => {
  if (isStudioDragging.value || isStudioResizing.value) {
    recordStudioHistory();
  }
  isStudioDragging.value = false;
  isStudioResizing.value = false;
  studioResizeHandle.value = null;
  isStudioMarquee.value = false;
};

const handleStudioStartResize = (e: MouseEvent, handle: string) => {
  e.stopPropagation();
  e.preventDefault();
  if (!primarySelectedStudioChild.value || primarySelectedStudioChild.value.locked) return;

  const comp = primarySelectedStudioChild.value;
  isStudioResizing.value = true;
  studioResizeHandle.value = handle;
  studioResizeStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    x: comp.x,
    y: comp.y,
    width: comp.width,
    height: comp.height
  };
};

// Alignments in Studio Canvas
const handleStudioAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v') => {
  const selected = selectedStudioChildren.value.filter(c => !c.locked);
  if (selected.length < 2) return;

  if (type === 'left') {
    const minX = Math.min(...selected.map(c => c.x));
    selected.forEach(c => { c.x = minX; });
  } else if (type === 'center') {
    const minX = Math.min(...selected.map(c => c.x));
    const maxX = Math.max(...selected.map(c => c.x + c.width));
    const centerX = (minX + maxX) / 2;
    selected.forEach(c => { c.x = Math.round(centerX - c.width / 2); });
  } else if (type === 'right') {
    const maxX = Math.max(...selected.map(c => c.x + c.width));
    selected.forEach(c => { c.x = maxX - c.width; });
  } else if (type === 'top') {
    const minY = Math.min(...selected.map(c => c.y));
    selected.forEach(c => { c.y = minY; });
  } else if (type === 'middle') {
    const minY = Math.min(...selected.map(c => c.y));
    const maxY = Math.max(...selected.map(c => c.y + c.height));
    const centerY = (minY + maxY) / 2;
    selected.forEach(c => { c.y = Math.round(centerY - c.height / 2); });
  } else if (type === 'bottom') {
    const maxY = Math.max(...selected.map(c => c.y + c.height));
    selected.forEach(c => { c.y = maxY - c.height; });
  } else if (type === 'distribute-h') {
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const totalW = sorted.reduce((sum, c) => sum + c.width, 0);
    const minX = sorted[0].x;
    const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const gap = (maxX - minX - totalW) / (sorted.length - 1);
    let currX = minX;
    sorted.forEach((c) => {
      c.x = Math.round(currX);
      currX += c.width + gap;
    });
  } else if (type === 'distribute-v') {
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const totalH = sorted.reduce((sum, c) => sum + c.height, 0);
    const minY = sorted[0].y;
    const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const gap = (maxY - minY - totalH) / (sorted.length - 1);
    let currY = minY;
    sorted.forEach((c) => {
      c.y = Math.round(currY);
      currY += c.height + gap;
    });
  }
  recordStudioHistory();
};

// Group & Ungroup in Studio Canvas
const handleStudioGroup = () => {
  const targets = currentStudioChildren.value.filter(c => selectedStudioChildIds.value.includes(c.id) && !c.locked);
  if (targets.length < 2) return;

  const minX = Math.min(...targets.map(c => c.x));
  const minY = Math.min(...targets.map(c => c.y));
  const maxX = Math.max(...targets.map(c => c.x + c.width));
  const maxY = Math.max(...targets.map(c => c.y + c.height));
  const groupW = Math.max(10, maxX - minX);
  const groupH = Math.max(10, maxY - minY);
  const maxZ = Math.max(...targets.map(c => c.zIndex || 1));

  const relChildren = targets.map(c => ({
    ...JSON.parse(JSON.stringify(c)),
    x: c.x - minX,
    y: c.y - minY
  }));

  const groupComp: ScreenComponent = {
    id: `studio-group-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `组合 (${targets.length}项)`,
    type: 'composite-symbol',
    category: 'custom',
    x: minX,
    y: minY,
    width: groupW,
    height: groupH,
    rotation: 0,
    zIndex: maxZ,
    locked: false,
    visible: true,
    children: relChildren,
    style: {},
    data: { mapping: {} }
  };

  const removeIds = new Set(targets.map(c => c.id));
  const remaining = currentStudioChildren.value.filter(c => !removeIds.has(c.id));
  currentStudioChildren.value = [...remaining, groupComp];
  selectedStudioChildIds.value = [groupComp.id];
  recordStudioHistory();
};

const handleStudioUngroup = () => {
  if (selectedStudioChildIds.value.length !== 1) return;
  const target = currentStudioChildren.value.find(c => c.id === selectedStudioChildIds.value[0]);
  if (!target || !target.children || target.children.length === 0) return;

  const baseMinX = Math.min(...target.children.map(c => c.x));
  const baseMinY = Math.min(...target.children.map(c => c.y));
  const baseMaxX = Math.max(...target.children.map(c => c.x + c.width));
  const baseMaxY = Math.max(...target.children.map(c => c.y + c.height));
  const baseW = Math.max(1, baseMaxX - baseMinX);
  const baseH = Math.max(1, baseMaxY - baseMinY);

  const scaleX = target.width / baseW;
  const scaleY = target.height / baseH;

  const unpacked = target.children.map((c, idx) => ({
    ...JSON.parse(JSON.stringify(c)),
    id: `studio-ungroup-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    x: Math.round(target.x + c.x * scaleX),
    y: Math.round(target.y + c.y * scaleY),
    width: Math.max(8, Math.round(c.width * scaleX)),
    height: Math.max(6, Math.round(c.height * scaleY)),
    zIndex: (target.zIndex || 1) + idx
  }));

  const remaining = currentStudioChildren.value.filter(c => c.id !== target.id);
  currentStudioChildren.value = [...remaining, ...unpacked];
  selectedStudioChildIds.value = unpacked.map(c => c.id);
  recordStudioHistory();
};

// Context Menu Handlers in Studio Canvas
const handleStudioContextMenu = (e: MouseEvent, childId: string | null) => {
  e.preventDefault();
  e.stopPropagation();

  if (childId && !selectedStudioChildIds.value.includes(childId)) {
    selectedStudioChildIds.value = [childId];
  }

  const coords = getStudioCoords(e.clientX, e.clientY);
  studioContextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    canvasX: coords.x,
    canvasY: coords.y,
    targetChildId: childId
  };
};

const closeStudioContextMenu = () => {
  studioContextMenu.value.visible = false;
};

// Layer Operations inside Studio
const handleStudioLayerMove = (direction: 'front' | 'back' | 'up' | 'down') => {
  const ids = selectedStudioChildIds.value;
  if (ids.length === 0) return;

  const children = [...currentStudioChildren.value];
  if (direction === 'front') {
    const maxZ = Math.max(...children.map(c => c.zIndex || 1), 1);
    children.forEach(c => {
      if (ids.includes(c.id)) c.zIndex = maxZ + 2;
    });
  } else if (direction === 'back') {
    const minZ = Math.min(...children.map(c => c.zIndex || 1), 1);
    children.forEach(c => {
      if (ids.includes(c.id)) c.zIndex = Math.max(0, minZ - 1);
    });
  } else if (direction === 'up') {
    children.forEach(c => {
      if (ids.includes(c.id)) c.zIndex = (c.zIndex || 1) + 1;
    });
  } else if (direction === 'down') {
    children.forEach(c => {
      if (ids.includes(c.id)) c.zIndex = Math.max(0, (c.zIndex || 1) - 1);
    });
  }
  currentStudioChildren.value = children;
  recordStudioHistory();
};

// Copy / Paste / Duplicate / Delete in Studio
const handleStudioCopy = () => {
  if (selectedStudioChildren.value.length === 0) return;
  studioClipboard.value = JSON.parse(JSON.stringify(selectedStudioChildren.value));
};

const handleStudioCut = () => {
  if (selectedStudioChildren.value.length === 0) return;
  studioClipboard.value = JSON.parse(JSON.stringify(selectedStudioChildren.value));
  deleteSelectedStudioChildren();
};

const handleStudioPaste = () => {
  if (studioClipboard.value.length === 0) return;
  const newIds: string[] = [];
  const maxZ = currentStudioChildren.value.reduce((max, c) => Math.max(max, c.zIndex || 1), 0);

  const clones = studioClipboard.value.map((c, idx) => {
    const newId = `studio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}-${idx}`;
    newIds.push(newId);
    return {
      ...JSON.parse(JSON.stringify(c)),
      id: newId,
      name: `${c.name} (副本)`,
      x: c.x + 15,
      y: c.y + 15,
      zIndex: maxZ + 1 + idx
    };
  });

  currentStudioChildren.value.push(...clones);
  selectedStudioChildIds.value = newIds;
  recordStudioHistory();
};

const handleStudioDuplicate = () => {
  handleStudioCopy();
  handleStudioPaste();
};

const deleteSelectedStudioChildren = () => {
  if (selectedStudioChildIds.value.length === 0) return;
  currentStudioChildren.value = currentStudioChildren.value.filter(c => !selectedStudioChildIds.value.includes(c.id));
  selectedStudioChildIds.value = [];
  recordStudioHistory();
};

const toggleStudioLock = () => {
  const anyLocked = selectedStudioChildren.value.some(c => c.locked);
  selectedStudioChildren.value.forEach(c => {
    c.locked = !anyLocked;
  });
  recordStudioHistory();
};

const rotateStudioSelected = (angle: number) => {
  selectedStudioChildren.value.forEach(c => {
    if (!c.locked) {
      c.rotation = ((c.rotation || 0) + angle + 360) % 360;
    }
  });
  recordStudioHistory();
};

const flipStudioSelected = (axis: 'h' | 'v') => {
  selectedStudioChildren.value.forEach(c => {
    if (!c.locked) {
      c.style = {
        ...c.style,
        transform: axis === 'h' ? 'scaleX(-1)' : 'scaleY(-1)'
      };
    }
  });
  recordStudioHistory();
};

// Keyboard Shortcuts in Studio
const handleStudioKeyDown = (e: KeyboardEvent) => {
  if (activeView.value !== 'studio') return;
  const target = e.target as HTMLElement;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

  const isCtrlOrMeta = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // Undo (Ctrl+Z)
  if (isCtrlOrMeta && !e.shiftKey && key === 'z') {
    e.preventDefault();
    handleStudioUndo();
    return;
  }

  // Redo (Ctrl+Y or Ctrl+Shift+Z)
  if ((isCtrlOrMeta && key === 'y') || (isCtrlOrMeta && e.shiftKey && key === 'z')) {
    e.preventDefault();
    handleStudioRedo();
    return;
  }

  // Select all (Ctrl+A)
  if (isCtrlOrMeta && key === 'a') {
    e.preventDefault();
    selectedStudioChildIds.value = currentStudioChildren.value.map(c => c.id);
    return;
  }

  // Paste (Ctrl+V)
  if (isCtrlOrMeta && key === 'v') {
    e.preventDefault();
    handleStudioPaste();
    return;
  }

  // Escape to cancel drawing or clear selection
  if (e.key === 'Escape') {
    if (studioLineDrawing.value.active || studioPolylineDrawing.value.active) {
      cancelStudioDrawing();
    } else {
      selectedStudioChildIds.value = [];
    }
    return;
  }

  // Delete
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    deleteSelectedStudioChildren();
    return;
  }

  if (selectedStudioChildIds.value.length === 0) return;

  // Copy (Ctrl+C)
  if (isCtrlOrMeta && key === 'c') {
    e.preventDefault();
    handleStudioCopy();
    return;
  }

  // Cut (Ctrl+X)
  if (isCtrlOrMeta && key === 'x') {
    e.preventDefault();
    handleStudioCut();
    return;
  }

  // Duplicate (Ctrl+D)
  if (isCtrlOrMeta && key === 'd') {
    e.preventDefault();
    handleStudioDuplicate();
    return;
  }

  // Group (Ctrl+G)
  if (isCtrlOrMeta && !e.shiftKey && key === 'g') {
    if (selectedStudioChildIds.value.length >= 2) {
      e.preventDefault();
      handleStudioGroup();
      return;
    }
  }

  // Ungroup (Ctrl+Shift+G or Ctrl+U)
  if ((isCtrlOrMeta && e.shiftKey && key === 'g') || (isCtrlOrMeta && key === 'u')) {
    if (selectedStudioChildIds.value.length === 1) {
      e.preventDefault();
      handleStudioUngroup();
      return;
    }
  }

  // Arrow key nudges (1px or 10px with Shift)
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;

    selectedStudioChildren.value.forEach(c => {
      if (!c.locked) {
        c.x += dx;
        c.y += dy;
      }
    });
    recordStudioHistory();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleStudioKeyDown);
  window.addEventListener('click', closeStudioContextMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleStudioKeyDown);
  window.removeEventListener('click', closeStudioContextMenu);
});

// Studio Multi-State Management
const addStudioState = () => {
  const newNum = studioSymbol.value.states.length + 1;
  const defaultMatchVal = newNum === 1 ? '1' : (newNum === 2 ? '0' : String(newNum));
  const newState: CustomSymbolStateDef = {
    id: String(newNum),
    name: `状态 ${newNum} (${newNum === 2 ? '分闸/停运' : (newNum === 3 ? '故障/告警' : '运行')})`,
    matchValue: defaultMatchVal,
    children: JSON.parse(JSON.stringify(currentStudioChildren.value))
  };
  studioSymbol.value.states.push(newState);
  studioSymbol.value.activeStateId = newState.id;
  recordStudioHistory();
};

const deleteStudioState = (stateId: string) => {
  if (studioSymbol.value.states.length <= 1) {
    alert('必须保留至少一个状态');
    return;
  }
  studioSymbol.value.states = studioSymbol.value.states.filter(s => s.id !== stateId);
  studioSymbol.value.activeStateId = studioSymbol.value.states[0].id;
  recordStudioHistory();
};

// Open studio with new symbol
const handleCreateInStudio = () => {
  studioSymbol.value = {
    id: `symbol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: '新组装复合图元',
    category: 'electrical',
    description: '由基础图元组合而成的 SCADA 多态图元',
    width: 200,
    height: 240,
    backgroundColor: 'transparent',
    states: [
      {
        id: '1',
        name: '状态 1 (合闸 / 运行)',
        children: []
      }
    ],
    activeStateId: '1',
    tags: ['电力', '组合图元']
  };
  selectedStudioChildIds.value = [];
  activeView.value = 'studio';
  studioDrawTool.value = 'select';
  studioZoom.value = 1;
  studioHistoryStack.value = [];
  studioHistoryIndex.value = -1;
  recordStudioHistory();
};

// Open studio with existing symbol to edit
const handleEditSymbol = (sym: CustomSymbolDef) => {
  const states: CustomSymbolStateDef[] = sym.states && sym.states.length > 0 
    ? JSON.parse(JSON.stringify(sym.states))
    : [
        {
          id: '1',
          name: '状态 1 (默认)',
          children: sym.children ? JSON.parse(JSON.stringify(sym.children)) : []
        }
      ];

  studioSymbol.value = {
    id: sym.id,
    name: sym.name,
    category: sym.category || 'electrical',
    description: sym.description || '',
    width: sym.defaultWidth || 200,
    height: sym.defaultHeight || 240,
    backgroundColor: sym.defaultStyle?.fill || 'transparent',
    states,
    activeStateId: states[0].id,
    tags: sym.tags || []
  };

  selectedStudioChildIds.value = [];
  activeView.value = 'studio';
  studioDrawTool.value = 'select';
  studioZoom.value = 1;
  studioHistoryStack.value = [];
  studioHistoryIndex.value = -1;
  recordStudioHistory();
};

// Save assembled symbol
const handleSaveStudioSymbol = () => {
  if (!studioSymbol.value.name.trim()) {
    alert('请输入图元名称');
    return;
  }

  const def: CustomSymbolDef = {
    id: studioSymbol.value.id || `symbol-${Date.now()}`,
    name: studioSymbol.value.name.trim(),
    category: studioSymbol.value.category,
    iconName: studioSymbol.value.category === 'electrical' ? 'Zap' : 'Activity',
    description: studioSymbol.value.description.trim(),
    defaultWidth: studioSymbol.value.width,
    defaultHeight: studioSymbol.value.height,
    type: 'composite-symbol',
    defaultStyle: {
      fill: studioSymbol.value.backgroundColor,
      stroke: '#00f2ff',
      strokeWidth: 1.5,
      borderRadius: 4
    },
    children: studioSymbol.value.states[0]?.children || [],
    states: studioSymbol.value.states,
    activeStateId: studioSymbol.value.states[0]?.id || '1',
    tags: studioSymbol.value.tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  addCustomSymbol(def);
  loadSymbols();
  emit('update:symbols', symbols.value);
  activeView.value = 'library';
};

const handleDeleteSymbol = (id: string) => {
  if (confirm('确定要删除此自定义图元吗？')) {
    removeCustomSymbol(id);
    loadSymbols();
    emit('update:symbols', symbols.value);
  }
};
</script>

<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none"
    @click.self="emit('close')"
  >
    <div class="bg-[#070d1a] border border-cyan-500/40 rounded-2xl w-full max-w-7xl h-[92vh] shadow-[0_20px_70px_rgba(0,242,255,0.2)] overflow-hidden flex flex-col font-sans">
      
      <!-- Top Navigation Bar -->
      <div class="px-5 py-3 border-b border-cyan-500/20 bg-[#040813] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm">
            <Box class="w-5 h-5 text-cyan-400" />
            <span>SCADA 自定义图元资产库与专业工坊</span>
          </div>

          <!-- View Mode Selector -->
          <div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
            <button
              @click="activeView = 'library'"
              class="px-3 py-1 rounded transition-all cursor-pointer"
              :class="activeView === 'library' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
            >
              📚 图元资产库 ({{ symbols.length }})
            </button>
            <button
              @click="handleCreateInStudio"
              class="px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
              :class="activeView === 'studio' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>🛠️ 图元组装工坊</span>
            </button>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- ================= VIEW 1: ASSET LIBRARY ================= -->
      <div v-if="activeView === 'library'" class="flex-1 flex flex-col overflow-hidden p-5">
        <!-- Search & Filter Bar -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2">
            <div class="relative w-64">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                v-model="searchQuery"
                type="text"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-hidden"
                placeholder="搜索刀闸、断路器、变压器、水泵..."
              />
            </div>

            <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
              <button
                v-for="cat in [
                  { id: 'all', label: '全部' },
                  { id: 'electrical', label: '⚡ 电力系统' },
                  { id: 'industrial', label: '🏭 工业SCADA' },
                  { id: 'custom', label: '📦 自定义组合' }
                ]"
                :key="cat.id"
                @click="activeCategory = cat.id as any"
                class="px-2.5 py-1 rounded cursor-pointer transition-colors"
                :class="activeCategory === cat.id ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <button
            @click="handleCreateInStudio"
            class="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>新建组装图元</span>
          </button>
        </div>

        <!-- Symbol Cards Grid -->
        <div class="flex-1 overflow-y-auto grid grid-cols-3 gap-4 pr-1">
          <div
            v-for="sym in filteredSymbols"
            :key="sym.id"
            class="bg-[#091122] border border-cyan-500/20 hover:border-cyan-400 rounded-xl p-3 flex flex-col justify-between group transition-all relative"
          >
            <!-- Card Header -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  <Zap class="w-4 h-4" />
                </div>
                <div>
                  <div class="font-mono font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {{ sym.name }}
                  </div>
                  <div class="text-[10px] text-slate-500 font-mono">
                    {{ sym.defaultWidth }} × {{ sym.defaultHeight }} px | {{ sym.states?.length || 1 }} 个多态
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <button
                  @click="handleEditSymbol(sym)"
                  class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer"
                  title="在工坊中编辑此图元"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="handleDeleteSymbol(sym.id)"
                  class="p-1 rounded hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                  title="删除"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Mini Preview Box -->
            <div class="h-32 bg-[#040810] border border-slate-800/80 rounded-lg my-2 flex items-center justify-center relative overflow-hidden">
              <div
                class="relative pointer-events-none"
                :style="{
                  width: `${sym.defaultWidth}px`,
                  height: `${sym.defaultHeight}px`,
                  transform: `scale(${Math.min(1, 110 / Math.max(sym.defaultWidth, sym.defaultHeight))})`,
                  transformOrigin: 'center center'
                }"
              >
                <div
                  v-for="child in (sym.states?.[0]?.children || sym.children || [])"
                  :key="child.id"
                  class="absolute"
                  :style="{
                    left: `${child.x}px`,
                    top: `${child.y}px`,
                    width: `${child.width}px`,
                    height: `${child.height}px`,
                    transform: child.rotation ? `rotate(${child.rotation}deg)` : 'none'
                  }"
                >
                  <WidgetRenderer :component="child" />
                </div>
              </div>
            </div>

            <!-- Footer Action -->
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
              <span class="text-slate-400 truncate max-w-[140px]">{{ sym.description || '无描述' }}</span>
              <button
                @click="emit('use:symbol', sym); emit('close');"
                class="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-bold cursor-pointer transition-all"
              >
                插入到大屏
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= VIEW 2: VISUAL ASSEMBLY STUDIO ================= -->
      <div 
        v-else 
        class="flex-1 flex overflow-hidden relative"
        @mousemove="handleStudioMouseMove"
        @mouseup="handleStudioMouseUp"
      >
        <!-- Studio Left: Primitives Palette (No nesting of assets) -->
        <div class="w-60 bg-[#040812] border-r border-cyan-500/20 flex flex-col select-none">
          <!-- Material Header -->
          <div class="p-2.5 border-b border-slate-800 flex items-center justify-between bg-[#03060d]">
            <div class="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
              <Box class="w-3.5 h-3.5 text-cyan-400" />
              <span>📐 基础图元库</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">{{ studioPrimitives.length }}种图元</span>
          </div>

          <!-- Primitives List -->
          <div class="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            <div class="text-[10px] text-slate-500 font-mono px-1">点击或拖拽放入中央画布</div>
            <div
              v-for="prim in studioPrimitives"
              :key="prim.type + prim.name"
              draggable="true"
              @dragstart="handleStudioPaletteDragStart($event, prim)"
              @click="addPrimitiveToStudio(prim)"
              class="w-full p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-2 text-left cursor-grab active:cursor-grabbing transition-all text-slate-200 group"
            >
              <div class="p-1.5 rounded bg-slate-950 text-cyan-400 group-hover:scale-105 transition-transform">
                <component :is="prim.icon || Box" class="w-3.5 h-3.5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-mono font-semibold truncate">{{ prim.name }}</div>
                <div class="text-[9px] text-slate-500 font-mono">{{ prim.defaultW }} × {{ prim.defaultH }}</div>
              </div>
              <Plus class="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300" />
            </div>
          </div>
        </div>

        <!-- Studio Center: Interactive Canvas & Full Toolbar -->
        <div class="flex-1 min-w-0 flex flex-col bg-[#02050b] relative overflow-hidden">
          
          <!-- Top Tool & Alignment Bar (Matching Main Editor Toolbar) -->
          <div class="px-4 py-2 border-b border-slate-800 bg-[#050914] flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <!-- Left: Drawing Tools & Undo/Redo -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- Undo / Redo -->
              <div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  @click="handleStudioUndo"
                  :disabled="studioHistoryIndex <= 0"
                  class="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="撤销 (Ctrl+Z)"
                >
                  <Undo class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="handleStudioRedo"
                  :disabled="studioHistoryIndex >= studioHistoryStack.length - 1"
                  class="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="重做 (Ctrl+Y)"
                >
                  <Redo class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Drawing Tools Switcher -->
              <div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono shrink-0">
                <button
                  @click="studioDrawTool = 'select'"
                  class="px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  :class="studioDrawTool === 'select' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                  title="自由选择与多选框选"
                >
                  <MousePointer class="w-3.5 h-3.5" />
                  <span>选择</span>
                </button>
                <button
                  @click="studioDrawTool = 'draw-line'"
                  class="px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  :class="studioDrawTool === 'draw-line' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,242,255,0.4)]' : 'text-slate-400 hover:text-white'"
                  title="拉直线走线"
                >
                  <Minus class="w-3.5 h-3.5" />
                  <span>直线</span>
                </button>
                <button
                  @click="studioDrawTool = 'draw-polyline'"
                  class="px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  :class="studioDrawTool === 'draw-polyline' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,242,255,0.4)]' : 'text-slate-400 hover:text-white'"
                  title="折线走线"
                >
                  <Workflow class="w-3.5 h-3.5" />
                  <span>折线</span>
                </button>
              </div>

              <!-- Group / Ungroup Quick Buttons -->
              <div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs gap-1">
                <button 
                  v-if="selectedStudioChildIds.length >= 2"
                  @click="handleStudioGroup"
                  class="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer flex items-center gap-1"
                  title="组合所选图元 (Ctrl+G)"
                >
                  <span>🧩 组合</span>
                </button>
                <button 
                  v-if="selectedStudioChildIds.length === 1 && (primarySelectedStudioChild?.children?.length || primarySelectedStudioChild?.type === 'composite-symbol')"
                  @click="handleStudioUngroup"
                  class="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-500/40 hover:bg-amber-900 cursor-pointer flex items-center gap-1"
                  title="取消组合 (Ctrl+U)"
                >
                  <span>🔓 解组</span>
                </button>
              </div>

              <!-- Alignment Bar (When >=2 elements selected) -->
              <div v-if="selectedStudioChildIds.length >= 2" class="flex items-center bg-slate-900 border border-cyan-500/40 p-0.5 rounded-lg text-xs gap-0.5">
                <button @click="handleStudioAlign('left')" class="p-1 text-slate-300 hover:text-cyan-300 cursor-pointer" title="左对齐"><AlignLeft class="w-3.5 h-3.5" /></button>
                <button @click="handleStudioAlign('center')" class="p-1 text-slate-300 hover:text-cyan-300 cursor-pointer" title="水平居中"><AlignCenter class="w-3.5 h-3.5" /></button>
                <button @click="handleStudioAlign('right')" class="p-1 text-slate-300 hover:text-cyan-300 cursor-pointer" title="右对齐"><AlignRight class="w-3.5 h-3.5" /></button>
                <div class="w-px h-3 bg-slate-700 mx-0.5" />
                <button @click="handleStudioAlign('top')" class="p-1 text-slate-300 hover:text-cyan-300 cursor-pointer" title="顶对齐"><AlignVerticalJustifyStart class="w-3.5 h-3.5" /></button>
                <button @click="handleStudioAlign('middle')" class="p-1 text-slate-300 hover:text-cyan-300 cursor-pointer" title="垂直居中"><AlignVerticalJustifyCenter class="w-3.5 h-3.5" /></button>
                <button @click="handleStudioAlign('bottom')" class="p-1 text-slate-300 hover:text-cyan-300 cursor-pointer" title="底对齐"><AlignVerticalJustifyEnd class="w-3.5 h-3.5" /></button>
              </div>

              <!-- Canvas Zoom Controls -->
              <div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
                <button @click="studioZoom = Math.max(0.4, Number((studioZoom - 0.1).toFixed(1)))" class="p-1 text-slate-400 hover:text-white cursor-pointer" title="缩小"><ZoomOut class="w-3.5 h-3.5" /></button>
                <span class="px-1.5 text-[11px] text-cyan-300 font-bold">{{ Math.round(studioZoom * 100) }}%</span>
                <button @click="studioZoom = Math.min(2.5, Number((studioZoom + 0.1).toFixed(1)))" class="p-1 text-slate-400 hover:text-white cursor-pointer" title="放大"><ZoomIn class="w-3.5 h-3.5" /></button>
                <button @click="studioZoom = 1" class="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white cursor-pointer" title="重置100%">100%</button>
              </div>
            </div>

            <!-- Right: States & Dimension Control -->
            <div class="flex items-center gap-3 shrink-0">
              <!-- State Switcher with matchValue badges -->
              <div class="flex items-center gap-1 font-mono text-xs overflow-x-auto max-w-[380px] custom-scrollbar py-0.5">
                <span class="text-slate-400 font-bold shrink-0">状态:</span>
                <button
                  v-for="st in studioSymbol.states"
                  :key="st.id"
                  @click="studioSymbol.activeStateId = st.id"
                  class="px-2 py-0.5 rounded text-xs font-mono cursor-pointer border transition-all shrink-0 flex items-center gap-1 whitespace-nowrap"
                  :class="studioSymbol.activeStateId === st.id 
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-400 font-bold' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'"
                >
                  <span>{{ st.name }}</span>
                  <span class="px-1 py-0.2 text-[9px] rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30" title="绑定触发值">
                    ={{ st.matchValue ?? st.id }}
                  </span>
                </button>
                <button
                  @click="addStudioState"
                  class="px-2 py-0.5 rounded text-xs font-mono bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-slate-800 cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                  title="添加新状态 (如状态2/分闸，状态3/告警)"
                >
                  <Plus class="w-3 h-3" />
                  <span>加状态</span>
                </button>
              </div>

              <!-- Dimensions -->
              <div class="flex items-center gap-1 font-mono text-xs border-l border-slate-800 pl-3 shrink-0">
                <span class="text-slate-400">画布尺寸:</span>
                <input
                  v-model.number="studioSymbol.width"
                  type="number"
                  class="w-13 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-cyan-300 font-mono text-center"
                />
                <span class="text-slate-500">×</span>
                <input
                  v-model.number="studioSymbol.height"
                  type="number"
                  class="w-13 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-cyan-300 font-mono text-center"
                />
              </div>
            </div>
          </div>

          <!-- Assembly Stage Center Canvas -->
          <div 
            ref="studioWorkspaceRef"
            class="flex-1 flex items-center justify-center p-8 overflow-auto relative custom-scrollbar select-none"
            @click.self="selectedStudioChildIds = []"
            @contextmenu.prevent="handleStudioContextMenu($event, null)"
          >
            <!-- Canvas Container -->
            <div
              ref="studioCanvasRef"
              @dragover.prevent
              @drop="handleStudioCanvasDrop"
              @mousedown="handleStudioCanvasMouseDown"
              @click="handleStudioCanvasClick"
              @dblclick="handleStudioCanvasDblClick"
              class="relative shadow-[0_15px_50px_rgba(0,0,0,0.8)] border border-cyan-500/40 rounded-xs transition-transform studio-canvas-bg"
              :class="{
                'cursor-crosshair': studioDrawTool !== 'select',
                'cursor-default': studioDrawTool === 'select'
              }"
              :style="{
                width: `${studioSymbol.width}px`,
                height: `${studioSymbol.height}px`,
                backgroundColor: studioSymbol.backgroundColor || '#040810',
                backgroundImage: 'radial-gradient(circle, rgba(0, 242, 255, 0.15) 1px, transparent 1px)',
                backgroundSize: '15px 15px',
                transform: `scale(${studioZoom})`,
                transformOrigin: 'center center'
              }"
            >
              <!-- Children Elements inside Active State -->
              <div
                v-for="child in currentStudioChildren"
                :key="child.id"
                @mousedown.stop="handleStudioChildMouseDown($event, child)"
                @click.stop="handleStudioChildClick($event, child)"
                @contextmenu.stop="handleStudioContextMenu($event, child.id)"
                class="absolute group"
                :class="studioDrawTool === 'select' ? 'cursor-move' : 'cursor-crosshair pointer-events-none'"
                :style="{
                  left: `${child.x}px`,
                  top: `${child.y}px`,
                  width: `${child.width}px`,
                  height: `${child.height}px`,
                  transform: child.rotation ? `rotate(${child.rotation}deg)` : 'none',
                  zIndex: child.zIndex || 1
                }"
              >
                <WidgetRenderer :component="child" />

                <!-- Selection Box & Resizers inside Studio -->
                <div
                  v-if="selectedStudioChildIds.includes(child.id) && studioDrawTool === 'select'"
                  class="absolute -inset-0.5 border-2 border-cyan-400 pointer-events-none rounded-xs z-30 shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                >
                  <!-- 8 Resizers (Only shown for primary selected when 1 item selected) -->
                  <template v-if="selectedStudioChildIds.length === 1 && !child.locked">
                    <div @mousedown.stop="handleStudioStartResize($event, 'nw')" class="pointer-events-auto absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-nwse-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 'ne')" class="pointer-events-auto absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-nesw-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 'se')" class="pointer-events-auto absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-nwse-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 'sw')" class="pointer-events-auto absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-nesw-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 'e')" class="pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-ew-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 's')" class="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-ns-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 'w')" class="pointer-events-auto absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-ew-resize shadow" />
                    <div @mousedown.stop="handleStudioStartResize($event, 'n')" class="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-ns-resize shadow" />
                  </template>
                </div>
              </div>

              <!-- Marquee Selection Box Layer -->
              <div
                v-if="isStudioMarquee && hasMovedStudioMarquee"
                class="absolute border border-cyan-400 bg-cyan-500/15 pointer-events-none z-50 rounded-xs"
                :style="{
                  left: `${studioMarqueeBox.x}px`,
                  top: `${studioMarqueeBox.y}px`,
                  width: `${studioMarqueeBox.width}px`,
                  height: `${studioMarqueeBox.height}px`
                }"
              />

              <!-- Live Drawing Preview Layer: Straight Line -->
              <svg 
                v-if="studioDrawTool === 'draw-line' && studioLineDrawing.active" 
                class="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-visible"
              >
                <line
                  :x1="studioLineDrawing.startX"
                  :y1="studioLineDrawing.startY"
                  :x2="studioLineDrawing.currentX"
                  :y2="studioLineDrawing.currentY"
                  stroke="#00f2ff"
                  stroke-width="3"
                  stroke-dasharray="6,4"
                  class="animate-pulse"
                />
                <circle :cx="studioLineDrawing.startX" :cy="studioLineDrawing.startY" r="4" fill="#00f2ff" />
                <circle :cx="studioLineDrawing.currentX" :cy="studioLineDrawing.currentY" r="4" fill="#00f2ff" />
              </svg>

              <!-- Live Drawing Preview Layer: Polyline -->
              <svg 
                v-if="studioDrawTool === 'draw-polyline' && studioPolylineDrawing.active" 
                class="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-visible"
              >
                <polyline
                  :points="[...studioPolylineDrawing.points, { x: studioPolylineDrawing.currentX, y: studioPolylineDrawing.currentY }].map(p => `${p.x},${p.y}`).join(' ')"
                  fill="none"
                  stroke="#00f2ff"
                  stroke-width="3"
                  stroke-dasharray="6,4"
                  class="animate-pulse"
                />
                <circle
                  v-for="(pt, idx) in studioPolylineDrawing.points"
                  :key="idx"
                  :cx="pt.x"
                  :cy="pt.y"
                  r="4"
                  fill="#00f2ff"
                />
                <circle :cx="studioPolylineDrawing.currentX" :cy="studioPolylineDrawing.currentY" r="4" fill="#10b981" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Studio Right: Rich Property Inspector (Complete Graphic Styles) -->
        <div class="w-80 bg-[#040812] border-l border-cyan-500/20 flex flex-col select-none overflow-y-auto p-4 space-y-4 font-mono text-xs custom-scrollbar shrink-0">
          <!-- Symbol Metadata Section -->
          <div class="space-y-2 border-b border-slate-800 pb-3">
            <div class="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">图元基础属性</div>
            <div>
              <label class="block text-[10px] text-slate-400 mb-1">图元名称</label>
              <input
                v-model="studioSymbol.name"
                type="text"
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          <!-- Multi-State Configuration & MatchValue Bindings -->
          <div class="space-y-2.5 border-b border-slate-800 pb-3">
            <div class="flex items-center justify-between text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
              <span>状态与遥信绑定值 ({{ studioSymbol.states.length }}态)</span>
              <button
                @click="addStudioState"
                class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 cursor-pointer flex items-center gap-1"
                title="新增状态"
              >
                <Plus class="w-3 h-3" />
                <span>加状态</span>
              </button>
            </div>

            <!-- State List Cards -->
            <div class="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              <div
                v-for="st in studioSymbol.states"
                :key="st.id"
                @click="studioSymbol.activeStateId = st.id"
                class="p-2 rounded-lg border cursor-pointer transition-all space-y-1.5"
                :class="studioSymbol.activeStateId === st.id 
                  ? 'bg-cyan-950/70 border-cyan-400/80 shadow-[0_0_10px_rgba(0,242,255,0.15)]' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'"
              >
                <div class="flex items-center justify-between gap-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="w-2 h-2 rounded-full" :class="studioSymbol.activeStateId === st.id ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'" />
                    <input
                      v-model="st.name"
                      @click.stop
                      type="text"
                      class="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-hidden w-36 truncate"
                      placeholder="状态名称"
                    />
                  </div>
                  <button
                    v-if="studioSymbol.states.length > 1"
                    @click.stop="deleteStudioState(st.id)"
                    class="p-1 rounded text-red-400 hover:bg-red-950/80 cursor-pointer shrink-0"
                    title="删除该状态"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>

                <!-- Match Value input for telemetry binding -->
                <div class="flex items-center justify-between gap-2 bg-slate-950/80 p-1.5 rounded border border-slate-800/80" @click.stop>
                  <label class="text-[10px] text-slate-400 shrink-0">绑定遥信/状态值:</label>
                  <div class="flex items-center gap-1 flex-1 min-w-0">
                    <input
                      v-model="st.matchValue"
                      type="text"
                      class="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-hidden text-center"
                      placeholder="如 1, 0, closed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Child Element Property Configuration -->
          <div v-if="primarySelectedStudioChild" class="space-y-3">
            <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
              <span class="truncate">元件: {{ primarySelectedStudioChild.name }}</span>
              <div class="flex items-center gap-1">
                <button
                  @click="toggleStudioLock"
                  class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  :title="primarySelectedStudioChild.locked ? '解锁元件' : '锁定元件'"
                >
                  <Lock v-if="primarySelectedStudioChild.locked" class="w-3.5 h-3.5 text-amber-400" />
                  <Unlock v-else class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="deleteSelectedStudioChildren"
                  class="p-1 rounded bg-red-950/80 text-red-400 hover:bg-red-900 cursor-pointer shrink-0"
                  title="删除元件"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Position & Size Precision -->
            <div class="grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div>
                <label class="block text-[9px] text-slate-400">X (坐标)</label>
                <input v-model.number="primarySelectedStudioChild.x" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">Y (坐标)</label>
                <input v-model.number="primarySelectedStudioChild.y" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">宽 (W)</label>
                <input v-model.number="primarySelectedStudioChild.width" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">高 (H)</label>
                <input v-model.number="primarySelectedStudioChild.height" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">旋转角度 (°)</label>
                <input v-model.number="primarySelectedStudioChild.rotation" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">图层 (Z)</label>
                <input v-model.number="primarySelectedStudioChild.zIndex" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
            </div>

            <!-- Stroke Color & Width -->
            <div class="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div class="text-[10px] font-bold text-cyan-300">线条与边框样式</div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">线条 / 边框颜色</label>
                <div class="flex items-center gap-2">
                  <input v-model="primarySelectedStudioChild.style.stroke" type="color" class="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <input v-model="primarySelectedStudioChild.style.stroke" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
                </div>
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">线宽 ({{ primarySelectedStudioChild.style.strokeWidth || 2 }}px)</label>
                <input v-model.number="primarySelectedStudioChild.style.strokeWidth" type="range" min="1" max="20" class="w-full accent-cyan-400" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">虚实线型</label>
                <select v-model="primarySelectedStudioChild.style.lineStyle" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300">
                  <option value="solid">实线 (Solid)</option>
                  <option value="dashed">虚线 (Dashed)</option>
                  <option value="dotted">点状线 (Dotted)</option>
                </select>
              </div>
            </div>

            <!-- Fill Background Color (for shapes) -->
            <div class="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div class="text-[10px] font-bold text-cyan-300">填充背景与圆角</div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">背景填充色</label>
                <div class="flex items-center gap-2">
                  <input v-model="primarySelectedStudioChild.style.fill" type="color" class="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <input v-model="primarySelectedStudioChild.style.fill" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
                </div>
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">透明度 ({{ Math.round((primarySelectedStudioChild.style.opacity ?? 1) * 100) }}%)</label>
                <input v-model.number="primarySelectedStudioChild.style.opacity" type="range" min="0.1" max="1" step="0.05" class="w-full accent-cyan-400" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">圆角弧度: {{ primarySelectedStudioChild.style.borderRadius || 0 }}px</label>
                <input v-model.number="primarySelectedStudioChild.style.borderRadius" type="range" min="0" max="30" class="w-full accent-cyan-400" />
              </div>
            </div>

            <!-- Text & Metric Specific Properties -->
            <div v-if="primarySelectedStudioChild.type === 'draw-text' || primarySelectedStudioChild.type === 'metric-float' || primarySelectedStudioChild.type === 'ctrl-button'" class="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div class="text-[10px] font-bold text-cyan-300">文本与数值配置</div>
              <div v-if="primarySelectedStudioChild.type === 'draw-text'">
                <label class="block text-[9px] text-slate-400 mb-1">文本内容</label>
                <input v-model="primarySelectedStudioChild.name" type="text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
              </div>
              <div v-if="primarySelectedStudioChild.type === 'ctrl-button'">
                <label class="block text-[9px] text-slate-400 mb-1">按钮文字</label>
                <input v-model="primarySelectedStudioChild.style.buttonText" type="text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
              </div>
              <div v-if="primarySelectedStudioChild.type === 'metric-float'" class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[9px] text-slate-400 mb-1">小数位数</label>
                  <input v-model.number="primarySelectedStudioChild.style.decimals" type="number" min="0" max="4" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-cyan-300" />
                </div>
                <div>
                  <label class="block text-[9px] text-slate-400 mb-1">单位后缀</label>
                  <input v-model="primarySelectedStudioChild.style.suffix" type="text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-cyan-300" />
                </div>
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">字号大小: {{ primarySelectedStudioChild.style.fontSize || 14 }}px</label>
                <input v-model.number="primarySelectedStudioChild.style.fontSize" type="range" min="10" max="36" class="w-full accent-cyan-400" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">文字颜色</label>
                <div class="flex items-center gap-2">
                  <input v-model="primarySelectedStudioChild.style.textColor" type="color" class="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <input v-model="primarySelectedStudioChild.style.textColor" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedStudioChildIds.length > 1" class="text-cyan-300 text-center py-6 text-xs bg-slate-900/40 rounded-lg p-3 border border-slate-800 space-y-2">
            <div class="font-bold">已多选 {{ selectedStudioChildIds.length }} 个元件</div>
            <div class="text-[10px] text-slate-400">使用上方工具条或右键菜单进行批量对齐、排列与图层操作</div>
          </div>

          <div v-else class="text-slate-500 text-center py-8 text-xs">
            在中央画布中点击或框选元件进行参数微调
          </div>
        </div>
      </div>

      <!-- Studio Footer Action Buttons -->
      <div v-if="activeView === 'studio'" class="px-5 py-3 border-t border-cyan-500/20 bg-[#040813] flex items-center justify-between">
        <button
          @click="activeView = 'library'"
          class="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-mono cursor-pointer"
        >
          返回资产库
        </button>

        <div class="flex items-center gap-2">
          <button
            @click="handleSaveStudioSymbol"
            class="px-5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)]"
          >
            <Check class="w-4 h-4" />
            <span>保存图元到资产库</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Right-Click Context Menu in Studio -->
    <div
      v-if="studioContextMenu.visible"
      class="fixed z-50 bg-[#070e1c] border border-cyan-500/40 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] py-1.5 min-w-44 text-xs font-mono text-slate-200 divide-y divide-slate-800/80 select-none backdrop-blur-md"
      :style="{ left: `${studioContextMenu.x}px`, top: `${studioContextMenu.y}px` }"
      @click.stop
    >
      <!-- Edit Actions -->
      <div class="py-1">
        <button
          @click="handleStudioCopy(); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><Copy class="w-3.5 h-3.5" /> 复制</span>
          <span class="text-[10px] text-slate-500">Ctrl+C</span>
        </button>
        <button
          @click="handleStudioCut(); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><Scissors class="w-3.5 h-3.5" /> 剪切</span>
          <span class="text-[10px] text-slate-500">Ctrl+X</span>
        </button>
        <button
          @click="handleStudioPaste(); closeStudioContextMenu();"
          :disabled="studioClipboard.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><CornerUpRight class="w-3.5 h-3.5" /> 粘贴</span>
          <span class="text-[10px] text-slate-500">Ctrl+V</span>
        </button>
        <button
          @click="handleStudioDuplicate(); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><Layers class="w-3.5 h-3.5" /> 副本克隆</span>
          <span class="text-[10px] text-slate-500">Ctrl+D</span>
        </button>
      </div>

      <!-- Group / Ungroup Actions in Studio -->
      <div v-if="selectedStudioChildIds.length >= 2 || (selectedStudioChildIds.length === 1 && (primarySelectedStudioChild?.children?.length || primarySelectedStudioChild?.type === 'composite-symbol'))" class="py-1">
        <button
          v-if="selectedStudioChildIds.length >= 2"
          @click="handleStudioGroup(); closeStudioContextMenu();"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 text-cyan-300 flex items-center justify-between cursor-pointer"
        >
          <span class="flex items-center gap-2">🧩 组合图元</span>
          <span class="text-[10px] text-cyan-500">Ctrl+G</span>
        </button>
        <button
          v-if="selectedStudioChildIds.length === 1 && (primarySelectedStudioChild?.children?.length || primarySelectedStudioChild?.type === 'composite-symbol')"
          @click="handleStudioUngroup(); closeStudioContextMenu();"
          class="w-full px-3 py-1.5 text-left hover:bg-amber-950/60 text-amber-300 flex items-center justify-between cursor-pointer"
        >
          <span class="flex items-center gap-2">🔓 取消组合</span>
          <span class="text-[10px] text-amber-500">Ctrl+U</span>
        </button>
      </div>

      <!-- Layer Actions -->
      <div class="py-1">
        <button
          @click="handleStudioLayerMove('front'); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><ChevronsUp class="w-3.5 h-3.5" /> 置于顶层</span>
          <span class="text-[10px] text-slate-500">Ctrl+Shift+]</span>
        </button>
        <button
          @click="handleStudioLayerMove('up'); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><ArrowUp class="w-3.5 h-3.5" /> 上移一层</span>
          <span class="text-[10px] text-slate-500">Ctrl+]</span>
        </button>
        <button
          @click="handleStudioLayerMove('down'); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><ArrowDown class="w-3.5 h-3.5" /> 下移一层</span>
          <span class="text-[10px] text-slate-500">Ctrl+[</span>
        </button>
        <button
          @click="handleStudioLayerMove('back'); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><ChevronsDown class="w-3.5 h-3.5" /> 置于底层</span>
          <span class="text-[10px] text-slate-500">Ctrl+Shift+[</span>
        </button>
      </div>

      <!-- Transform & Lock Actions -->
      <div class="py-1">
        <button
          @click="rotateStudioSelected(90); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><RotateCw class="w-3.5 h-3.5" /> 顺时针旋转90°</span>
        </button>
        <button
          @click="toggleStudioLock(); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-cyan-950/60 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><Lock class="w-3.5 h-3.5" /> 锁定 / 解锁</span>
        </button>
      </div>

      <!-- Delete Action -->
      <div class="py-1">
        <button
          @click="deleteSelectedStudioChildren(); closeStudioContextMenu();"
          :disabled="selectedStudioChildIds.length === 0"
          class="w-full px-3 py-1.5 text-left hover:bg-red-950/60 text-red-400 hover:text-red-300 flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span class="flex items-center gap-2"><Trash2 class="w-3.5 h-3.5" /> 删除所选项</span>
          <span class="text-[10px] text-red-500">Del</span>
        </button>
      </div>
    </div>
  </div>
</template>
