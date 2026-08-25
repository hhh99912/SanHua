export type ComponentCategory = 
  | 'basic'        // 基础图元与控制器 (直线/折线/矩形/圆形/文本/按钮/指示灯)
  | 'electrical'   // 电力一次系统图元 (断路器/手车/隔离开关/主变/互感器/避雷器/母线/电表)
  | 'industrial'   // 工业SCADA与流体 (储罐/管道/泵阀/电机/矩阵/报警)
  | 'charts'       // 统计图表与大屏仪表
  | 'metrics'      // 测控遥测与数据显示
  | 'decoration'   // 科技边框与修饰
  | 'custom'       // 复合组合图元与自定义资产
  | 'drawing'      // 矢量绘制
  | 'media';

export type ComponentType = 
  // 1. Basic & Interactive Primitives (基础图元与控制器)
  | 'draw-line'          // 直线 / 电气导线 (含流动粒子与电压色)
  | 'draw-polyline'      // 折线 / 直角走线 / 绕线母线 (含直角拐弯与流动微粒)
  | 'ctrl-button'        // 工业控制按钮 (含点动/自锁/操作指令/大屏跳转)
  | 'ctrl-indicator'     // 状态指示灯 / 信号灯 (含红绿黄蓝灰多态与闪烁)
  | 'draw-rect'          // 基础矩形 / 圆角矩形 / 科技卡片底座
  | 'draw-circle'        // 基础圆形 / 同心圆环 / 法兰盘
  | 'draw-polygon'       // 正多边形 / 六角形 / 警示菱形
  | 'draw-text'          // 静态文本 / 工业标牌 / 线路标注
  | 'draw-arrow'         // 导向箭头 / 潮流方向指示
  | 'draw-pipe'          // 介质管道 (双线/法兰/流动介质)
  
  // 2. Electrical Power System Primary Components (电力一次系统图元)
  | 'elec-breaker'       // 高压/真空断路器 QF
  | 'elec-handcart'      // 开关柜可抽出式手车
  | 'elec-disconnector'  // 隔离开关 / 隔离刀闸 QS
  | 'elec-grounding'     // 接地刀闸 QE
  | 'elec-transformer'   // 电力主变压器 TM (双绕组/三绕组)
  | 'elec-ct'            // 电流互感器 TA / CT
  | 'elec-pt'            // 电压互感器 TV / PT
  | 'elec-arrester'      // 氧化锌避雷器 F
  | 'elec-busbar'        // 高低压母线段与母联 Busbar
  | 'elec-multimeter'    // 三相微机保护测控多功能电表

  // 3. Composite & Grouped Symbols (SCADA 组合自定义图元)
  | 'composite-symbol'   // 纯图元拼装组合体 (无需SVG，多图元复合容器)
  
  // 4. Charts & Analytics
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'chart-gauge'
  | 'chart-radar'
  | 'chart-scatter'

  // 5. Industrial & SCADA
  | 'ind-tank'
  | 'ind-pipe'
  | 'ind-valve'
  | 'ind-motor'
  | 'ind-alarm-list'
  | 'ind-matrix'

  // 6. Metrics & Text
  | 'metric-float'       // 浮点数数据显示 (默认0.00，支持单位与精度)
  | 'metric-flipper'
  | 'metric-card'
  | 'metric-title'
  | 'metric-progress'

  // 7. Navigation & Multi-Screen Controls
  | 'nav-tabs'

  // 8. Custom Primitives
  | 'custom-svg'
  | 'custom-html'

  // 9. Decorations
  | 'deco-border-neon'
  | 'deco-border-industrial'
  | 'deco-tech-plate'
  | 'deco-corner-bracket'
  | 'deco-hazard-stripe'
  | 'deco-glow-ring'

  // 10. Vector Pen Drawing
  | 'draw-star'
  | 'draw-pen-path'
  | 'draw-svg-icon';

export interface StyleConfig {
  fill?: string;
  fillOpacity?: number;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  stroke?: string;
  strokeWidth?: number;
  strokeDash?: number[];
  strokeLinecap?: 'round' | 'square' | 'butt';
  strokeLinejoin?: 'round' | 'bevel' | 'miter';
  borderRadius?: number;
  opacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  glowColor?: string;
  glowBlur?: number;
  themePreset?: 'cyber-cyan' | 'industrial-amber' | 'hazard-yellow' | 'tech-emerald' | 'crimson-alert' | 'slate-steel';
  customSvgPath?: string;
  customSvgCode?: string;
  customHtmlCode?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  
  // Streamer / Flowing Light (流光动效配置)
  streamer?: boolean;
  streamerColor?: string;
  streamerSpeed?: number;
  streamerType?: 'laser' | 'particle' | 'pulse' | 'dash' | 'glow-wave';
  streamerDirection?: 'forward' | 'backward';
  streamerWidth?: number;

  // State Value & Telemetry Dynamic Mapping
  stateBindingValue?: string | number;
  bladeAngleOpen?: number;
  bladeAngleClosed?: number;
  
  // Electrical Specific Appearance Styles
  breakerColorClosed?: string; // Default Red or Green (合闸色)
  breakerColorOpen?: string;   // Default Green or Red (分闸色)
  voltageLevel?: '500kV' | '220kV' | '110kV' | '35kV' | '10kV' | '0.4kV' | 'DC';
  feederName?: string;
  showLabels?: boolean;

  // Line & Polyline Specific
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineType?: 'straight' | 'step-horizontal' | 'step-vertical' | 'multi-step';
  startArrow?: boolean;
  endArrow?: boolean;
  jointRadius?: number;
  points?: Array<{ x: number; y: number }>;

  // Control Button Specific
  buttonText?: string;
  buttonVariant?: 'solid' | 'outline' | 'glass' | 'metallic' | 'emergency-stop';
  buttonColorTheme?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  buttonIcon?: string;
  isPressed?: boolean;

  // Status Indicator Specific
  indicatorShape?: 'circle' | 'square' | 'ring' | 'pill';
  indicatorState?: 'normal' | 'alarm' | 'warning' | 'standby' | 'offline';
  indicatorColor?: string;
  indicatorBlinkSpeed?: 'none' | 'slow' | 'fast';
  indicatorLabel?: string;
}

export interface AnimationConfig {
  enable?: boolean;
  type?: 'flow' | 'rotate' | 'blink' | 'pulse' | 'wave' | 'counter-up';
  speed?: number; // seconds or rate
  direction?: 'forward' | 'backward' | 'clockwise' | 'counter-clockwise';
  loop?: boolean;
}

export interface DataFieldMapping {
  valueKey?: string;
  titleKey?: string;
  unitKey?: string;
  seriesKey?: string;
  categoriesKey?: string;
  statusKey?: string;
  stateKey?: string; // for breaker/handcart/isolator/indicator state
  voltageKey?: string;
  currentKey?: string;
  powerKey?: string;
  frequencyKey?: string;
  powerFactorKey?: string;
  temperatureKey?: string;
  timestampKey?: string;
  thresholdMax?: number;
  thresholdMin?: number;
  alertLevelKey?: string;
}

export interface ComponentAction {
  type: 'none' | 'jump-screen' | 'toggle-telemetry' | 'open-modal' | 'external-link' | 'dispatch-command';
  targetScreenId?: string;
  telemetryField?: string;
  commandValue?: any;
  url?: string;
  label?: string;
}

export interface ComponentDataConfig {
  datasetId?: string;
  useStatic?: boolean;
  staticData?: any;
  mapping: DataFieldMapping;
  autoRefreshInterval?: number; // in milliseconds
  action?: ComponentAction;
}

export interface CustomSymbolStateDef {
  id: string; // e.g. "1", "2", "3" or "normal", "alarm", "standby"
  name: string; // e.g. "状态 1 (合闸/运行)", "状态 2 (分闸/断开)", "状态 3 (故障/告警)"
  matchValue?: string | number; // Telemetry matched value (e.g. 0, 1, 2, "closed", "open", "alarm")
  description?: string;
  children: ScreenComponent[];
  style?: StyleConfig;
  customProps?: Record<string, any>;
}

export interface ScreenComponent {
  id: string;
  name: string;
  type: ComponentType;
  category: ComponentCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  style: StyleConfig;
  animation?: AnimationConfig;
  data?: ComponentDataConfig;
  customProps?: Record<string, any>;
  // For Composite & Grouped SCADA Custom Symbols
  children?: ScreenComponent[];
  isGroup?: boolean;
  symbolId?: string;
  states?: CustomSymbolStateDef[];
  activeState?: string | number; // e.g. "1", "2", "3"
}

export interface DatasetField {
  name: string;
  type: 'string' | 'number' | 'array' | 'boolean';
  label: string;
  sample: any;
}

export interface DatasetItem {
  id: string;
  name: string;
  description: string;
  type: 'mock' | 'static' | 'api';
  updateIntervalMs: number;
  apiUrl?: string;
  headers?: Record<string, string>;
  data: any;
  fields: DatasetField[];
  isStreaming?: boolean;
}

export interface ScreenConfig {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundGrid: boolean;
  gridSize: number;
  gridColor: string;
  theme: 'cyber-dark' | 'industrial-steel' | 'carbon-matrix' | 'deep-abyss';
  version: string;
  updatedAt: string;
}

export interface CustomSymbolDef {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  type: ComponentType;
  defaultStyle: StyleConfig;
  defaultData?: ComponentDataConfig;
  defaultCustomProps?: Record<string, any>;
  // Visual SCADA Composite Sub-Elements (Completely customizable without raw SVG!)
  children?: ScreenComponent[];
  states?: CustomSymbolStateDef[];
  activeStateId?: string;
  customSvgCode?: string;
  customHtmlCode?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScreenItem {
  id: string;
  name: string;
  description?: string;
  screen: ScreenConfig;
  components: ScreenComponent[];
}

export interface MultiScreenProjectSchema {
  version: string;
  projectName?: string;
  activeScreenId: string;
  screens: ScreenItem[];
  datasets: DatasetItem[];
  customSymbols: CustomSymbolDef[];
  updatedAt: string;
}

export interface ProjectSchema {
  version: string;
  screen: ScreenConfig;
  datasets: DatasetItem[];
  components: ScreenComponent[];
  customSymbols?: CustomSymbolDef[];
  screens?: ScreenItem[];
  activeScreenId?: string;
}

export interface HistorySnapshot {
  screen: ScreenConfig;
  components: ScreenComponent[];
  datasets: DatasetItem[];
  selectedIds: string[];
}
