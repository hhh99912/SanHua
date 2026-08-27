import { ref, computed, Ref } from 'vue';

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasEngineOptions {
  initialZoom?: number;
  initialGridSize?: number;
  initialShowGrid?: boolean;
  initialSnapToGrid?: boolean;
  initialOrthogonalLock?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export function useCanvasEngine(options: CanvasEngineOptions = {}) {
  const zoom = ref<number>(options.initialZoom ?? 1);
  const minZoom = options.minZoom ?? 0.1;
  const maxZoom = options.maxZoom ?? 3.0;

  const panOffset = ref<CanvasPoint>({ x: 0, y: 0 });
  const isPanning = ref<boolean>(false);
  const panStartMouse = ref<CanvasPoint>({ x: 0, y: 0 });
  const panStartOffset = ref<CanvasPoint>({ x: 0, y: 0 });

  // Grid & Snapping State
  const showGrid = ref<boolean>(options.initialShowGrid ?? true);
  const gridSize = ref<number>(options.initialGridSize ?? 20);
  const snapToGrid = ref<boolean>(options.initialSnapToGrid ?? true);
  const orthogonalLock = ref<boolean>(options.initialOrthogonalLock ?? false);

  // Convert Client viewport coordinates (e.clientX, e.clientY) to Canvas coordinates (snapped or raw)
  const clientToCanvas = (
    clientX: number,
    clientY: number,
    containerElement: HTMLElement | null,
    forceRaw: boolean = false,
    customZoom?: number
  ): { x: number; y: number; rawX: number; rawY: number } => {
    if (!containerElement) {
      return { x: 0, y: 0, rawX: 0, rawY: 0 };
    }
    const rect = containerElement.getBoundingClientRect();
    const mouseViewportX = clientX - rect.left;
    const mouseViewportY = clientY - rect.top;

    const currentZoom = customZoom || zoom.value || 1;
    const rawX = (mouseViewportX - panOffset.value.x) / currentZoom;
    const rawY = (mouseViewportY - panOffset.value.y) / currentZoom;

    let x = Math.round(rawX);
    let y = Math.round(rawY);

    if (!forceRaw && snapToGrid.value && gridSize.value > 0) {
      x = Math.round(rawX / gridSize.value) * gridSize.value;
      y = Math.round(rawY / gridSize.value) * gridSize.value;
    }

    return { x, y, rawX, rawY };
  };

  // Convert Canvas coordinates to Container viewport coordinates
  const canvasToViewport = (canvasX: number, canvasY: number): CanvasPoint => {
    return {
      x: canvasX * zoom.value + panOffset.value.x,
      y: canvasY * zoom.value + panOffset.value.y
    };
  };

  // Orthogonal lock calculation (0°, 90°, 45°)
  const calculateOrthogonalPoint = (
    startX: number,
    startY: number,
    currentX: number,
    currentY: number
  ): CanvasPoint => {
    const dx = currentX - startX;
    const dy = currentY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Horizontal lock
    if (absDx >= 2.2 * absDy) {
      return { x: currentX, y: startY };
    }
    // Vertical lock
    if (absDy >= 2.2 * absDx) {
      return { x: startX, y: currentY };
    }
    // 45 degree diagonal lock
    const dist = Math.round((absDx + absDy) / 2);
    const signX = dx >= 0 ? 1 : -1;
    const signY = dy >= 0 ? 1 : -1;
    return {
      x: startX + dist * signX,
      y: startY + dist * signY
    };
  };

  // Mouse Wheel Zoom centered on cursor
  const handleWheelZoom = (
    e: WheelEvent,
    containerElement: HTMLElement | null,
    onZoomChange?: (newZoom: number) => void
  ) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const oldZoom = zoom.value;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, Number((oldZoom + delta).toFixed(2))));
    if (newZoom === oldZoom) return;

    if (containerElement) {
      const rect = containerElement.getBoundingClientRect();
      const mouseViewportX = e.clientX - rect.left;
      const mouseViewportY = e.clientY - rect.top;

      // Keep point under mouse fixed:
      const canvasX = (mouseViewportX - panOffset.value.x) / oldZoom;
      const canvasY = (mouseViewportY - panOffset.value.y) / oldZoom;

      panOffset.value.x = Math.round(mouseViewportX - canvasX * newZoom);
      panOffset.value.y = Math.round(mouseViewportY - canvasY * newZoom);
    }

    zoom.value = newZoom;
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  };

  // Start Canvas Pan
  const startPan = (clientX: number, clientY: number) => {
    isPanning.value = true;
    panStartMouse.value = { x: clientX, y: clientY };
    panStartOffset.value = { ...panOffset.value };
  };

  // Update Canvas Pan
  const updatePan = (clientX: number, clientY: number) => {
    if (!isPanning.value) return;
    const dx = clientX - panStartMouse.value.x;
    const dy = clientY - panStartMouse.value.y;
    panOffset.value = {
      x: Math.round(panStartOffset.value.x + dx),
      y: Math.round(panStartOffset.value.y + dy)
    };
  };

  // End Canvas Pan
  const endPan = () => {
    isPanning.value = false;
  };

  // Reset Pan & Center View
  const centerCanvasInViewport = (
    canvasWidth: number,
    canvasHeight: number,
    containerElement: HTMLElement | null
  ) => {
    if (!containerElement) return;
    const rect = containerElement.getBoundingClientRect();
    const availableW = rect.width;
    const availableH = rect.height;

    // Calculate fit zoom
    const zoomW = (availableW - 80) / canvasWidth;
    const zoomH = (availableH - 80) / canvasHeight;
    const fitZoom = Math.min(1.2, Math.max(0.15, Number(Math.min(zoomW, zoomH).toFixed(2))));

    zoom.value = fitZoom;
    panOffset.value = {
      x: Math.round((availableW - canvasWidth * fitZoom) / 2),
      y: Math.round((availableH - canvasHeight * fitZoom) / 2)
    };
  };

  // Calculate Content Bounding Box of all components
  const getContentBoundingBox = (
    components: Array<{ x: number; y: number; width: number; height: number }>
  ) => {
    if (!components || components.length === 0) {
      return null;
    }
    const minX = Math.min(...components.map(c => c.x));
    const minY = Math.min(...components.map(c => c.y));
    const maxX = Math.max(...components.map(c => c.x + c.width));
    const maxY = Math.max(...components.map(c => c.y + c.height));
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(10, maxX - minX),
      height: Math.max(10, maxY - minY)
    };
  };

  // Snap All Components to nearest grid nodes
  const snapAllToGrid = <T extends { x: number; y: number; width: number; height: number }>(
    components: T[],
    customGridSize?: number
  ): T[] => {
    const gs = customGridSize || gridSize.value || 10;
    return components.map(c => ({
      ...c,
      x: Math.round(c.x / gs) * gs,
      y: Math.round(c.y / gs) * gs,
      width: Math.max(gs, Math.round(c.width / gs) * gs),
      height: Math.max(gs, Math.round(c.height / gs) * gs)
    }));
  };

  // Center All Components in canvas
  const centerAllInCanvas = <T extends { x: number; y: number; width: number; height: number }>(
    components: T[],
    canvasWidth: number,
    canvasHeight: number
  ): T[] => {
    const bbox = getContentBoundingBox(components);
    if (!bbox) return components;

    const targetX = Math.round((canvasWidth - bbox.width) / 2);
    const targetY = Math.round((canvasHeight - bbox.height) / 2);
    const dx = targetX - bbox.minX;
    const dy = targetY - bbox.minY;

    return components.map(c => ({
      ...c,
      x: c.x + dx,
      y: c.y + dy
    }));
  };

  // Crop Canvas to content minimal bounding box
  const cropCanvasToContent = <T extends { x: number; y: number; width: number; height: number }>(
    components: T[],
    padding: number = 20,
    minDimension: number = 40
  ): {
    newWidth: number;
    newHeight: number;
    updatedComponents: T[];
  } | null => {
    const bbox = getContentBoundingBox(components);
    if (!bbox) return null;

    const gs = gridSize.value || 10;
    const pad = Math.max(gs, Math.round(padding / gs) * gs);

    const calculatedW = bbox.width + pad * 2;
    const calculatedH = bbox.height + pad * 2;

    const newWidth = Math.max(minDimension, Math.ceil(calculatedW / gs) * gs);
    const newHeight = Math.max(minDimension, Math.ceil(calculatedH / gs) * gs);

    const dx = pad - bbox.minX;
    const dy = pad - bbox.minY;

    const updatedComponents = components.map(c => ({
      ...c,
      x: c.x + dx,
      y: c.y + dy
    }));

    return {
      newWidth,
      newHeight,
      updatedComponents
    };
  };

  return {
    zoom,
    minZoom,
    maxZoom,
    panOffset,
    isPanning,
    showGrid,
    gridSize,
    snapToGrid,
    orthogonalLock,
    clientToCanvas,
    canvasToViewport,
    calculateOrthogonalPoint,
    handleWheelZoom,
    startPan,
    updatePan,
    endPan,
    centerCanvasInViewport,
    getContentBoundingBox,
    snapAllToGrid,
    centerAllInCanvas,
    cropCanvasToContent
  };
}
