<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { resolveComponentDynamicData, parseStrictNumber } from '../../utils/scadaResolver';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const metricState = computed(() => {
  const { style, customProps } = props.component;
  const dynamic = resolveComponentDynamicData(props.component, props.datasets);

  const decimals = typeof style?.decimals === 'number' 
    ? style.decimals 
    : (typeof customProps?.decimals === 'number' ? customProps.decimals : (typeof dynamic.decimals === 'number' ? dynamic.decimals : 2));

  // Strict numeric resolution: strictly numeric, no text
  const rawVal = dynamic.value !== undefined ? dynamic.value : (customProps?.value ?? 0.0);
  const num = parseStrictNumber(rawVal, 0.0);
  const formattedVal = num.toFixed(Math.max(0, Math.min(6, decimals)));

  const pointUnit = dynamic.unit ?? customProps?.unit ?? style?.unit ?? '';
  const pointLabel = dynamic.label ?? customProps?.label ?? '';

  const textColor = style.textColor || style.fill || customProps?.textColor || '#00f2ff';
  const bgColor = style.fill === 'transparent' || !style.fill ? (customProps?.bgColor || 'transparent') : style.fill;
  const borderColor = style.stroke || customProps?.borderColor || 'transparent';
  const borderWidth = style.strokeWidth ?? (borderColor !== 'transparent' ? 1 : 0);
  const borderRadius = style.borderRadius ? `${style.borderRadius}px` : '4px';
  const displayStyle = customProps?.displayStyle || customProps?.metricStyle || style.displayStyle || style.metricStyle || 'pure-digital';

  // Progress Bar min / max computation
  const minVal = parseStrictNumber(dynamic.min ?? customProps?.min ?? 0, 0);
  const maxVal = parseStrictNumber(dynamic.max ?? customProps?.max ?? 100, 100);
  const progressRatio = Math.min(1, Math.max(0, (num - minVal) / Math.max(1, maxVal - minVal)));
  const progressPercent = Math.round(progressRatio * 100);

  // Calculate SVG viewBox width based on character length for tightest 1:1 vector fit
  const strLen = Math.max(1, formattedVal.length + (pointUnit ? pointUnit.length + 0.8 : 0));
  const charWidth = strLen * 20 + 8;

  return {
    num,
    value: formattedVal,
    unit: pointUnit,
    label: pointLabel,
    textColor,
    bgColor,
    borderColor,
    borderWidth,
    borderRadius,
    displayStyle,
    progressPercent,
    viewWidth: charWidth
  };
});
</script>

<template>
  <div 
    class="w-full h-full flex items-center justify-center p-0 m-0 select-none overflow-hidden relative"
    :style="{ 
      backgroundColor: metricState.bgColor,
      borderColor: metricState.borderColor,
      borderWidth: `${metricState.borderWidth}px`,
      borderRadius: metricState.borderRadius
    }"
  >
    <!-- 1. STYLE: Cyber Badge (科技胶囊光标微框) -->
    <div 
      v-if="metricState.displayStyle === 'cyber-badge'"
      class="w-full h-full flex items-center justify-center px-1.5 py-0.5 rounded border shadow-lg relative bg-[#040918]/90"
      :style="{ borderColor: withAlpha(metricState.textColor, 0.4), boxShadow: `0 0 10px ${withAlpha(metricState.textColor, 0.2)}` }"
    >
      <div class="flex items-baseline gap-1 overflow-hidden">
        <span v-if="metricState.label" class="text-[10px] font-mono text-slate-400 mr-0.5 truncate">{{ metricState.label }}:</span>
        <span 
          class="font-mono font-black text-base md:text-lg tracking-wider"
          :style="{ color: metricState.textColor, textShadow: `0 0 8px ${withAlpha(metricState.textColor, 0.6)}` }"
        >
          {{ metricState.value }}
        </span>
        <span v-if="metricState.unit" class="text-[10px] font-mono font-bold text-slate-400 ml-0.5">
          {{ metricState.unit }}
        </span>
      </div>
      <!-- Corner Accents -->
      <div class="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l" :style="{ borderColor: metricState.textColor }"></div>
      <div class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r" :style="{ borderColor: metricState.textColor }"></div>
    </div>

    <!-- 2. STYLE: 7-Segment LED (经典7段工业数码管) -->
    <div 
      v-else-if="metricState.displayStyle === 'led-segment'"
      class="w-full h-full flex items-center justify-center bg-[#030712] px-1.5 py-0.5 rounded border border-slate-800 shadow-inner"
    >
      <div class="flex items-baseline gap-1 font-mono">
        <span 
          class="font-black text-base md:text-xl tracking-widest font-mono"
          :style="{ 
            color: metricState.textColor, 
            textShadow: `0 0 8px ${metricState.textColor}`,
            fontFamily: 'monospace, Courier, sans-serif'
          }"
        >
          {{ metricState.value }}
        </span>
        <span v-if="metricState.unit" class="text-xs font-bold text-slate-400">
          {{ metricState.unit }}
        </span>
      </div>
    </div>

    <!-- 3. STYLE: Neon Glow (赛博霓虹双色发光) -->
    <div 
      v-else-if="metricState.displayStyle === 'neon-glow'"
      class="w-full h-full flex items-center justify-center p-0.5"
    >
      <div class="flex items-baseline gap-1 text-center">
        <span 
          class="font-mono font-black text-base md:text-xl tracking-wide"
          :style="{
            color: '#ffffff',
            textShadow: `0 0 4px #fff, 0 0 8px ${metricState.textColor}, 0 0 16px ${metricState.textColor}`
          }"
        >
          {{ metricState.value }}
        </span>
        <span v-if="metricState.unit" class="text-xs font-mono font-extrabold text-cyan-300" :style="{ textShadow: `0 0 6px ${metricState.textColor}` }">
          {{ metricState.unit }}
        </span>
      </div>
    </div>

    <!-- 4. STYLE: Industrial Tag (工业测点卡片标牌) -->
    <div 
      v-else-if="metricState.displayStyle === 'industrial-tag'"
      class="w-full h-full flex flex-col justify-between p-1 rounded bg-[#060c1d] border border-slate-700 shadow-md"
    >
      <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-800 pb-0.5">
        <span class="truncate font-semibold">{{ metricState.label || component.name || '测点' }}</span>
        <span v-if="metricState.unit" class="text-cyan-400 font-bold ml-1">{{ metricState.unit }}</span>
      </div>
      <div class="flex items-center justify-end font-mono font-black text-sm md:text-base" :style="{ color: metricState.textColor }">
        {{ metricState.value }}
      </div>
    </div>

    <!-- 5. STYLE: Progress Bar (微型条形量程百分比数值) -->
    <div 
      v-else-if="metricState.displayStyle === 'progress-bar'"
      class="w-full h-full flex flex-col justify-center px-1.5 py-0.5 rounded bg-[#030712]/80 border border-slate-800"
    >
      <div class="flex items-baseline justify-between font-mono text-xs mb-0.5">
        <span class="text-slate-400 text-[10px] truncate">{{ metricState.label || '量程' }}</span>
        <div class="flex items-baseline gap-0.5">
          <span class="font-bold font-mono" :style="{ color: metricState.textColor }">{{ metricState.value }}</span>
          <span v-if="metricState.unit" class="text-[9px] text-slate-400">{{ metricState.unit }}</span>
        </div>
      </div>
      <!-- Progress Bar Track -->
      <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
        <div 
          class="h-full rounded-full transition-all duration-300"
          :style="{ 
            width: `${metricState.progressPercent}%`, 
            backgroundColor: metricState.textColor,
            boxShadow: `0 0 6px ${metricState.textColor}`
          }"
        />
      </div>
    </div>

    <!-- 6. STYLE: Meter Box (工业仪表黑匣金属底盒) -->
    <div 
      v-else-if="metricState.displayStyle === 'meter-box'"
      class="w-full h-full flex items-center justify-center px-1.5 py-0.5 rounded bg-[#080d1a] border-2 border-slate-700 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] relative"
    >
      <!-- Simulated Corner Screws -->
      <div class="absolute top-1 left-1 w-1 h-1 rounded-full bg-slate-500"></div>
      <div class="absolute top-1 right-1 w-1 h-1 rounded-full bg-slate-500"></div>
      <div class="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-slate-500"></div>
      <div class="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-slate-500"></div>

      <div class="flex items-baseline gap-1 font-mono">
        <span 
          class="font-black text-sm md:text-base tracking-wider"
          :style="{ color: metricState.textColor, textShadow: `0 0 6px ${metricState.textColor}80` }"
        >
          {{ metricState.value }}
        </span>
        <span v-if="metricState.unit" class="text-[10px] font-bold text-slate-400">
          {{ metricState.unit }}
        </span>
      </div>
    </div>

    <!-- 7. STYLE: Pure Digital (默认极简等宽自适应数码 - 100% SVG 贴合缩放，无留白) -->
    <div 
      v-else
      class="w-full h-full flex items-center justify-center p-0 m-0"
    >
      <svg 
        :viewBox="`0 0 ${metricState.viewWidth} 34`" 
        class="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
      >
        <text 
          :x="metricState.viewWidth / 2" 
          y="26" 
          text-anchor="middle" 
          font-family="monospace, 'Chakra Petch', sans-serif" 
          font-weight="900" 
          font-size="28" 
          letter-spacing="0.5"
          :fill="metricState.textColor"
          :style="{ filter: `drop-shadow(0 0 4px ${withAlpha(metricState.textColor, 0.6)})` }"
        >
          {{ metricState.value }}<tspan v-if="metricState.unit" font-size="16" font-weight="600" fill="#94a3b8"> {{ metricState.unit }}</tspan>
        </text>
      </svg>
    </div>
  </div>
</template>
