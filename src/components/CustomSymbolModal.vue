<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { CustomSymbolDef, CustomSymbolStateDef, ScreenComponent, ComponentType } from '../types';
import { getCustomSymbols, saveCustomSymbols, addCustomSymbol, removeCustomSymbol } from '../utils/customSymbolStorage';
import WidgetRenderer from './widgets/WidgetRenderer.vue';
import { 
  Plus, Trash2, Edit2, Copy, Sparkles, Box, Check, X, 
  Zap, Layers, Upload, Download, Tag, Search,
  Square, Circle, MoveRight, Type, Minus, Workflow,
  ToggleRight, CircleDot, Activity, Cpu, Binary, Eye,
  ArrowUp, ArrowDown, Grid, Undo, RefreshCw, RotateCw,
  SlidersHorizontal, BookmarkPlus, Hexagon, Star, MousePointer
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

const selectedStudioChildId = ref<string | null>(null);

const selectedStudioChild = computed(() => {
  return currentStudioChildren.value.find(c => c.id === selectedStudioChildId.value) || null;
});

// Dragging inside Studio Canvas
const isStudioDragging = ref(false);
const studioDragStart = ref({ mouseX: 0, mouseY: 0, compX: 0, compY: 0 });

// Resizing inside Studio Canvas
const isStudioResizing = ref(false);
const studioResizeHandle = ref<string | null>(null);
const studioResizeStart = ref({ mouseX: 0, mouseY: 0, x: 0, y: 0, width: 0, height: 0 });

// Studio Canvas DOM Ref
const studioCanvasRef = ref<HTMLElement | null>(null);

// Primitives available in Studio Palette (Pure geometric shapes, lines, text, controls, indicators, float meters)
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

// Helper to convert studio canvas screen coords
const getStudioCoords = (clientX: number, clientY: number) => {
  if (!studioCanvasRef.value) return { x: 0, y: 0 };
  const rect = studioCanvasRef.value.getBoundingClientRect();
  const rawX = clientX - rect.left;
  const rawY = clientY - rect.top;
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
      selectedStudioChildId.value = newComp.id;
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
      selectedStudioChildId.value = newComp.id;
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
  selectedStudioChildId.value = newComp.id;
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
  selectedStudioChildId.value = newComp.id;
};

// Studio Canvas Click Handler (Supports interactive line/polyline drawing!)
const handleStudioCanvasClick = (e: MouseEvent) => {
  const coords = getStudioCoords(e.clientX, e.clientY);

  // 1. Draw Straight Line Mode (单击一次起点，再次单击落点完成)
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
      selectedStudioChildId.value = newComp.id;
      studioLineDrawing.value.active = false;
      studioDrawTool.value = 'select';
    }
    return;
  }

  // 2. Draw Polyline Mode (单击确定起点与拐点，双击结束)
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

  // Deselect if clicked empty canvas area
  selectedStudioChildId.value = null;
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
      selectedStudioChildId.value = newComp.id;
    }

    studioPolylineDrawing.value.active = false;
    studioPolylineDrawing.value.points = [];
    studioDrawTool.value = 'select';
  }
};

// Finish polyline manually via button
const finishStudioPolyline = () => {
  if (studioPolylineDrawing.value.points.length >= 2) {
    const pts = studioPolylineDrawing.value.points;
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
    selectedStudioChildId.value = newComp.id;
  }
  studioPolylineDrawing.value.active = false;
  studioPolylineDrawing.value.points = [];
  studioDrawTool.value = 'select';
};

// Cancel drawing mode
const cancelStudioDrawing = () => {
  studioLineDrawing.value.active = false;
  studioPolylineDrawing.value.active = false;
  studioPolylineDrawing.value.points = [];
  studioDrawTool.value = 'select';
};

// Studio Canvas Mouse Events (Moving / Dragging / Resizing / Drawing Preview)
const handleStudioChildMouseDown = (e: MouseEvent, comp: ScreenComponent) => {
  if (e.button !== 0) return;
  if (studioDrawTool.value !== 'select') return; // let canvas handle drawing
  e.stopPropagation();
  selectedStudioChildId.value = comp.id;

  isStudioDragging.value = true;
  studioDragStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    compX: comp.x,
    compY: comp.y
  };
};

const handleStudioChildClick = (e: MouseEvent, comp: ScreenComponent) => {
  if (studioDrawTool.value !== 'select') return;
  e.stopPropagation();
  selectedStudioChildId.value = comp.id;
};

const handleStudioMouseMove = (e: MouseEvent) => {
  // Update live coordinates for drawing tools
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
  }

  // Dragging Child
  if (isStudioDragging.value && selectedStudioChild.value) {
    const dx = e.clientX - studioDragStart.value.mouseX;
    const dy = e.clientY - studioDragStart.value.mouseY;
    selectedStudioChild.value.x = Math.round(studioDragStart.value.compX + dx);
    selectedStudioChild.value.y = Math.round(studioDragStart.value.compY + dy);
  }

  // Resizing Child
  if (isStudioResizing.value && selectedStudioChild.value && studioResizeHandle.value) {
    const dx = e.clientX - studioResizeStart.value.mouseX;
    const dy = e.clientY - studioResizeStart.value.mouseY;
    const handle = studioResizeHandle.value;

    if (handle.includes('e')) selectedStudioChild.value.width = Math.max(10, Math.round(studioResizeStart.value.width + dx));
    if (handle.includes('s')) selectedStudioChild.value.height = Math.max(6, Math.round(studioResizeStart.value.height + dy));
    if (handle.includes('w')) {
      const potW = studioResizeStart.value.width - dx;
      if (potW >= 10) {
        selectedStudioChild.value.width = Math.round(potW);
        selectedStudioChild.value.x = Math.round(studioResizeStart.value.x + dx);
      }
    }
    if (handle.includes('n')) {
      const potH = studioResizeStart.value.height - dy;
      if (potH >= 6) {
        selectedStudioChild.value.height = Math.round(potH);
        selectedStudioChild.value.y = Math.round(studioResizeStart.value.y + dy);
      }
    }
  }
};

const handleStudioMouseUp = () => {
  isStudioDragging.value = false;
  isStudioResizing.value = false;
  studioResizeHandle.value = null;
};

const handleStudioStartResize = (e: MouseEvent, handle: string) => {
  e.stopPropagation();
  e.preventDefault();
  if (!selectedStudioChild.value) return;

  isStudioResizing.value = true;
  studioResizeHandle.value = handle;
  studioResizeStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    x: selectedStudioChild.value.x,
    y: selectedStudioChild.value.y,
    width: selectedStudioChild.value.width,
    height: selectedStudioChild.value.height
  };
};

const deleteStudioChild = (id: string) => {
  currentStudioChildren.value = currentStudioChildren.value.filter(c => c.id !== id);
  if (selectedStudioChildId.value === id) {
    selectedStudioChildId.value = null;
  }
};

// Studio Multi-State Management
const addStudioState = () => {
  const newNum = studioSymbol.value.states.length + 1;
  const defaultMatchVal = newNum === 1 ? '1' : (newNum === 2 ? '0' : String(newNum));
  const newState: CustomSymbolStateDef = {
    id: String(newNum),
    name: `状态 ${newNum} (${newNum === 2 ? '分闸/停运' : (newNum === 3 ? '故障/告警' : '运行')})`,
    matchValue: defaultMatchVal,
    // Copy current state's children as template
    children: JSON.parse(JSON.stringify(currentStudioChildren.value))
  };
  studioSymbol.value.states.push(newState);
  studioSymbol.value.activeStateId = newState.id;
};

const deleteStudioState = (stateId: string) => {
  if (studioSymbol.value.states.length <= 1) {
    alert('必须保留至少一个状态');
    return;
  }
  studioSymbol.value.states = studioSymbol.value.states.filter(s => s.id !== stateId);
  studioSymbol.value.activeStateId = studioSymbol.value.states[0].id;
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
  selectedStudioChildId.value = null;
  activeView.value = 'studio';
  studioDrawTool.value = 'select';
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

  selectedStudioChildId.value = null;
  activeView.value = 'studio';
  studioDrawTool.value = 'select';
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
    <div class="bg-[#070d1a] border border-cyan-500/40 rounded-2xl w-full max-w-6xl h-[90vh] shadow-[0_20px_70px_rgba(0,242,255,0.2)] overflow-hidden flex flex-col font-sans">
      
      <!-- Top Navigation Bar -->
      <div class="px-5 py-3 border-b border-cyan-500/20 bg-[#040813] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm">
            <Box class="w-5 h-5 text-cyan-400" />
            <span>SCADA 自定义图元资产库与组装工坊</span>
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
        class="flex-1 flex overflow-hidden"
        @mousemove="handleStudioMouseMove"
        @mouseup="handleStudioMouseUp"
      >
        <!-- Studio Left: Primitives & Sub-symbols Palette -->
        <div class="w-60 bg-[#040812] border-r border-cyan-500/20 flex flex-col select-none">
          <!-- Material Switcher Tabs -->
          <div class="p-2 border-b border-slate-800 flex items-center gap-1 bg-[#03060d]">
            <button
              @click="studioMaterialTab = 'primitives'"
              class="flex-1 py-1 rounded text-xs font-mono text-center cursor-pointer transition-colors"
              :class="studioMaterialTab === 'primitives' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'"
            >
              📐 基础图元
            </button>
            <button
              @click="studioMaterialTab = 'symbols'"
              class="flex-1 py-1 rounded text-xs font-mono text-center cursor-pointer transition-colors"
              :class="studioMaterialTab === 'symbols' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'"
            >
              ⚡ 资产图元
            </button>
          </div>

          <!-- Tab 1: Geometric Primitives -->
          <div v-if="studioMaterialTab === 'primitives'" class="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            <div class="text-[10px] text-slate-500 font-mono px-1">支持点击或拖拽放入画布</div>
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

          <!-- Tab 2: Existing Domain Symbols (Breakers, Disconnectors, CTs, Tanks, Pumps) -->
          <div v-else class="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            <div class="text-[10px] text-slate-500 font-mono px-1">点击或拖拽嵌套图元</div>
            <div
              v-for="sym in symbols"
              :key="sym.id"
              draggable="true"
              @dragstart="handleStudioSymbolDragStart($event, sym)"
              @click="addSubSymbolToStudio(sym)"
              class="w-full p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-2 text-left cursor-grab active:cursor-grabbing transition-all text-slate-200 group"
            >
              <div class="p-1.5 rounded bg-cyan-950 text-cyan-300 group-hover:scale-105 transition-transform">
                <Zap class="w-3.5 h-3.5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-mono font-semibold truncate">{{ sym.name }}</div>
                <div class="text-[9px] text-slate-500 font-mono">{{ sym.defaultWidth }} × {{ sym.defaultHeight }} | {{ sym.states?.length || 1 }}态</div>
              </div>
              <Plus class="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300" />
            </div>
          </div>
        </div>

        <!-- Studio Center: Interactive Canvas & Toolbar -->
        <div class="flex-1 min-w-0 flex flex-col bg-[#02050b] relative overflow-hidden">
          
          <!-- Top Tool & State Bar -->
          <div class="px-4 py-2 border-b border-slate-800 bg-[#050914] flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <!-- Left: Drawing Tools Switcher (Select vs Draw Line vs Draw Polyline) -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono shrink-0">
                <button
                  @click="studioDrawTool = 'select'"
                  class="px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  :class="studioDrawTool === 'select' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                  title="自由选择与拖动画布元件"
                >
                  <MousePointer class="w-3.5 h-3.5" />
                  <span>选择</span>
                </button>
                <button
                  @click="studioDrawTool = 'draw-line'"
                  class="px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  :class="studioDrawTool === 'draw-line' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,242,255,0.4)]' : 'text-slate-400 hover:text-white'"
                  title="单击确定起点，再次单击完成直线绘制"
                >
                  <Minus class="w-3.5 h-3.5" />
                  <span>拉直线</span>
                </button>
                <button
                  @click="studioDrawTool = 'draw-polyline'"
                  class="px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  :class="studioDrawTool === 'draw-polyline' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,242,255,0.4)]' : 'text-slate-400 hover:text-white'"
                  title="单击确定起点/拐点，双击结束折线绘制"
                >
                  <Workflow class="w-3.5 h-3.5" />
                  <span>拉折线</span>
                </button>
              </div>

              <!-- Drawing Tips / Finish Action -->
              <div v-if="studioDrawTool === 'draw-line'" class="text-[11px] font-mono text-cyan-300 animate-pulse bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap">
                ✏️ 直线：单击起点，再次单击结束
              </div>
              <div v-else-if="studioDrawTool === 'draw-polyline'" class="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <span class="text-[11px] font-mono text-cyan-300 animate-pulse bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  〰️ 折线：单击加拐点，双击完成
                </span>
                <button
                  v-if="studioPolylineDrawing.active"
                  @click="finishStudioPolyline"
                  class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] font-mono cursor-pointer"
                >
                  完成折线
                </button>
                <button
                  @click="cancelStudioDrawing"
                  class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono cursor-pointer hover:bg-slate-700"
                >
                  取消
                </button>
              </div>
            </div>

            <!-- Right: States & Dimension Control -->
            <div class="flex items-center gap-3 shrink-0">
              <!-- State Switcher with matchValue badges -->
              <div class="flex items-center gap-1 font-mono text-xs overflow-x-auto max-w-[420px] custom-scrollbar py-0.5">
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
                <span class="text-slate-400">尺寸:</span>
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
            class="flex-1 flex items-center justify-center p-8 overflow-auto relative"
            @click.self="selectedStudioChildId = null"
          >
            <!-- Canvas Container -->
            <div
              ref="studioCanvasRef"
              @dragover.prevent
              @drop="handleStudioCanvasDrop"
              @click="handleStudioCanvasClick"
              @dblclick="handleStudioCanvasDblClick"
              class="relative shadow-2xl border border-cyan-500/40 rounded-xs transition-transform"
              :class="{
                'cursor-crosshair': studioDrawTool !== 'select',
                'cursor-default': studioDrawTool === 'select'
              }"
              :style="{
                width: `${studioSymbol.width}px`,
                height: `${studioSymbol.height}px`,
                backgroundColor: studioSymbol.backgroundColor || '#040810',
                backgroundImage: 'radial-gradient(circle, rgba(0, 242, 255, 0.15) 1px, transparent 1px)',
                backgroundSize: '15px 15px'
              }"
            >
              <!-- Children Elements inside Active State -->
              <div
                v-for="child in currentStudioChildren"
                :key="child.id"
                @mousedown.stop="handleStudioChildMouseDown($event, child)"
                @click.stop="handleStudioChildClick($event, child)"
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
                  v-if="selectedStudioChildId === child.id && studioDrawTool === 'select'"
                  class="absolute -inset-0.5 border-2 border-cyan-400 pointer-events-none rounded-xs z-30"
                >
                  <!-- 8 Resizers -->
                  <div @mousedown="handleStudioStartResize($event, 'nw')" class="pointer-events-auto absolute -top-1 -left-1 w-2.5 h-2.5 bg-cyan-400 border border-slate-950 cursor-nwse-resize" />
                  <div @mousedown="handleStudioStartResize($event, 'ne')" class="pointer-events-auto absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-slate-950 cursor-nesw-resize" />
                  <div @mousedown="handleStudioStartResize($event, 'se')" class="pointer-events-auto absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-slate-950 cursor-nwse-resize" />
                  <div @mousedown="handleStudioStartResize($event, 'sw')" class="pointer-events-auto absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-cyan-400 border border-slate-950 cursor-nesw-resize" />
                  <div @mousedown="handleStudioStartResize($event, 'e')" class="pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-slate-950 cursor-ew-resize" />
                  <div @mousedown="handleStudioStartResize($event, 's')" class="pointer-events-auto absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-cyan-400 border border-slate-950 cursor-ns-resize" />
                </div>
              </div>

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

        <!-- Studio Right: Rich Property Inspector -->
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
            <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
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
          <div v-if="selectedStudioChild" class="space-y-3">
            <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
              <span class="truncate">元件: {{ selectedStudioChild.name }}</span>
              <button
                @click="deleteStudioChild(selectedStudioChild.id)"
                class="p-1 rounded bg-red-950/80 text-red-400 hover:bg-red-900 cursor-pointer shrink-0"
                title="删除元件"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Position & Size Precision -->
            <div class="grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div>
                <label class="block text-[9px] text-slate-400">X (坐标)</label>
                <input v-model.number="selectedStudioChild.x" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">Y (坐标)</label>
                <input v-model.number="selectedStudioChild.y" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">宽 (W)</label>
                <input v-model.number="selectedStudioChild.width" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">高 (H)</label>
                <input v-model.number="selectedStudioChild.height" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">旋转角度 (°)</label>
                <input v-model.number="selectedStudioChild.rotation" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400">图层 (Z)</label>
                <input v-model.number="selectedStudioChild.zIndex" type="number" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300" />
              </div>
            </div>

            <!-- Stroke Color & Width -->
            <div class="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div class="text-[10px] font-bold text-cyan-300">线条与边框样式</div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">线条 / 边框颜色</label>
                <div class="flex items-center gap-2">
                  <input v-model="selectedStudioChild.style.stroke" type="color" class="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <input v-model="selectedStudioChild.style.stroke" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
                </div>
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">线宽 ({{ selectedStudioChild.style.strokeWidth || 2 }}px)</label>
                <input v-model.number="selectedStudioChild.style.strokeWidth" type="range" min="1" max="16" class="w-full accent-cyan-400" />
              </div>
              <div v-if="['draw-line', 'draw-polyline'].includes(selectedStudioChild.type)">
                <label class="block text-[9px] text-slate-400 mb-1">虚实线型</label>
                <select v-model="selectedStudioChild.style.lineStyle" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300">
                  <option value="solid">实线 (Solid)</option>
                  <option value="dashed">虚线 (Dashed)</option>
                  <option value="dotted">点状线 (Dotted)</option>
                </select>
              </div>
            </div>

            <!-- Fill Background Color (for shapes) -->
            <div v-if="!['draw-line', 'draw-polyline'].includes(selectedStudioChild.type)" class="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div class="text-[10px] font-bold text-cyan-300">填充背景与圆角</div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">背景填充色</label>
                <div class="flex items-center gap-2">
                  <input v-model="selectedStudioChild.style.fill" type="color" class="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <input v-model="selectedStudioChild.style.fill" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
                </div>
              </div>
              <div v-if="selectedStudioChild.type === 'draw-rect' || selectedStudioChild.type === 'ctrl-button'">
                <label class="block text-[9px] text-slate-400 mb-1">圆角弧度: {{ selectedStudioChild.style.borderRadius || 0 }}px</label>
                <input v-model.number="selectedStudioChild.style.borderRadius" type="range" min="0" max="30" class="w-full accent-cyan-400" />
              </div>
            </div>

            <!-- Text & Metric Specific Properties -->
            <div v-if="selectedStudioChild.type === 'draw-text' || selectedStudioChild.type === 'metric-float' || selectedStudioChild.type === 'ctrl-button'" class="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div class="text-[10px] font-bold text-cyan-300">文本与数值配置</div>
              <div v-if="selectedStudioChild.type === 'draw-text'">
                <label class="block text-[9px] text-slate-400 mb-1">文本内容</label>
                <input v-model="selectedStudioChild.name" type="text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
              </div>
              <div v-if="selectedStudioChild.type === 'ctrl-button'">
                <label class="block text-[9px] text-slate-400 mb-1">按钮文字</label>
                <input v-model="selectedStudioChild.style.buttonText" type="text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
              </div>
              <div v-if="selectedStudioChild.type === 'metric-float'" class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[9px] text-slate-400 mb-1">小数位数</label>
                  <input v-model.number="selectedStudioChild.style.decimals" type="number" min="0" max="4" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-cyan-300" />
                </div>
                <div>
                  <label class="block text-[9px] text-slate-400 mb-1">单位后缀</label>
                  <input v-model="selectedStudioChild.style.suffix" type="text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-cyan-300" />
                </div>
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">字号大小: {{ selectedStudioChild.style.fontSize || 14 }}px</label>
                <input v-model.number="selectedStudioChild.style.fontSize" type="range" min="10" max="36" class="w-full accent-cyan-400" />
              </div>
              <div>
                <label class="block text-[9px] text-slate-400 mb-1">文字颜色</label>
                <div class="flex items-center gap-2">
                  <input v-model="selectedStudioChild.style.textColor" type="color" class="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <input v-model="selectedStudioChild.style.textColor" type="text" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200" />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-slate-500 text-center py-8 text-xs">
            在中央画布中点击选中元件进行参数微调
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
  </div>
</template>
