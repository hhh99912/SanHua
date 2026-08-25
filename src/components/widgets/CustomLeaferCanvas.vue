<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Leafer, Rect, Ellipse, Polygon, Star, Line, Text, Path, Group } from 'leafer-ui';
import { ScreenComponent } from '../../types';

interface Props {
  component: ScreenComponent;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement | null>(null);
let innerMountEl: HTMLDivElement | null = null;
let leaferInstance: any = null;

const initLeafer = () => {
  if (!containerRef.value) return;

  if (leaferInstance) {
    try {
      leaferInstance.destroy();
    } catch {}
    leaferInstance = null;
  }

  if (innerMountEl && innerMountEl.parentNode === containerRef.value) {
    try {
      containerRef.value.removeChild(innerMountEl);
    } catch {}
    innerMountEl = null;
  }

  innerMountEl = document.createElement('div');
  innerMountEl.style.width = '100%';
  innerMountEl.style.height = '100%';
  innerMountEl.style.position = 'relative';
  containerRef.value.appendChild(innerMountEl);

  const { width, height, type, style } = props.component;
  const fillColor = style.fill || '#00f2ff';
  const strokeColor = style.stroke || '#00f2ff';
  const strokeWidth = style.strokeWidth ?? 2;
  const opacity = style.opacity ?? 1;

  try {
    const leafer = new Leafer({
      view: innerMountEl,
      width,
      height,
      fill: 'transparent'
    });
    leaferInstance = leafer;

    // 1. Vector Rectangle
    if (type === 'draw-rect') {
      const rect = new Rect({
        x: 2,
        y: 2,
        width: width - 4,
        height: height - 4,
        fill: fillColor,
        fillOpacity: style.fillOpacity ?? 0.15,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        cornerRadius: style.borderRadius || 4,
        opacity
      });
      leafer.add(rect);
    }
    // 2. Vector Circle / Ellipse
    else if (type === 'draw-circle') {
      const circle = new Ellipse({
        x: 4,
        y: 4,
        width: width - 8,
        height: height - 8,
        fill: fillColor,
        fillOpacity: style.fillOpacity ?? 0.2,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity
      });
      leafer.add(circle);
    }
    // 3. Hexagon / Polygon
    else if (type === 'draw-polygon') {
      const polygon = new Polygon({
        x: width / 2,
        y: height / 2,
        width: width - 10,
        height: height - 10,
        sides: 6,
        fill: fillColor,
        fillOpacity: style.fillOpacity ?? 0.2,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity
      });
      leafer.add(polygon);
    }
    // 4. Five-pointed Star
    else if (type === 'draw-star') {
      const star = new Star({
        x: width / 2,
        y: height / 2,
        width: width - 8,
        height: height - 8,
        points: 5,
        innerRadiusRatio: 0.4,
        fill: fillColor,
        fillOpacity: style.fillOpacity ?? 0.3,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity
      });
      leafer.add(star);
    }
    // 5. Arrow / Guide line
    else if (type === 'draw-arrow' || type === 'draw-line') {
      const midY = height / 2;
      const arrowPath = `M 10 ${midY} L ${width - 25} ${midY} M ${width - 35} ${midY - 8} L ${width - 15} ${midY} L ${width - 35} ${midY + 8}`;
      const line = new Path({
        path: arrowPath,
        stroke: strokeColor,
        strokeWidth: strokeWidth || 3
      });
      leafer.add(line);
    }
    // 6. Vector Text
    else if (type === 'draw-text') {
      const displayText = style.text || props.component.name || '文本标签';
      const fontSize = style.fontSize || Math.max(12, Math.round(height * 0.65));
      const text = new Text({
        x: 4,
        y: Math.max(0, height / 2 - fontSize / 2),
        text: displayText,
        fill: style.textColor || style.stroke || fillColor,
        fontSize: fontSize,
        fontFamily: style.fontFamily || 'monospace',
        fontWeight: (style.fontWeight as any) || 'bold',
        opacity
      });
      leafer.add(text);
    }
    // 7. Custom SVG / Pen Path
    else if (type === 'draw-pen-path' || type === 'draw-svg-icon') {
      const defaultPath = style.customSvgPath || `M 10 10 L ${width - 10} 10 L ${width - 10} ${height - 10} L 10 ${height - 10} Z`;
      const path = new Path({
        path: defaultPath,
        fill: fillColor,
        fillOpacity: style.fillOpacity ?? 0.2,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity
      });
      leafer.add(path);
    }
  } catch (err) {
    console.warn('Leafer render warning:', err);
  }
};

onMounted(() => {
  initLeafer();
});

watch(
  () => [props.component.width, props.component.height, props.component.style, props.component.name],
  () => {
    initLeafer();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (leaferInstance) {
    try {
      leaferInstance.destroy();
    } catch {}
    leaferInstance = null;
  }
  if (innerMountEl && innerMountEl.parentNode) {
    try {
      innerMountEl.parentNode.removeChild(innerMountEl);
    } catch {}
    innerMountEl = null;
  }
});
</script>

<template>
  <div 
    ref="containerRef" 
    class="w-full h-full relative overflow-hidden select-none"
  />
</template>
