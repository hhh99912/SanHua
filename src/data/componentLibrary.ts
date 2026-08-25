import { ComponentCategory, ComponentType, ScreenComponent, CustomSymbolStateDef } from '../types';

export interface ComponentDefinition {
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  nameEn: string;
  iconName: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultStyle: ScreenComponent['style'];
  defaultAnimation?: ScreenComponent['animation'];
  defaultData: ScreenComponent['data'];
  defaultCustomProps?: Record<string, any>;
  states?: CustomSymbolStateDef[];
  children?: ScreenComponent[];
}

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // ==========================================
  // 1. Basic Shapes & Interactive Controls (基础图元与控制器)
  // ==========================================
  {
    type: 'draw-line',
    category: 'basic',
    name: '直线 / 电气导线',
    nameEn: 'Straight Line / Wire',
    iconName: 'Minus',
    description: '基础直线与电气导线，支持实线/虚线、电压等级配色、端点箭头与动态能量粒子流光',
    defaultWidth: 240,
    defaultHeight: 24,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 3,
      lineStyle: 'solid',
      voltageLevel: '10kV'
    },
    defaultAnimation: {
      enable: true,
      speed: 1.8,
      type: 'flow'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-polyline',
    category: 'basic',
    name: '折线 / 直角绕线母线',
    nameEn: 'Orthogonal Polyline',
    iconName: 'Workflow',
    description: '直角折线与多段走线母线，支持L型/Z型阶梯拐角、电压等级配色与能量微粒流动',
    defaultWidth: 200,
    defaultHeight: 140,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 3,
      lineType: 'step-horizontal',
      voltageLevel: '10kV'
    },
    defaultAnimation: {
      enable: true,
      speed: 1.8,
      type: 'flow'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'ctrl-button',
    category: 'basic',
    name: '工业控制按钮',
    nameEn: 'Industrial Control Button',
    iconName: 'ToggleRight',
    description: '工业级可交互控制按键，支持点动/自锁/急停旋钮、金属边框、指令触发与大屏页面跳转',
    defaultWidth: 140,
    defaultHeight: 46,
    defaultStyle: {
      buttonText: '设备启动',
      buttonColorTheme: 'cyan',
      buttonVariant: 'solid',
      borderRadius: 8
    },
    defaultData: {
      action: {
        type: 'none',
        label: '按钮操作'
      },
      mapping: {}
    }
  },
  {
    type: 'ctrl-indicator',
    category: 'basic',
    name: '状态指示灯 / 信号灯',
    nameEn: 'LED Status Indicator',
    iconName: 'CircleDot',
    description: '工业LED状态信号灯，支持正常(绿)、告警(红)、预警(黄)、热备(蓝)及闪烁动画与数据集勾连',
    defaultWidth: 120,
    defaultHeight: 36,
    defaultStyle: {
      indicatorShape: 'circle',
      indicatorState: 'normal',
      indicatorBlinkSpeed: 'none',
      indicatorLabel: '1#回路运行中'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        statusKey: 'device_status'
      }
    }
  },
  {
    type: 'draw-rect',
    category: 'basic',
    name: '矩形 / 科技底座',
    nameEn: 'Vector Rectangle',
    iconName: 'Square',
    description: '基础矢量矩形与圆角卡片底座，支持边框、渐变与半透明填充',
    defaultWidth: 200,
    defaultHeight: 140,
    defaultStyle: {
      fill: 'rgba(0, 242, 255, 0.12)',
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 8
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-circle',
    category: 'basic',
    name: '圆形 / 环形节点',
    nameEn: 'Vector Circle',
    iconName: 'Circle',
    description: '基础矢量圆形与同心环，适用于电机转盘、法兰盘或雷达扫描定位',
    defaultWidth: 140,
    defaultHeight: 140,
    defaultStyle: {
      fill: 'rgba(0, 229, 163, 0.15)',
      stroke: '#00e5a3',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-polygon',
    category: 'basic',
    name: '多边形 / 蜂巢网格',
    nameEn: 'Hexagon Polygon',
    iconName: 'Hexagon',
    description: '正六边形或自定义多边形工控装饰基座',
    defaultWidth: 140,
    defaultHeight: 140,
    defaultStyle: {
      fill: 'rgba(59, 130, 246, 0.15)',
      stroke: '#3b82f6',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-text',
    category: 'basic',
    name: '文本标签 / 标牌',
    nameEn: 'Vector Text Label',
    iconName: 'Type',
    description: '发光工业文本标注与间隔铭牌',
    defaultWidth: 200,
    defaultHeight: 46,
    defaultStyle: {
      fill: 'transparent',
      fontSize: 18,
      textColor: '#00f2ff',
      fontWeight: 'bold',
      letterSpacing: 2
    },
    defaultData: {
      mapping: {
        titleKey: '10kV 配电室 #1段'
      }
    }
  },
  {
    type: 'draw-arrow',
    category: 'basic',
    name: '潮流指示箭头',
    nameEn: 'Power Flow Arrow',
    iconName: 'MoveRight',
    description: '指示电力潮流流向与工艺流向的导向箭头',
    defaultWidth: 160,
    defaultHeight: 36,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 3,
      fill: '#00f2ff'
    },
    defaultData: { mapping: {} }
  },

  // ==========================================
  // 2. Metrics & Data Displays
  // ==========================================
  {
    type: 'metric-float',
    category: 'metrics',
    name: '浮点数数据显示 / 遥测值',
    nameEn: 'Float Metric Display',
    iconName: 'Binary',
    description: '基础轻量浮点数数据显示器，默认0.00，支持关联浮点数、小数位与单位',
    defaultWidth: 220,
    defaultHeight: 110,
    defaultStyle: {
      fill: 'rgba(6, 15, 28, 0.85)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 8,
      fontSize: 34,
      textColor: '#00f2ff',
      decimals: 2,
      prefix: '',
      suffix: ' ℃'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '主轴轴承实时温度',
        valueKey: 'temperature',
        unitKey: '℃'
      }
    },
    defaultCustomProps: {
      value: 0.0,
      decimals: 2,
      subText: 'NORMAL'
    }
  },
  {
    type: 'metric-flipper',
    category: 'metrics',
    name: 'LED数码翻牌器',
    nameEn: 'LED Digital Flipper',
    iconName: 'Binary',
    description: '高对比度数码管发光大字，支持千分位与动态翻动过渡',
    defaultWidth: 260,
    defaultHeight: 110,
    defaultStyle: {
      fill: 'rgba(10, 22, 38, 0.9)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 8,
      fontSize: 38,
      fontWeight: 'bold',
      fontFamily: 'monospace',
      textColor: '#00f2ff',
      glowColor: 'rgba(0, 242, 255, 0.6)',
      glowBlur: 14
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '今日累计产量 (PCS)',
        valueKey: 'daily_yield_units',
        unitKey: '件'
      }
    }
  },
  {
    type: 'metric-card',
    category: 'metrics',
    name: '工业KPI指标卡',
    nameEn: 'Industrial KPI Card',
    iconName: 'TrendingUp',
    description: '核心指标卡片，集成环比增减箭头与警戒阈值灯',
    defaultWidth: 240,
    defaultHeight: 120,
    defaultStyle: {
      fill: 'rgba(14, 25, 44, 0.85)',
      stroke: '#3b82f6',
      strokeWidth: 1,
      borderRadius: 8,
      themePreset: 'cyber-cyan'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '综合稼动率 OEE',
        valueKey: 'oee_efficiency_pct',
        unitKey: '%'
      }
    }
  },
  {
    type: 'metric-title',
    category: 'metrics',
    name: '大屏科幻主标题',
    nameEn: 'Sci-Fi Title Banner',
    iconName: 'Heading',
    description: '中央发光工业大屏标题，带副标题及系统实时时钟',
    defaultWidth: 720,
    defaultHeight: 80,
    defaultStyle: {
      fill: 'transparent',
      fontSize: 28,
      fontWeight: 'bold',
      textColor: '#e2f1ff',
      textAlign: 'center',
      letterSpacing: 4
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '智能配电与数字孪生控制中心',
        valueKey: 'factory_name'
      }
    }
  },

  // ==========================================
  // 5. Industrial & SCADA
  // ==========================================
  {
    type: 'ind-tank',
    category: 'industrial',
    name: '反应釜立体储罐',
    nameEn: 'Industrial Vessel Tank',
    iconName: 'Database',
    description: '带动态波浪波纹与液位百分比的工业储罐',
    defaultWidth: 200,
    defaultHeight: 260,
    defaultStyle: {
      fill: 'rgba(10, 20, 35, 0.9)',
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 12,
      themePreset: 'cyber-cyan'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '1#反应釜储液罐',
        valueKey: 'tank_level_percent',
        unitKey: '%'
      }
    }
  },
  {
    type: 'ind-pipe',
    category: 'industrial',
    name: '流体微粒输送管道',
    nameEn: 'Liquid Pipe Flow',
    iconName: 'Workflow',
    description: '透明流体管道，带流动微粒发光动画与流速监测',
    defaultWidth: 320,
    defaultHeight: 45,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 16
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '进料主管线',
        valueKey: 'flow_rate_lpm',
        unitKey: 'L/min'
      }
    }
  },
  {
    type: 'ind-alarm-list',
    category: 'industrial',
    name: '实时告警事件流',
    nameEn: 'SCADA Alarm Log',
    iconName: 'AlertTriangle',
    description: '滚动显示工控节点报警等级、发生时间与处理状态',
    defaultWidth: 460,
    defaultHeight: 280,
    defaultStyle: {
      fill: 'rgba(13, 27, 42, 0.9)',
      stroke: '#ef4444',
      strokeWidth: 1,
      borderRadius: 8,
      themePreset: 'crimson-alert'
    },
    defaultData: {
      datasetId: 'ds-industrial-alarms',
      mapping: {
        titleKey: '工控系统实时事件',
        seriesKey: 'alarms'
      }
    }
  },
  {
    type: 'ind-matrix',
    category: 'industrial',
    name: '设备集群工况矩阵',
    nameEn: 'Equipment Status Matrix',
    iconName: 'Cpu',
    description: '车间多台机床/AGV运行、待机、故障状态灯蜂窝矩阵',
    defaultWidth: 320,
    defaultHeight: 220,
    defaultStyle: {
      fill: 'rgba(13, 27, 42, 0.85)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 8
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '数控机床集群 (12台)'
      }
    }
  },

  // ==========================================
  // 6. Charts & Visualizations
  // ==========================================
  {
    type: 'chart-line',
    category: 'charts',
    name: '实时遥测折线图',
    nameEn: 'Telemetry Spline Chart',
    iconName: 'LineChart',
    description: '工业级平滑渐变折线图，支持双Y轴与报警阈值线',
    defaultWidth: 460,
    defaultHeight: 260,
    defaultStyle: {
      fill: 'rgba(13, 27, 42, 0.85)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 8,
      themePreset: 'cyber-cyan'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '功率与温度趋势',
        categoriesKey: 'series_time',
        seriesKey: 'series_power',
        unitKey: 'kW',
        thresholdMax: 860
      }
    }
  },
  {
    type: 'chart-bar',
    category: 'charts',
    name: '工序产出柱状图',
    nameEn: 'Process Output Bar',
    iconName: 'BarChart3',
    description: '金属质感立体柱状图，高亮显示超出指标工序',
    defaultWidth: 460,
    defaultHeight: 260,
    defaultStyle: {
      fill: 'rgba(13, 27, 42, 0.85)',
      stroke: '#00e5a3',
      strokeWidth: 1,
      borderRadius: 8,
      themePreset: 'tech-emerald'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '各工序产出分布',
        categoriesKey: 'series_categories',
        seriesKey: 'series_line_output',
        unitKey: '件'
      }
    }
  },
  {
    type: 'chart-pie',
    category: 'charts',
    name: '能源配比环形图',
    nameEn: 'Energy Ring Donut',
    iconName: 'PieChart',
    description: '环形带状能耗占比，带中央数值与动态旋转效果',
    defaultWidth: 320,
    defaultHeight: 260,
    defaultStyle: {
      fill: 'rgba(13, 27, 42, 0.85)',
      stroke: '#f59e0b',
      strokeWidth: 1,
      borderRadius: 8,
      themePreset: 'industrial-amber'
    },
    defaultData: {
      datasetId: 'ds-energy-grid',
      mapping: {
        titleKey: '能源供应占比',
        categoriesKey: 'series_tank_names',
        seriesKey: 'series_tank_compare',
        unitKey: '%'
      }
    }
  },
  {
    type: 'chart-gauge',
    category: 'charts',
    name: '工控仪表盘',
    nameEn: 'Scada Dial Gauge',
    iconName: 'Gauge',
    description: '高精度工业转速/压力刻度表盘，带安全绿黄红危险区间',
    defaultWidth: 300,
    defaultHeight: 240,
    defaultStyle: {
      fill: 'rgba(13, 27, 42, 0.85)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 8,
      themePreset: 'cyber-cyan'
    },
    defaultData: {
      datasetId: 'ds-factory-telemetry',
      mapping: {
        titleKey: '主轴运转速度',
        valueKey: 'spindle_speed_rpm',
        unitKey: 'RPM',
        thresholdMax: 4000,
        thresholdMin: 0
      }
    }
  },

  // ==========================================
  // 7. Decorations & Borders
  // ==========================================
  {
    type: 'deco-border-neon',
    category: 'decoration',
    name: '科技荧光边框',
    nameEn: 'Neon Tech Border',
    iconName: 'Frame',
    description: '四角带有亮角与光芒的 DataV 科技感外框容器',
    defaultWidth: 480,
    defaultHeight: 300,
    defaultStyle: {
      fill: 'rgba(8, 16, 30, 0.65)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 4,
      themePreset: 'cyber-cyan'
    },
    defaultData: {
      mapping: {
        titleKey: '遥测监控区域'
      }
    }
  },
  {
    type: 'deco-border-industrial',
    category: 'decoration',
    name: '重工斜切角机甲框',
    nameEn: 'Mecha Chamfer Border',
    iconName: 'SquareCode',
    description: '机械切角与螺栓装饰点缀的重工业框架',
    defaultWidth: 480,
    defaultHeight: 300,
    defaultStyle: {
      fill: 'rgba(15, 23, 38, 0.75)',
      stroke: '#f59e0b',
      strokeWidth: 2,
      themePreset: 'industrial-amber'
    },
    defaultData: {
      mapping: {
        titleKey: '动力机组监控'
      }
    }
  },
  {
    type: 'nav-tabs',
    category: 'custom',
    name: '大屏多页面切换导航条',
    nameEn: 'Multi-Screen Navigation Tabs',
    iconName: 'LayoutDashboard',
    description: '可置于大屏顶部或底部的页面跳转导航栏，支持在运行态一键切换不同大屏',
    defaultWidth: 600,
    defaultHeight: 52,
    defaultStyle: {
      fill: 'rgba(6, 14, 28, 0.92)',
      stroke: '#00f2ff',
      strokeWidth: 1,
      borderRadius: 10
    },
    defaultData: {
      mapping: {}
    }
  }
];

export function getComponentDefinition(type: ComponentType): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find(c => c.type === type);
}
