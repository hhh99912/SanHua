<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import EChartWidget from './EChartWidget.vue';
import FluidTank from './FluidTank.vue';
import PipeFlow from './PipeFlow.vue';
import DigitalCounter from './DigitalCounter.vue';
import FloatMetric from './FloatMetric.vue';
import CustomSvgWidget from './CustomSvgWidget.vue';
import CustomHtmlWidget from './CustomHtmlWidget.vue';
import StatusMatrix from './StatusMatrix.vue';
import AlarmFeed from './AlarmFeed.vue';
import CyberBorder from './CyberBorder.vue';
import CustomLeaferCanvas from './CustomLeaferCanvas.vue';
import ElectricalBreaker from './ElectricalBreaker.vue';
import ElectricalHandcart from './ElectricalHandcart.vue';
import ElectricalDisconnector from './ElectricalDisconnector.vue';
import ElectricalTransformer from './ElectricalTransformer.vue';
import ElectricalSensor from './ElectricalSensor.vue';
import ElectricalBusbar from './ElectricalBusbar.vue';
import ElectricalMultiMeter from './ElectricalMultiMeter.vue';
import MultiScreenNavWidget from './MultiScreenNavWidget.vue';
import ControlButton from './ControlButton.vue';
import StraightLine from './StraightLine.vue';
import PolyLine from './PolyLine.vue';
import StatusIndicator from './StatusIndicator.vue';
import CompositeSymbol from './CompositeSymbol.vue';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'jump:screen', screenId: string): void;
}>();

const isChart = computed(() => props.component?.category === 'charts' || (typeof props.component?.type === 'string' && props.component.type.startsWith('chart-')));
const isIndustrial = computed(() => props.component?.category === 'industrial' || (typeof props.component?.type === 'string' && props.component.type.startsWith('ind-')));
const isElectrical = computed(() => props.component?.category === 'electrical' || (typeof props.component?.type === 'string' && props.component.type.startsWith('elec-')));
const isDrawing = computed(() => props.component?.category === 'drawing' || ['draw-rect', 'draw-circle', 'draw-polygon', 'draw-star', 'draw-text', 'draw-pen-path', 'draw-svg-icon'].includes(props.component?.type || ''));
const isDecoration = computed(() => props.component?.category === 'decoration' || (typeof props.component?.type === 'string' && props.component.type.startsWith('deco-')));
const isMetrics = computed(() => props.component?.category === 'metrics' || (typeof props.component?.type === 'string' && props.component.type.startsWith('metric-')));
const isCustom = computed(() => props.component?.category === 'custom' || props.component?.type === 'custom-svg' || props.component?.type === 'custom-html');
const isNav = computed(() => props.component?.type === 'nav-tabs');
const isComposite = computed(() => props.component?.type === 'composite-symbol' || Boolean(props.component?.children?.length));
</script>

<template>
  <div v-if="component" class="w-full h-full relative overflow-hidden pointer-events-none">
    <!-- 1. Composite & Grouped SCADA Custom Symbol (Nested primitives without SVG) -->
    <CompositeSymbol
      v-if="isComposite"
      :component="component"
      :datasets="datasets"
      @jump:screen="emit('jump:screen', $event)"
      class="pointer-events-auto"
    />

    <!-- 2. Control Button -->
    <ControlButton
      v-else-if="component.type === 'ctrl-button'"
      :component="component"
      :datasets="datasets"
      @jump:screen="emit('jump:screen', $event)"
      class="pointer-events-auto"
    />

    <!-- 3. Straight Electrical Conductor Line & Arrows -->
    <StraightLine
      v-else-if="component.type === 'draw-line' || component.type === 'draw-arrow'"
      :component="component"
      :datasets="datasets"
    />

    <!-- 4. Polyline / Orthogonal Bus Routing -->
    <PolyLine
      v-else-if="component.type === 'draw-polyline'"
      :component="component"
      :datasets="datasets"
    />

    <!-- 5. Status Indicator / Signal LED Light -->
    <StatusIndicator
      v-else-if="component.type === 'ctrl-indicator'"
      :component="component"
      :datasets="datasets"
    />

    <!-- 6. ECharts Visualizations -->
    <EChartWidget 
      v-else-if="isChart"
      :component="component"
      :datasets="datasets"
    />

    <!-- 7. Electrical Power Primary System Symbols -->
    <div v-else-if="isElectrical" class="w-full h-full">
      <ElectricalBreaker
        v-if="component.type === 'elec-breaker'"
        :component="component"
        :datasets="datasets"
      />
      <ElectricalHandcart
        v-else-if="component.type === 'elec-handcart'"
        :component="component"
        :datasets="datasets"
      />
      <ElectricalDisconnector
        v-else-if="component.type === 'elec-disconnector' || component.type === 'elec-grounding'"
        :component="component"
        :datasets="datasets"
      />
      <ElectricalTransformer
        v-else-if="component.type === 'elec-transformer'"
        :component="component"
        :datasets="datasets"
      />
      <ElectricalSensor
        v-else-if="component.type === 'elec-ct' || component.type === 'elec-pt' || component.type === 'elec-arrester'"
        :component="component"
        :datasets="datasets"
      />
      <ElectricalBusbar
        v-else-if="component.type === 'elec-busbar'"
        :component="component"
        :datasets="datasets"
      />
      <ElectricalMultiMeter
        v-else-if="component.type === 'elec-multimeter'"
        :component="component"
        :datasets="datasets"
      />
    </div>

    <!-- 8. Industrial & SCADA Components -->
    <div v-else-if="isIndustrial" class="w-full h-full">
      <FluidTank 
        v-if="component.type === 'ind-tank'"
        :component="component"
        :datasets="datasets"
      />
      <PipeFlow 
        v-else-if="component.type === 'ind-pipe' || component.type === 'draw-pipe'"
        :component="component"
        :datasets="datasets"
      />
      <StatusMatrix 
        v-else-if="component.type === 'ind-matrix'"
        :component="component"
        :datasets="datasets"
      />
      <AlarmFeed 
        v-else-if="component.type === 'ind-alarm-list'"
        :component="component"
        :datasets="datasets"
      />
      <DigitalCounter 
        v-else
        :component="component"
        :datasets="datasets"
      />
    </div>

    <!-- 9. Navigation Bar -->
    <MultiScreenNavWidget
      v-else-if="isNav"
      :component="component"
      :datasets="datasets"
      @jump:screen="emit('jump:screen', $event)"
      class="pointer-events-auto"
    />

    <!-- 10. Metrics & Digital Displays -->
    <div v-else-if="isMetrics" class="w-full h-full">
      <FloatMetric 
        v-if="component.type === 'metric-float'"
        :component="component"
        :datasets="datasets"
      />
      <DigitalCounter 
        v-else
        :component="component"
        :datasets="datasets"
      />
    </div>

    <!-- 11. Custom User Primitives & Graphics -->
    <div v-else-if="isCustom" class="w-full h-full">
      <CustomSvgWidget 
        v-if="component.type === 'custom-svg'"
        :component="component"
        :datasets="datasets"
      />
      <CustomHtmlWidget 
        v-else-if="component.type === 'custom-html'"
        :component="component"
        :datasets="datasets"
      />
      <div 
        v-else
        class="w-full h-full border border-cyan-500/40 rounded flex items-center justify-center p-2 text-xs font-mono text-cyan-300 bg-cyan-950/30"
      >
        {{ component.name }}
      </div>
    </div>

    <!-- 12. Cyber Decorations & Borders -->
    <CyberBorder 
      v-else-if="isDecoration"
      :component="component"
    />

    <!-- 13. LeaferJS 2D Vector Drawing (Rect, Circle, Polygon, Star, Text) -->
    <CustomLeaferCanvas 
      v-else-if="isDrawing"
      :component="component"
    />

    <!-- Default Fallback -->
    <div 
      v-else
      class="w-full h-full border border-dashed border-cyan-500/50 rounded flex items-center justify-center p-2 text-center text-xs font-mono text-cyan-400 bg-cyan-950/20"
    >
      {{ component.name }}
    </div>
  </div>
</template>
