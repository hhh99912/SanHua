<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ScreenComponent, ScreenConfig, DatasetItem } from '../types';
import Ruler from './Ruler.vue';
import WidgetRenderer from './widgets/WidgetRenderer.vue';
import { 
  Lock, Unlock, RotateCw, AlignLeft, AlignCenter, AlignRight, 
  Layers, BookmarkPlus, Copy, Scissors, Clipboard, Trash2, Shield,
  CheckSquare, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
  ChevronUp, ChevronDown, AlignHorizontalSpaceAround, AlignVerticalSpaceAround
} from 'lucide-vue-next';

// Auto focus directive for inline editing
const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
    if (el instanceof HTMLInputElement) {
      el.select();
    }
  }
};

interface Props {
  screen: ScreenConfig;
  components: ScreenComponent[];
  selectedIds: string[];
  zoom: number;
  datasets: DatasetItem[];
  drawTool?: 'select' | 'draw-line' | 'draw-polyline';
  canPaste?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  drawTool: 'select',
  canPaste: false
});

const emit = defineEmits<{
  (e: 'select', ids: string[]): void;
  (e: 'update:component', comp: ScreenComponent): void;
  (e: 'update:components', comps: ScreenComponent[]): void;
  (e: 'add:component:at', data: any, x: number, y: number): void;
  (e: 'copy', comps: ScreenComponent[]): void;
  (e: 'cut', comps: ScreenComponent[]): void;
  (e: 'paste', pos?: { x: number; y: number }): void;
  (e: 'duplicate', comps: ScreenComponent[]): void;
  (e: 'delete', ids: string[]): void;
  (e: 'bring:front', id: string | string[]): void;
  (e: 'send:back', id: string | string[]): void;
  (e: 'move:up', id: string | string[]): void;
  (e: 'move:down', id: string | string[]): void;
  (e: 'save:symbol', comps: ScreenComponent[]): void;
  (e: 'ungroup', comp: ScreenComponent): void;
  (e: 'align', type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v'): void;
  (e: 'finish:draw'): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasWrapperRef = ref<HTMLDivElement | null>(null);
const mousePos = ref({ x: 0, y: 0 });

// Multi-selection Box Drag (拉框多选)
const isSelectingMarquee = ref(false);
const hasMovedMarquee = ref(false);
const suppressNextCanvasClick = ref(false);
const marqueeBox = ref<{ startX: number; startY: number; x: number; y: number; width: number; height: number }>({
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
  width: 0,
  height: 0
});

// Dragging & Resizing & Rotating state
const isDragging = ref(false);
const hasMovedDrag = ref(false);
const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map());
const dragStartMouse = ref({ x: 0, y: 0 });

const isResizing = ref(false);
const resizeHandle = ref<string | null>(null);
const resizeStart = ref<{ mouseX: number; mouseY: number; x: number; y: number; width: number; height: number; fontSize?: number }>({ 
  mouseX: 0, 
  mouseY: 0, 
  x: 0, 
  y: 0, 
  width: 0, 
  height: 0,
  fontSize: 16
});

// Inline text editing state (双击直接修改文本/名称)
const inlineEditing = ref<{
  compId: string;
  value: string;
} | null>(null);

const isRotating = ref(false);
const rotateStart = ref({ cx: 0, cy: 0, initialAngle: 0, startRotation: 0 });

// Interactive Drawing Tool State (直线与折线连线绘制)
const lineDrawing = ref<{
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

const polylineDrawing = ref<{
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

// Context Menu
const contextMenu = ref<{ visible: boolean; x: number; y: number; canvasX: number; canvasY: number; targetCompId: string | null }>({
  visible: false,
  x: 0,
  y: 0,
  canvasX: 0,
  canvasY: 0,
  targetCompId: null
});

// Calculate Canvas coordinates from Client mouse coordinates
const getCanvasCoords = (clientX: number, clientY: number) => {
  if (!canvasWrapperRef.value) return { x: 0, y: 0 };
  const rect = canvasWrapperRef.value.getBoundingClientRect();
  const x = Math.round((clientX - rect.left) / props.zoom);
  const y = Math.round((clientY - rect.top) / props.zoom);
  return { x: Math.max(0, x), y: Math.max(0, y) };
};

// Selected Components Array
const selectedComponents = computed(() => {
  return props.components.filter(c => props.selectedIds.includes(c.id));
});

// Primary selected component (if 1 selected)
const primarySelected = computed(() => {
  if (props.selectedIds.length === 1) {
    return props.components.find(c => c.id === props.selectedIds[0]) || null;
  }
  return null;
});

const handleMouseMoveWorkspace = (e: MouseEvent) => {
  const coords = getCanvasCoords(e.clientX, e.clientY);
  mousePos.value = coords;

  // 1. Line Drawing Preview
  if (props.drawTool === 'draw-line' && lineDrawing.value.active) {
    lineDrawing.value.currentX = coords.x;
    lineDrawing.value.currentY = coords.y;
    return;
  }

  // 2. Polyline Drawing Preview
  if (props.drawTool === 'draw-polyline' && polylineDrawing.value.active) {
    polylineDrawing.value.currentX = coords.x;
    polylineDrawing.value.currentY = coords.y;
    return;
  }

  // 3. Marquee Selection Drag (拉框多选)
  if (isSelectingMarquee.value) {
    const minX = Math.min(marqueeBox.value.startX, coords.x);
    const minY = Math.min(marqueeBox.value.startY, coords.y);
    const w = Math.abs(coords.x - marqueeBox.value.startX);
    const h = Math.abs(coords.y - marqueeBox.value.startY);

    if (w > 4 || h > 4) {
      hasMovedMarquee.value = true;
    }

    marqueeBox.value.x = minX;
    marqueeBox.value.y = minY;
    marqueeBox.value.width = w;
    marqueeBox.value.height = h;

    if (hasMovedMarquee.value) {
      // Detect intersected components
      const selected = props.components.filter(c => {
        if (c.visible === false) return false;
        return (
          c.x < minX + w &&
          c.x + c.width > minX &&
          c.y < minY + h &&
          c.y + c.height > minY
        );
      });

      emit('select', selected.map(c => c.id));
    }
    return;
  }

  // 4. Batch Component Dragging
  if (isDragging.value && props.selectedIds.length > 0) {
    const dx = (e.clientX - dragStartMouse.value.x) / props.zoom;
    const dy = (e.clientY - dragStartMouse.value.y) / props.zoom;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      hasMovedDrag.value = true;
    }

    const updatedComps = props.components
      .filter(c => props.selectedIds.includes(c.id) && !c.locked)
      .map(c => {
        const startPos = dragStartPositions.value.get(c.id) || { x: c.x, y: c.y };
        return {
          ...c,
          x: Math.round(startPos.x + dx),
          y: Math.round(startPos.y + dy)
        };
      });

    if (updatedComps.length > 0) {
      emit('update:components', updatedComps);
    }
    return;
  }

  // 5. Component Resizing
  if (isResizing.value && primarySelected.value && resizeHandle.value && !primarySelected.value.locked) {
    const dx = (e.clientX - resizeStart.value.mouseX) / props.zoom;
    const dy = (e.clientY - resizeStart.value.mouseY) / props.zoom;
    const handle = resizeHandle.value;

    let newX = resizeStart.value.x;
    let newY = resizeStart.value.y;
    let newW = resizeStart.value.width;
    let newH = resizeStart.value.height;

    if (handle.includes('e')) newW = Math.max(10, Math.round(resizeStart.value.width + dx));
    if (handle.includes('s')) newH = Math.max(10, Math.round(resizeStart.value.height + dy));
    if (handle.includes('w')) {
      const potW = resizeStart.value.width - dx;
      if (potW >= 10) {
        newW = Math.round(potW);
        newX = Math.round(resizeStart.value.x + dx);
      }
    }
    if (handle.includes('n')) {
      const potH = resizeStart.value.height - dy;
      if (potH >= 10) {
        newH = Math.round(potH);
        newY = Math.round(resizeStart.value.y + dy);
      }
    }

    const comp = primarySelected.value;
    const isTextOrButton = comp.type === 'draw-text' || comp.type === 'ctrl-button' || comp.type === 'metric-header';
    let updatedStyle = { ...comp.style };
    if (isTextOrButton) {
      const initH = resizeStart.value.height || 36;
      const initFontSize = resizeStart.value.fontSize || comp.style?.fontSize || Math.max(12, Math.round(initH * 0.65));
      const scaleFactor = newH / initH;
      const newFontSize = Math.max(10, Math.min(Math.round(initFontSize * scaleFactor), 96));
      updatedStyle.fontSize = newFontSize;
    }

    emit('update:component', {
      ...comp,
      x: newX,
      y: newY,
      width: newW,
      height: newH,
      style: updatedStyle
    });
    return;
  }

  // 6. Free Rotation Handle Drag (旋转功能)
  if (isRotating.value && primarySelected.value && !primarySelected.value.locked) {
    const curX = coords.x;
    const curY = coords.y;
    const cx = rotateStart.value.cx;
    const cy = rotateStart.value.cy;

    // Angle in degrees from center to current mouse
    const rad = Math.atan2(curY - cy, curX - cx);
    let deg = Math.round((rad * 180) / Math.PI + 90);
    
    // Normalize to 0~360
    deg = (deg % 360 + 360) % 360;

    // Snap to 15 degrees if Shift is held
    if (e.shiftKey) {
      deg = Math.round(deg / 15) * 15;
    }

    emit('update:component', {
      ...primarySelected.value,
      rotation: deg
    });
  }
};

const handleMouseUpWorkspace = () => {
  if (isSelectingMarquee.value) {
    if (hasMovedMarquee.value) {
      suppressNextCanvasClick.value = true;
      setTimeout(() => {
        suppressNextCanvasClick.value = false;
      }, 120);
    }
    isSelectingMarquee.value = false;
    hasMovedMarquee.value = false;
  }

  if (isDragging.value) {
    if (hasMovedDrag.value) {
      suppressNextCanvasClick.value = true;
      setTimeout(() => {
        suppressNextCanvasClick.value = false;
      }, 120);
    }
    isDragging.value = false;
    hasMovedDrag.value = false;
  }

  isResizing.value = false;
  resizeHandle.value = null;
  isRotating.value = false;
};

// Component Drag Start
const handleStartDrag = (e: MouseEvent, comp: ScreenComponent) => {
  if (e.button !== 0) return;
  if (props.drawTool !== 'select') return;
  e.stopPropagation();

  contextMenu.value.visible = false;

  // If Shift/Ctrl key is pressed, toggle selection
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    if (props.selectedIds.includes(comp.id)) {
      emit('select', props.selectedIds.filter(id => id !== comp.id));
    } else {
      emit('select', [...props.selectedIds, comp.id]);
    }
    return;
  }

  // If component is already in selected group, don't break multi-selection
  if (!props.selectedIds.includes(comp.id)) {
    emit('select', [comp.id]);
  }

  if (comp.locked) return;

  isDragging.value = true;
  hasMovedDrag.value = false;
  dragStartMouse.value = { x: e.clientX, y: e.clientY };
  
  const map = new Map<string, { x: number; y: number }>();
  props.components.forEach(c => {
    if (props.selectedIds.includes(c.id) || c.id === comp.id) {
      map.set(c.id, { x: c.x, y: c.y });
    }
  });
  dragStartPositions.value = map;
};

// Canvas Background Click & Drawing Tool Handlers
const handleCanvasClick = (e: MouseEvent) => {
  if (suppressNextCanvasClick.value) {
    suppressNextCanvasClick.value = false;
    return;
  }

  const coords = getCanvasCoords(e.clientX, e.clientY);

  // 1. Straight Line Drawing Mode (单击确定起始点，再次单击确定落点)
  if (props.drawTool === 'draw-line') {
    if (!lineDrawing.value.active) {
      lineDrawing.value.active = true;
      lineDrawing.value.startX = coords.x;
      lineDrawing.value.startY = coords.y;
      lineDrawing.value.currentX = coords.x;
      lineDrawing.value.currentY = coords.y;
    } else {
      // Finish Straight Line (Preserving exact slope and diagonal orientation!)
      const x1 = lineDrawing.value.startX;
      const y1 = lineDrawing.value.startY;
      const x2 = coords.x;
      const y2 = coords.y;

      const compX = Math.min(x1, x2);
      const compY = Math.min(y1, y2);
      const compW = Math.max(12, Math.abs(x2 - x1));
      const compH = Math.max(12, Math.abs(y2 - y1));

      // Calculate relative points and ratios within bounding box
      const relX1 = x1 - compX;
      const relY1 = y1 - compY;
      const relX2 = x2 - compX;
      const relY2 = y2 - compY;

      const x1Ratio = compW > 0 ? relX1 / compW : 0;
      const y1Ratio = compH > 0 ? relY1 / compH : 0;
      const x2Ratio = compW > 0 ? relX2 / compW : 1;
      const y2Ratio = compH > 0 ? relY2 / compH : 1;

      emit('add:component:at', {
        type: 'draw-line',
        category: 'basic',
        name: '导线 / 直线',
        width: compW,
        height: compH,
        style: { 
          stroke: '#00f2ff', 
          strokeWidth: 3, 
          lineStyle: 'solid'
        },
        customProps: {
          points: [
            { xRatio: x1Ratio, yRatio: y1Ratio, x: relX1, y: relY1 },
            { xRatio: x2Ratio, yRatio: y2Ratio, x: relX2, y: relY2 }
          ]
        }
      }, compX, compY);

      lineDrawing.value.active = false;
      emit('finish:draw');
    }
    return;
  }

  // 2. Polyline Drawing Mode (单击反复选中拐点，双击结束)
  if (props.drawTool === 'draw-polyline') {
    if (!polylineDrawing.value.active) {
      polylineDrawing.value.active = true;
      polylineDrawing.value.points = [{ x: coords.x, y: coords.y }];
      polylineDrawing.value.currentX = coords.x;
      polylineDrawing.value.currentY = coords.y;
    } else {
      polylineDrawing.value.points.push({ x: coords.x, y: coords.y });
    }
    return;
  }

  // 3. Regular selection clear ONLY when clicking pure canvas background WITHOUT marquee dragging
  const target = e.target as HTMLElement;
  if (
    target === containerRef.value ||
    target === canvasWrapperRef.value ||
    target.classList.contains('canvas-workspace-bg')
  ) {
    if (!isSelectingMarquee.value && !hasMovedMarquee.value) {
      emit('select', []);
    }
  }
};

// Polyline Double Click to Finish
const handleCanvasDblClick = (e: MouseEvent) => {
  if (props.drawTool === 'draw-polyline' && polylineDrawing.value.active) {
    const pts = polylineDrawing.value.points;
    if (pts.length >= 2) {
      const minX = Math.min(...pts.map(p => p.x));
      const minY = Math.min(...pts.map(p => p.y));
      const maxX = Math.max(...pts.map(p => p.x));
      const maxY = Math.max(...pts.map(p => p.y));

      const compW = Math.max(12, maxX - minX);
      const compH = Math.max(12, maxY - minY);

      // Relative coordinates & normalized ratios
      const relPoints = pts.map(p => ({
        xRatio: compW > 0 ? (p.x - minX) / compW : 0,
        yRatio: compH > 0 ? (p.y - minY) / compH : 0,
        x: p.x - minX,
        y: p.y - minY
      }));

      emit('add:component:at', {
        type: 'draw-polyline',
        category: 'basic',
        name: '折线走线',
        width: compW,
        height: compH,
        style: { 
          stroke: '#00f2ff', 
          strokeWidth: 3, 
          lineType: 'step-horizontal',
          lineStyle: 'solid'
        },
        customProps: {
          points: relPoints
        }
      }, minX, minY);
    }

    polylineDrawing.value.active = false;
    polylineDrawing.value.points = [];
    emit('finish:draw');
  }
};

// Marquee Selection Mouse Down on Canvas Background
const handleCanvasMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;
  if (props.drawTool !== 'select') return;

  const target = e.target as HTMLElement;
  if (
    target === containerRef.value ||
    target === canvasWrapperRef.value ||
    target.classList.contains('canvas-workspace-bg')
  ) {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    isSelectingMarquee.value = true;
    hasMovedMarquee.value = false;
    marqueeBox.value = {
      startX: coords.x,
      startY: coords.y,
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0
    };
  }
};

// Start Resizing
const handleStartResize = (e: MouseEvent, handle: string) => {
  e.stopPropagation();
  e.preventDefault();
  if (!primarySelected.value || primarySelected.value.locked) return;

  const comp = primarySelected.value;
  isResizing.value = true;
  resizeHandle.value = handle;
  resizeStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    x: comp.x,
    y: comp.y,
    width: comp.width,
    height: comp.height,
    fontSize: comp.style?.fontSize || Math.max(12, Math.round(comp.height * 0.65))
  };
};

// Double-click on component to inline edit text/label (双击修改文本标签)
const handleCompDblClick = (e: MouseEvent, comp: ScreenComponent) => {
  e.stopPropagation();
  e.preventDefault();
  if (comp.locked) return;

  let initVal = comp.name || '';
  if (comp.type === 'draw-text') {
    initVal = comp.style?.text || comp.name || '文本标签';
  } else if (comp.type === 'ctrl-button') {
    initVal = comp.style?.buttonText || comp.name || '控制按钮';
  }

  inlineEditing.value = {
    compId: comp.id,
    value: initVal
  };
};

const commitInlineEdit = () => {
  if (!inlineEditing.value) return;
  const { compId, value } = inlineEditing.value;
  const comp = props.components.find(c => c.id === compId);
  if (comp) {
    const trimmed = value.trim() || comp.name;
    if (comp.type === 'draw-text') {
      emit('update:component', {
        ...comp,
        name: trimmed,
        style: {
          ...comp.style,
          text: trimmed
        }
      });
    } else if (comp.type === 'ctrl-button') {
      emit('update:component', {
        ...comp,
        name: trimmed,
        style: {
          ...comp.style,
          buttonText: trimmed
        }
      });
    } else {
      emit('update:component', {
        ...comp,
        name: trimmed
      });
    }
  }
  inlineEditing.value = null;
};

// Start Rotating (自由旋转功能)
const handleStartRotate = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
  if (!primarySelected.value || primarySelected.value.locked) return;

  const comp = primarySelected.value;
  const cx = comp.x + comp.width / 2;
  const cy = comp.y + comp.height / 2;

  isRotating.value = true;
  rotateStart.value = {
    cx,
    cy,
    initialAngle: 0,
    startRotation: comp.rotation || 0
  };
};

// Drag Drop from palette
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  const rawData = e.dataTransfer.getData('application/json');
  if (!rawData) return;

  try {
    const compDef = JSON.parse(rawData);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const x = Math.max(0, coords.x - Math.round((compDef.width || 120) / 2));
    const y = Math.max(0, coords.y - Math.round((compDef.height || 80) / 2));
    emit('add:component:at', compDef, x, y);
  } catch (err) {
    console.error('Failed to drop component', err);
  }
};

// Right-click context menu
const handleContextMenu = (e: MouseEvent, compId: string | null) => {
  e.preventDefault();
  e.stopPropagation();

  if (compId && !props.selectedIds.includes(compId)) {
    emit('select', [compId]);
  }

  const coords = getCanvasCoords(e.clientX, e.clientY);

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    canvasX: coords.x,
    canvasY: coords.y,
    targetCompId: compId
  };
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

// Keyboard Shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

  const isCtrlOrMeta = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // Select all (Ctrl+A)
  if (isCtrlOrMeta && key === 'a') {
    e.preventDefault();
    if (props.components.length > 0) {
      emit('select', props.components.map(c => c.id));
    }
    return;
  }

  // Paste (Ctrl+V)
  if (isCtrlOrMeta && key === 'v') {
    e.preventDefault();
    emit('paste', { x: mousePos.value.x, y: mousePos.value.y });
    return;
  }

  // Escape to cancel drawing or clear selection
  if (e.key === 'Escape') {
    if (lineDrawing.value.active || polylineDrawing.value.active) {
      lineDrawing.value.active = false;
      polylineDrawing.value.active = false;
      polylineDrawing.value.points = [];
      emit('finish:draw');
    } else {
      emit('select', []);
    }
    return;
  }

  // Enter to finish polyline
  if (e.key === 'Enter' && polylineDrawing.value.active) {
    handleCanvasDblClick(new MouseEvent('dblclick'));
    return;
  }

  if (props.selectedIds.length === 0) return;

  // Copy (Ctrl+C)
  if (isCtrlOrMeta && key === 'c') {
    e.preventDefault();
    emit('copy', selectedComponents.value);
    return;
  }

  // Cut (Ctrl+X)
  if (isCtrlOrMeta && key === 'x') {
    e.preventDefault();
    emit('cut', selectedComponents.value);
    return;
  }

  // Duplicate (Ctrl+D)
  if (isCtrlOrMeta && key === 'd') {
    e.preventDefault();
    emit('duplicate', selectedComponents.value);
    return;
  }

  // Delete
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('delete', props.selectedIds);
    return;
  }

  // Arrow key nudges
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;

    const updated = selectedComponents.value
      .filter(c => !c.locked)
      .map(c => ({
        ...c,
        x: c.x + dx,
        y: c.y + dy
      }));

    if (updated.length > 0) {
      emit('update:components', updated);
    }
    return;
  }

  // Layer shortcuts (Ctrl+Shift+] / Ctrl+] / Ctrl+Shift+[ / Ctrl+[)
  if (isCtrlOrMeta && (key === ']' || key === '}')) {
    e.preventDefault();
    if (e.shiftKey) {
      emit('bring:front', props.selectedIds);
    } else {
      emit('move:up', props.selectedIds);
    }
    return;
  }

  if (isCtrlOrMeta && (key === '[' || key === '{')) {
    e.preventDefault();
    if (e.shiftKey) {
      emit('send:back', props.selectedIds);
    } else {
      emit('move:down', props.selectedIds);
    }
    return;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('click', closeContextMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('click', closeContextMenu);
});
</script>

<template>
  <div 
    ref="containerRef"
    @mousemove="handleMouseMoveWorkspace"
    @mouseup="handleMouseUpWorkspace"
    @mousedown="handleCanvasMouseDown"
    @click="handleCanvasClick"
    @dblclick="handleCanvasDblClick"
    @dragover="handleDragOver"
    @drop="handleDrop"
    class="flex-1 h-full bg-[#03060d] relative overflow-auto custom-scrollbar select-none flex flex-col"
    :class="{
      'cursor-crosshair': drawTool !== 'select'
    }"
  >
    <!-- Rulers on Top & Left -->
    <Ruler
      :width="screen.width"
      :height="screen.height"
      :zoom="zoom"
      :cursorPos="mousePos"
    />

    <!-- Floating Multi-Selection Quick Tools Toolbar -->
    <div 
      v-if="selectedIds.length > 1"
      class="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#080e1c]/95 border border-cyan-500/60 backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] px-3 py-1.5 flex items-center gap-2 text-xs font-mono select-none"
    >
      <div class="flex items-center gap-1.5 text-cyan-300 font-bold pr-2 border-r border-slate-700/80">
        <Layers class="w-3.5 h-3.5 text-cyan-400" />
        <span>多选 ({{ selectedIds.length }})</span>
      </div>

      <!-- Alignment buttons -->
      <div class="flex items-center gap-1">
        <button @click="emit('align', 'left')" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="左对齐"><AlignLeft class="w-3.5 h-3.5" /></button>
        <button @click="emit('align', 'center')" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="水平居中"><AlignCenter class="w-3.5 h-3.5" /></button>
        <button @click="emit('align', 'right')" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="右对齐"><AlignRight class="w-3.5 h-3.5" /></button>
        <div class="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button @click="emit('align', 'top')" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="顶对齐"><AlignVerticalSpaceAround class="w-3.5 h-3.5 rotate-90" /></button>
        <button @click="emit('align', 'middle')" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="垂直居中"><AlignHorizontalSpaceAround class="w-3.5 h-3.5" /></button>
        <button @click="emit('align', 'bottom')" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="底对齐"><AlignVerticalSpaceAround class="w-3.5 h-3.5 -rotate-90" /></button>
        <div class="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button @click="emit('align', 'distribute-h')" class="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer text-[11px]" title="水平等间距分布">水平均布</button>
        <button @click="emit('align', 'distribute-v')" class="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer text-[11px]" title="垂直等间距分布">垂直均布</button>
      </div>

      <div class="w-[1px] h-4 bg-slate-700 mx-1" />

      <!-- Layer quick buttons -->
      <div class="flex items-center gap-1">
        <button @click="emit('bring:front', selectedIds)" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="置于顶层 (Ctrl+Shift+])"><ArrowUpToLine class="w-3.5 h-3.5" /></button>
        <button @click="emit('move:up', selectedIds)" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="上移一层 (Ctrl+])"><ChevronUp class="w-3.5 h-3.5" /></button>
        <button @click="emit('move:down', selectedIds)" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="下移一层 (Ctrl+[)"><ChevronDown class="w-3.5 h-3.5" /></button>
        <button @click="emit('send:back', selectedIds)" class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 cursor-pointer" title="置于底层 (Ctrl+Shift+[)"><ArrowDownToLine class="w-3.5 h-3.5" /></button>
      </div>

      <div class="w-[1px] h-4 bg-slate-700 mx-1" />

      <!-- Save as custom symbol -->
      <button 
        @click="emit('save:symbol', selectedComponents)"
        class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
        title="将多选图元封装为自定义图元"
      >
        <BookmarkPlus class="w-3.5 h-3.5" />
        <span>封装图元</span>
      </button>
    </div>

    <!-- Main Workspace Canvas Area -->
    <div 
      class="canvas-workspace-bg flex-1 min-h-[1400px] min-w-[2400px] p-24 relative flex items-start justify-start"
    >
      <!-- Screen Frame Box -->
      <div
        ref="canvasWrapperRef"
        @contextmenu.prevent="handleContextMenu($event, null)"
        class="relative transition-transform origin-top-left shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-cyan-500/30 rounded-xs"
        :style="{
          width: `${screen.width}px`,
          height: `${screen.height}px`,
          transform: `scale(${zoom})`,
          backgroundColor: screen.backgroundColor || '#040810',
          backgroundImage: screen.backgroundGrid 
            ? `radial-gradient(circle, ${screen.gridColor || 'rgba(0, 242, 255, 0.18)'} 1.5px, transparent 1.5px)` 
            : 'none',
          backgroundSize: `${screen.gridSize || 30}px ${screen.gridSize || 30}px`
        }"
      >
        <!-- Resolution Label -->
        <div class="absolute -top-6 right-0 text-[10px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-500/30">
          {{ screen.width }} × {{ screen.height }} px
        </div>

        <!-- Render All Screen Components in Layer Order -->
        <div
          v-for="comp in components"
          :key="comp.id"
          @mousedown.stop="handleStartDrag($event, comp)"
          @dblclick="handleCompDblClick($event, comp)"
          @contextmenu="handleContextMenu($event, comp.id)"
          class="absolute group cursor-move"
          :class="{
            'pointer-events-none opacity-40': comp.visible === false,
            'cursor-not-allowed': comp.locked
          }"
          :style="{
            left: `${comp.x}px`,
            top: `${comp.y}px`,
            width: `${comp.width}px`,
            height: `${comp.height}px`,
            transform: comp.rotation ? `rotate(${comp.rotation}deg)` : 'none',
            transformOrigin: 'center center',
            zIndex: comp.zIndex || 1
          }"
        >
          <!-- Component Content -->
          <WidgetRenderer
            :component="comp"
            :datasets="datasets"
          />

          <!-- Double Click Inline Text Editor Overlay -->
          <div
            v-if="inlineEditing?.compId === comp.id"
            class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 border-2 border-cyan-400 rounded-md p-1 shadow-2xl"
            @mousedown.stop
            @dblclick.stop
          >
            <input
              v-model="inlineEditing.value"
              @keydown.enter="commitInlineEdit"
              @keydown.esc="inlineEditing = null"
              @blur="commitInlineEdit"
              v-focus
              class="w-full h-full bg-slate-900 text-cyan-200 border border-cyan-500/50 rounded px-2 py-0.5 text-center text-sm font-bold outline-hidden shadow-inner"
              placeholder="输入文本内容..."
            />
          </div>

          <!-- Locked Indicator Badge -->
          <div v-if="comp.locked" class="absolute top-1 right-1 p-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40 z-30">
            <Lock class="w-3 h-3" />
          </div>

          <!-- Selection Bounding Box & 8 Resize Handles & Rotation Handle -->
          <div 
            v-if="selectedIds.includes(comp.id)"
            class="absolute -inset-0.5 border-2 border-cyan-400 pointer-events-none rounded-xs z-40 shadow-[0_0_12px_rgba(0,242,255,0.6)]"
          >
            <!-- Single Selection Only Controls: Rotation Handle & 8 Resizers -->
            <template v-if="selectedIds.length === 1 && !comp.locked">
              <!-- Top Rotation Handle (自由旋转控件) -->
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
                <div 
                  @mousedown="handleStartRotate"
                  class="w-5 h-5 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg hover:scale-110 transition-transform"
                  title="按住旋转 (按Shift吸附15°)"
                >
                  <RotateCw class="w-3 h-3 stroke-[2.5]" />
                </div>
                <div class="w-[1.5px] h-2 bg-cyan-400" />
              </div>

              <!-- 8 Resize Handles -->
              <div @mousedown="handleStartResize($event, 'nw')" class="pointer-events-auto absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-nwse-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 'n')" class="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-ns-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 'ne')" class="pointer-events-auto absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-nesw-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 'e')" class="pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-ew-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 'se')" class="pointer-events-auto absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-nwse-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 's')" class="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-ns-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 'sw')" class="pointer-events-auto absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-nesw-resize rounded-[2px]" />
              <div @mousedown="handleStartResize($event, 'w')" class="pointer-events-auto absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-cyan-400 border-2 border-slate-950 cursor-ew-resize rounded-[2px]" />
            </template>
          </div>
        </div>

        <!-- Marquee Drag Selection Box (拉框多选框) -->
        <div
          v-if="isSelectingMarquee"
          class="absolute border border-cyan-400 bg-cyan-500/15 pointer-events-none z-50 border-dashed"
          :style="{
            left: `${marqueeBox.x}px`,
            top: `${marqueeBox.y}px`,
            width: `${marqueeBox.width}px`,
            height: `${marqueeBox.height}px`
          }"
        />

        <!-- Interactive Straight Line Drawing Live Preview -->
        <svg 
          v-if="drawTool === 'draw-line' && lineDrawing.active" 
          class="absolute inset-0 pointer-events-none w-full h-full z-50 overflow-visible"
        >
          <line
            :x1="lineDrawing.startX"
            :y1="lineDrawing.startY"
            :x2="lineDrawing.currentX"
            :y2="lineDrawing.currentY"
            stroke="#00f2ff"
            stroke-width="3"
            stroke-dasharray="4 4"
          />
          <circle :cx="lineDrawing.startX" :cy="lineDrawing.startY" r="4" fill="#00f2ff" />
          <circle :cx="lineDrawing.currentX" :cy="lineDrawing.currentY" r="4" fill="#00f2ff" />
        </svg>

        <!-- Interactive Polyline Drawing Live Preview -->
        <svg 
          v-if="drawTool === 'draw-polyline' && polylineDrawing.active" 
          class="absolute inset-0 pointer-events-none w-full h-full z-50 overflow-visible"
        >
          <polyline
            :points="`${polylineDrawing.points.map(p => `${p.x},${p.y}`).join(' ')} ${polylineDrawing.currentX},${polylineDrawing.currentY}`"
            fill="none"
            stroke="#00f2ff"
            stroke-width="3"
            stroke-dasharray="4 4"
          />
          <circle 
            v-for="(p, idx) in polylineDrawing.points" 
            :key="idx" 
            :cx="p.x" 
            :cy="p.y" 
            r="4" 
            fill="#00f2ff" 
          />
          <circle :cx="polylineDrawing.currentX" :cy="polylineDrawing.currentY" r="4" fill="#00e5a3" />
        </svg>
      </div>
    </div>

    <!-- Right-Click Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="fixed bg-[#090f1d] border border-cyan-500/50 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-1.5 z-50 backdrop-blur-md w-56 text-xs font-sans text-slate-100"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <template v-if="selectedIds.length > 0">
        <!-- Multi-Selection or Single Selection Header -->
        <div class="px-2.5 py-1.5 text-xs font-bold text-cyan-300 border-b border-slate-800/80 flex items-center justify-between">
          <span class="truncate">{{ selectedIds.length === 1 ? primarySelected?.name : `已选中 ${selectedIds.length} 个元件` }}</span>
          <span v-if="selectedIds.length === 1" class="text-[11px] text-slate-400 font-mono">{{ primarySelected?.rotation || 0 }}°</span>
        </div>

        <div class="py-1 space-y-0.5">
          <!-- Copy (Ctrl+C) -->
          <button
            @click="emit('copy', selectedComponents); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2 font-medium">
              <Copy class="w-3.5 h-3.5 text-cyan-400" />
              <span>复制</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+C</span>
          </button>

          <!-- Cut (Ctrl+X) -->
          <button
            @click="emit('cut', selectedComponents); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2 font-medium">
              <Scissors class="w-3.5 h-3.5 text-amber-400" />
              <span>剪切</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+X</span>
          </button>

          <!-- Paste (Ctrl+V) -->
          <button
            v-if="canPaste"
            @click="emit('paste', { x: contextMenu.canvasX, y: contextMenu.canvasY }); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2 font-medium">
              <Clipboard class="w-3.5 h-3.5 text-emerald-400" />
              <span>粘贴到此处</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+V</span>
          </button>

          <!-- Duplicate (Ctrl+D) -->
          <button
            @click="emit('duplicate', selectedComponents); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2 font-medium">
              <Copy class="w-3.5 h-3.5 text-cyan-300" />
              <span>创建副本</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+D</span>
          </button>
        </div>

        <div class="h-[1px] bg-slate-800 my-1" />

        <div class="py-0.5 space-y-0.5">
          <button
            @click="emit('save:symbol', selectedComponents); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded-md hover:text-emerald-200 cursor-pointer text-emerald-400 font-bold flex items-center gap-2 transition-colors"
          >
            <BookmarkPlus class="w-3.5 h-3.5" />
            <span>封装为自定义图元</span>
          </button>

          <button
            v-if="selectedIds.length === 1 && primarySelected?.children?.length"
            @click="emit('ungroup', primarySelected!); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-amber-500/20 rounded-md hover:text-amber-200 cursor-pointer text-amber-300 font-bold flex items-center gap-2 transition-colors"
          >
            <span>🔓 解散组合为散装图元</span>
          </button>

          <button
            @click="
              const anyLocked = selectedComponents.some(c => c.locked);
              const updated = selectedComponents.map(c => ({ ...c, locked: !anyLocked }));
              emit('update:components', updated);
              closeContextMenu();
            "
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center gap-2 font-medium transition-colors"
          >
            <Lock class="w-3.5 h-3.5 text-cyan-400" />
            <span>{{ selectedComponents.some(c => c.locked) ? '解锁图元' : '锁定图元' }}</span>
          </button>
        </div>

        <!-- Layer Ordering (Single & Multi-select) -->
        <div class="h-[1px] bg-slate-800 my-1" />
        <div class="px-2 py-0.5 text-[10px] text-slate-400 font-bold">图层层级</div>
        <div class="py-0.5 space-y-0.5">
          <button
            @click="emit('bring:front', selectedIds); closeContextMenu();"
            class="w-full text-left px-2.5 py-1 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2">
              <ArrowUpToLine class="w-3.5 h-3.5 text-cyan-400" />
              <span>置于顶层</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+Shift+]</span>
          </button>
          <button
            @click="emit('move:up', selectedIds); closeContextMenu();"
            class="w-full text-left px-2.5 py-1 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2">
              <ChevronUp class="w-3.5 h-3.5 text-cyan-400" />
              <span>上移一层</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+]</span>
          </button>
          <button
            @click="emit('move:down', selectedIds); closeContextMenu();"
            class="w-full text-left px-2.5 py-1 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2">
              <ChevronDown class="w-3.5 h-3.5 text-cyan-400" />
              <span>下移一层</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+[</span>
          </button>
          <button
            @click="emit('send:back', selectedIds); closeContextMenu();"
            class="w-full text-left px-2.5 py-1 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group transition-colors"
          >
            <div class="flex items-center gap-2">
              <ArrowDownToLine class="w-3.5 h-3.5 text-cyan-400" />
              <span>置于底层</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+Shift+[</span>
          </button>
        </div>

        <!-- Multi-Item Alignment Options -->
        <template v-if="selectedIds.length > 1">
          <div class="h-[1px] bg-slate-800 my-1" />
          <div class="px-2 py-0.5 text-[10px] text-slate-400 font-bold">对齐与等间距分布</div>
          <div class="grid grid-cols-4 gap-1 px-1 py-1">
            <button @click="emit('align', 'left'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="左对齐">左对齐</button>
            <button @click="emit('align', 'center'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="水平居中">居中</button>
            <button @click="emit('align', 'right'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="右对齐">右对齐</button>
            <button @click="emit('align', 'distribute-h'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="水平等间距分布">水平均布</button>

            <button @click="emit('align', 'top'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="顶对齐">顶对齐</button>
            <button @click="emit('align', 'middle'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="垂直居中">垂直居中</button>
            <button @click="emit('align', 'bottom'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="底对齐">底对齐</button>
            <button @click="emit('align', 'distribute-v'); closeContextMenu();" class="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 text-slate-200 hover:text-cyan-300 text-center text-[11px] font-medium cursor-pointer" title="垂直等间距分布">垂直均布</button>
          </div>
        </template>

        <div class="h-[1px] bg-slate-800 my-1" />
        <button
          @click="emit('delete', selectedIds); closeContextMenu();"
          class="w-full text-left px-2.5 py-1.5 hover:bg-red-950/80 text-red-300 rounded-md cursor-pointer flex items-center justify-between font-bold transition-colors"
        >
          <div class="flex items-center gap-2">
            <Trash2 class="w-3.5 h-3.5 text-red-400" />
            <span>删除选中元件</span>
          </div>
          <span class="text-[10px] text-red-400 font-mono">Del</span>
        </button>
      </template>
      <template v-else>
        <!-- Canvas Blank Area Context Menu -->
        <div class="px-2.5 py-1.5 text-xs font-bold text-slate-300 border-b border-slate-800/80">
          画布全局操作
        </div>
        <div class="py-1 space-y-0.5">
          <button
            v-if="canPaste"
            @click="emit('paste', { x: contextMenu.canvasX, y: contextMenu.canvasY }); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md text-emerald-300 hover:text-emerald-200 cursor-pointer flex items-center justify-between group font-semibold transition-colors"
          >
            <div class="flex items-center gap-2">
              <Clipboard class="w-3.5 h-3.5 text-emerald-400" />
              <span>粘贴图元到此处</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-emerald-300">Ctrl+V</span>
          </button>
          
          <button
            v-if="components.length > 0"
            @click="emit('select', components.map(c => c.id)); closeContextMenu();"
            class="w-full text-left px-2.5 py-1.5 hover:bg-cyan-500/20 rounded-md hover:text-cyan-200 cursor-pointer flex items-center justify-between group font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <CheckSquare class="w-3.5 h-3.5 text-cyan-400" />
              <span>全选画布图元</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono group-hover:text-cyan-300">Ctrl+A</span>
          </button>

          <div class="px-2.5 py-1 text-[11px] text-slate-400">
            按住鼠标左键在空白处拖拽可拉框多选
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom Status Bar -->
    <div class="h-7 bg-[#060a14] border-t border-cyan-500/20 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 z-30 select-none">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5 text-cyan-300">
          <span class="text-slate-500">坐标:</span>
          <span>X: {{ mousePos.x }} px, Y: {{ mousePos.y }} px</span>
        </div>
        <div class="h-3 w-[1px] bg-slate-800" />
        <div>
          <span class="text-slate-500">分辨率:</span>
          <span class="text-slate-300 ml-1">{{ screen.width }} × {{ screen.height }}</span>
        </div>
        <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
          <div class="h-3 w-[1px] bg-slate-800" />
          <span class="text-slate-500">选中:</span>
          <span class="text-cyan-400 font-bold">
            {{ selectedIds.length === 1 ? primarySelected?.name : `已多选 ${selectedIds.length} 个元件` }}
          </span>
          <span v-if="selectedIds.length === 1" class="text-slate-500">
            ({{ Math.round(primarySelected?.width || 0) }} × {{ Math.round(primarySelected?.height || 0) }}, {{ primarySelected?.rotation || 0 }}°)
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span v-if="drawTool === 'draw-line'" class="text-amber-300 font-bold animate-pulse">
          ⚡ 直线绘制中: 单击确定起点，再单击确定落点 (ESC取消)
        </span>
        <span v-else-if="drawTool === 'draw-polyline'" class="text-amber-300 font-bold animate-pulse">
          ⚡ 折线绘制中: 单击添加拐点，双击或回车结束 (ESC取消)
        </span>
        <span v-else class="text-slate-500">
          支持 Shift+多选 / 拉框多选 / 旋转柄
        </span>
        <div class="h-3 w-[1px] bg-slate-800" />
        <span class="text-cyan-300">缩放: {{ Math.round(zoom * 100) }}%</span>
      </div>
    </div>
  </div>
</template>
