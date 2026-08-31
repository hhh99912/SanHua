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
  // 1. Basic Conventional Primitives & Controllers (常规基础图元与控制器)
  // ==========================================
  {
    type: 'draw-rect',
    category: 'basic',
    name: '矩形 / 科技底座',
    nameEn: 'Rectangle',
    iconName: 'Square',
    description: '基础矢量矩形与直角底座，支持描边、半透明背景与渐变填充',
    defaultWidth: 160,
    defaultHeight: 100,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.15,
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 0
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-rounded-rect',
    category: 'basic',
    name: '圆角矩形',
    nameEn: 'Rounded Rectangle',
    iconName: 'Square',
    description: '带圆角半径的矩形底框，适用于科技面板、卡片容器与监控视窗',
    defaultWidth: 160,
    defaultHeight: 100,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.15,
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 12
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-circle',
    category: 'basic',
    name: '正圆形',
    nameEn: 'Circle',
    iconName: 'Circle',
    description: '标准正圆形图元，适合用作测点标记、设备转子、状态点与节点徽章',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#00e5a3',
      fillOpacity: 0.15,
      stroke: '#00e5a3',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-ellipse',
    category: 'basic',
    name: '椭圆形',
    nameEn: 'Ellipse',
    iconName: 'Circle',
    description: '矢量椭圆形，支持横向或纵向扁平展示，常用于工艺区域圈定与管道法兰',
    defaultWidth: 160,
    defaultHeight: 90,
    defaultStyle: {
      fill: '#38bdf8',
      fillOpacity: 0.15,
      stroke: '#38bdf8',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-triangle',
    category: 'basic',
    name: '正三角形 (向上)',
    nameEn: 'Triangle Up',
    iconName: 'Triangle',
    description: '向上正三角形，常用于上升趋势标记、主变绕组角接标识与警示符',
    defaultWidth: 120,
    defaultHeight: 110,
    defaultStyle: {
      fill: '#f59e0b',
      fillOpacity: 0.18,
      stroke: '#f59e0b',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-triangle-down',
    category: 'basic',
    name: '倒三角形 (向下)',
    nameEn: 'Triangle Down',
    iconName: 'Triangle',
    description: '向下三角形，常用于变电接地受电引下线、料仓下料口与下降标示',
    defaultWidth: 120,
    defaultHeight: 110,
    defaultStyle: {
      fill: '#ef4444',
      fillOpacity: 0.18,
      stroke: '#ef4444',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-triangle-right',
    category: 'basic',
    name: '向右三角形',
    nameEn: 'Triangle Right',
    iconName: 'Triangle',
    description: '向右三角形，常用于物料流向、流程图进入端口与播放指示',
    defaultWidth: 120,
    defaultHeight: 100,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.18,
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-diamond',
    category: 'basic',
    name: '菱形 / 判定框',
    nameEn: 'Diamond / Rhombus',
    iconName: 'Diamond',
    description: '工业流程判定菱形，常用于逻辑决策节点、阀门开度与交直流转换标志',
    defaultWidth: 130,
    defaultHeight: 130,
    defaultStyle: {
      fill: '#a855f7',
      fillOpacity: 0.18,
      stroke: '#a855f7',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-pentagon',
    category: 'basic',
    name: '正五边形',
    nameEn: 'Pentagon',
    iconName: 'Hexagon',
    description: '正五边形几何图元，适用于特殊拓扑节点与工艺防护区域',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#10b981',
      fillOpacity: 0.18,
      stroke: '#10b981',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-hexagon',
    category: 'basic',
    name: '正六边形 / 蜂巢',
    nameEn: 'Hexagon',
    iconName: 'Hexagon',
    description: '正六边形图元，可无缝拼接为蜂巢阵列，常用于多单元数据集成',
    defaultWidth: 130,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.18,
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-octagon',
    category: 'basic',
    name: '正八边形',
    nameEn: 'Octagon',
    iconName: 'Hexagon',
    description: '正八边形几何图元，常用于工业停机标牌与安全联锁防护警示',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#ef4444',
      fillOpacity: 0.18,
      stroke: '#ef4444',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-star',
    category: 'basic',
    name: '五角星',
    nameEn: '5-Point Star',
    iconName: 'Star',
    description: '标准五角星，常用于变电枢纽重点关注、特级负荷与标杆指标',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#f59e0b',
      fillOpacity: 0.25,
      stroke: '#f59e0b',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-star4',
    category: 'basic',
    name: '四角芒星 / 光芒',
    nameEn: '4-Point Star',
    iconName: 'Sparkles',
    description: '四角芒星图元，常用于高亮告警闪烁点、母线故障放电与科技动效',
    defaultWidth: 110,
    defaultHeight: 110,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.3,
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-trapezoid',
    category: 'basic',
    name: '等腰梯形',
    nameEn: 'Trapezoid',
    iconName: 'Square',
    description: '等腰梯形几何图元，适用于变压器箱体、漏斗料斗与通风管口',
    defaultWidth: 150,
    defaultHeight: 90,
    defaultStyle: {
      fill: '#38bdf8',
      fillOpacity: 0.18,
      stroke: '#38bdf8',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-parallelogram',
    category: 'basic',
    name: '平行四边形',
    nameEn: 'Parallelogram',
    iconName: 'Square',
    description: '平行四边形图元，常用于流程图输入输出块与倾斜传送带',
    defaultWidth: 150,
    defaultHeight: 90,
    defaultStyle: {
      fill: '#00e5a3',
      fillOpacity: 0.18,
      stroke: '#00e5a3',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-cross',
    category: 'basic',
    name: '十字形 / 加号',
    nameEn: 'Cross / Plus',
    iconName: 'Plus',
    description: '十字形几何图元，常用于安全应急标志、消防喷淋与配电交叉点',
    defaultWidth: 110,
    defaultHeight: 110,
    defaultStyle: {
      fill: '#ef4444',
      fillOpacity: 0.2,
      stroke: '#ef4444',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-ring',
    category: 'basic',
    name: '同心圆环',
    nameEn: 'Ring / Donut',
    iconName: 'Disc',
    description: '同心圆环图元，适用于中空法兰盘、轴承套圈与雷达同心圆刻度',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.25,
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-sector',
    category: 'basic',
    name: '扇形 / 饼块',
    nameEn: 'Sector / Pie Slice',
    iconName: 'PieChart',
    description: '扇形圆弧切片，常用于阀门开度角度、风机叶片与仪表扫描扇区',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      fill: '#a855f7',
      fillOpacity: 0.2,
      stroke: '#a855f7',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-heart',
    category: 'basic',
    name: '心形',
    nameEn: 'Heart',
    iconName: 'Heart',
    description: '心形图元，适用于健康状态监测、生命体征与重点关怀设备',
    defaultWidth: 110,
    defaultHeight: 100,
    defaultStyle: {
      fill: '#f43f5e',
      fillOpacity: 0.2,
      stroke: '#f43f5e',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-bubble',
    category: 'basic',
    name: '对话气泡 / 标注框',
    nameEn: 'Speech Bubble',
    iconName: 'MessageSquare',
    description: '带尾巴的说明气泡框，常用于设备提示信息、报警引出说明与操作批注',
    defaultWidth: 160,
    defaultHeight: 110,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.15,
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 8
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-cube',
    category: 'basic',
    name: '3D等轴立方体',
    nameEn: '3D Cube',
    iconName: 'Box',
    description: '3D轴测等轴立体箱体，具备顶面、左面、右面三层阴影立体质感',
    defaultWidth: 120,
    defaultHeight: 130,
    defaultStyle: {
      fill: '#38bdf8',
      fillOpacity: 0.25,
      stroke: '#38bdf8',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-cylinder',
    category: 'basic',
    name: '圆柱体 / 储罐几何',
    nameEn: 'Cylinder',
    iconName: 'Database',
    description: '立式圆柱体几何造型，适用于工业储气罐、油罐与化学反应釜底图',
    defaultWidth: 110,
    defaultHeight: 150,
    defaultStyle: {
      fill: '#00e5a3',
      fillOpacity: 0.2,
      stroke: '#00e5a3',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-arc',
    category: 'basic',
    name: '曲线弧线',
    nameEn: 'Arc Curve',
    iconName: 'Minus',
    description: '二次贝塞尔圆滑弧线，适用于管道弯曲流向、电力相量轨迹与连线',
    defaultWidth: 160,
    defaultHeight: 90,
    defaultStyle: {
      fill: 'transparent',
      stroke: '#00f2ff',
      strokeWidth: 3,
      lineStyle: 'solid'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-arrow',
    category: 'basic',
    name: '单向导向箭头',
    nameEn: 'Single Arrow',
    iconName: 'MoveRight',
    description: '单向实体指示箭头，常用于工艺物流方向、电力潮流流向与管网水流',
    defaultWidth: 150,
    defaultHeight: 50,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.25,
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-double-arrow',
    category: 'basic',
    name: '双向导向箭头',
    nameEn: 'Double Arrow',
    iconName: 'ArrowLeftRight',
    description: '双向指示箭头，常用于双向通信总线、储能双向充放电与联络线',
    defaultWidth: 160,
    defaultHeight: 50,
    defaultStyle: {
      fill: '#f59e0b',
      fillOpacity: 0.25,
      stroke: '#f59e0b',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'draw-elbow',
    category: 'basic',
    name: '直角弯头管',
    nameEn: 'Elbow Pipe',
    iconName: 'CornerDownRight',
    description: '90度直角弯头管，适用于工业流体转弯与电气电缆拐弯通道',
    defaultWidth: 110,
    defaultHeight: 110,
    defaultStyle: {
      fill: '#00f2ff',
      fillOpacity: 0.2,
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
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
    type: 'draw-text',
    category: 'basic',
    name: '静态文本 / 工业标牌',
    nameEn: 'Text / Nameplate',
    iconName: 'Type',
    description: '工业矢量文本标牌与设备铭牌，支持字号、字体、荧光描边与发光效果',
    defaultWidth: 160,
    defaultHeight: 40,
    defaultStyle: {
      text: '10kV 配电室 #1 主变',
      fontSize: 16,
      fontWeight: 'bold',
      textColor: '#00f2ff'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'ctrl-button',
    category: 'basic',
    name: '工业控制按钮',
    nameEn: 'Industrial Control Button',
    iconName: 'ToggleRight',
    description: '工业级可交互控制按键，支持遥控分合闸下发、金属边框、指令触发与页面跳转',
    defaultWidth: 140,
    defaultHeight: 46,
    defaultStyle: {
      buttonText: '断路器合闸',
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
    name: '状态指示灯 (0/1/2)',
    nameEn: 'LED Status Indicator',
    iconName: 'CircleDot',
    description: '工业LED状态信号灯，支持 0:分闸/停止(绿/灰), 1:合闸/运行(红/绿), 2:故障/告警(黄/红闪烁)',
    defaultWidth: 130,
    defaultHeight: 36,
    defaultStyle: {
      indicatorShape: 'circle',
      indicatorState: 'normal',
      indicatorBlinkSpeed: 'none',
      indicatorLabel: '1#进线状态'
    },
    defaultData: {
      datasetId: 'ds-scada-station',
      mapping: {
        statusKey: 'DEV_101_YX_1'
      }
    }
  },

  // ==========================================
  // 2. Electrical Power System Primary Components (电力一次系统图元)
  // ==========================================
  {
    type: 'elec-breaker',
    category: 'electrical',
    name: '高压真空断路器 QF (0/1/2)',
    nameEn: 'HV Vacuum Circuit Breaker',
    iconName: 'Zap',
    description: '国标/IEC标准高压真空断路器，支持 0:分闸(断开/绿), 1:合闸(闭合/红), 2:故障(跳闸/黄)',
    defaultWidth: 70,
    defaultHeight: 90,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2.5,
      breakerColorClosed: '#ef4444',
      breakerColorOpen: '#10b981'
    },
    defaultCustomProps: {
      state: 1 // 1: 合闸, 0: 分闸, 2: 故障
    },
    defaultData: {
      datasetId: 'ds-scada-station',
      mapping: {
        stateKey: 'DEV_101_YX_1'
      }
    }
  },
  {
    type: 'elec-handcart',
    category: 'electrical',
    name: '开关柜抽出式手车 (0/1/2)',
    nameEn: 'Switchgear Withdrawable Handcart',
    iconName: 'Layers',
    description: 'KYN28高压开关柜可抽出式断路器手车，支持 0:试验位置, 1:工作位置, 2:检修隔离',
    defaultWidth: 80,
    defaultHeight: 90,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultCustomProps: {
      position: 1 // 1: 工作位置, 0: 试验位置, 2: 检修
    },
    defaultData: {
      datasetId: 'ds-scada-station',
      mapping: {
        stateKey: 'DEV_101_YX_2'
      }
    }
  },
  {
    type: 'elec-disconnector',
    category: 'electrical',
    name: '隔离开关 / 刀闸 QS (0/1/2)',
    nameEn: 'Isolator Switch / Disconnector',
    iconName: 'ZapOff',
    description: '电力隔离开关，支持 0:分闸(隔离), 1:合闸(导通), 2:故障',
    defaultWidth: 60,
    defaultHeight: 70,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2.5
    },
    defaultCustomProps: {
      state: 1
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-grounding',
    category: 'electrical',
    name: '接地刀闸 QE (0/1/2)',
    nameEn: 'Grounding Disconnector Switch',
    iconName: 'Minus',
    description: '高压出线/母线快速接地刀闸，支持 0:分闸, 1:合闸(接地导通), 2:故障',
    defaultWidth: 60,
    defaultHeight: 70,
    defaultStyle: {
      stroke: '#eab308',
      strokeWidth: 2.5
    },
    defaultCustomProps: {
      state: 0
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-transformer',
    category: 'electrical',
    name: '电力主变压器 TM',
    nameEn: 'Power Transformer',
    iconName: 'Activity',
    description: '双绕组/三绕组电力变压器，双圆相交标准电力符号，带油温与瓦斯信号',
    defaultWidth: 100,
    defaultHeight: 130,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2.5,
      voltageLevel: '10kV'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-ct',
    category: 'electrical',
    name: '电流互感器 TA / CT',
    nameEn: 'Current Transformer',
    iconName: 'Circle',
    description: '高精度测量/保护用电流互感器，圆形同心电磁感应标准一次符号',
    defaultWidth: 50,
    defaultHeight: 60,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-pt',
    category: 'electrical',
    name: '电压互感器 TV / PT',
    nameEn: 'Voltage Transformer',
    iconName: 'Circle',
    description: '母线三相电压测量用电磁式电压互感器，带一次熔断器符号',
    defaultWidth: 50,
    defaultHeight: 70,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-arrester',
    category: 'electrical',
    name: '氧化锌避雷器 F',
    nameEn: 'Lightning Surge Arrester',
    iconName: 'Zap',
    description: '高压母线与线路防雷过电压保护用金属氧化物避雷器',
    defaultWidth: 50,
    defaultHeight: 70,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-busbar',
    category: 'electrical',
    name: '高低压母线段 Busbar',
    nameEn: 'Power Distribution Busbar',
    iconName: 'Minus',
    description: '变电站高低压铜铝主母线段，支持电压等级色彩定制与能量粒子流',
    defaultWidth: 320,
    defaultHeight: 16,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 6,
      voltageLevel: '10kV'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'elec-multimeter',
    category: 'electrical',
    name: '多功能电力测控电表',
    nameEn: 'Multifunctional Power Meter',
    iconName: 'Cpu',
    description: '微机三相交流多功能数显电表，实时展示Ua/Ub/Uc、Ia/Ib/Ic、P、Q、CosΦ与kWh',
    defaultWidth: 160,
    defaultHeight: 180,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 1.5,
      borderRadius: 6
    },
    defaultData: {
      datasetId: 'ds-scada-station',
      mapping: {
        voltageKey: 'DEV_101_YC_1',
        currentKey: 'DEV_101_YC_4',
        powerKey: 'DEV_101_YC_7'
      }
    }
  },

  // ==========================================
  // 3. Metrics & Live Telemetry (指标/遥测)
  // ==========================================
  {
    type: 'metric-float',
    category: 'metrics',
    name: '浮点数遥测数值',
    nameEn: 'Float Metric Value',
    iconName: 'Binary',
    description: '纯净浮点数遥测数值，支持小数位与数据源绑定，100%全比例边界缩放贴合',
    defaultWidth: 140,
    defaultHeight: 48,
    defaultStyle: {
      decimals: 2,
      textColor: '#00f2ff',
      fill: 'transparent'
    },
    defaultData: {
      datasetId: 'ds-scada-station',
      mapping: {
        valueKey: 'DEV_101_YC_1'
      }
    }
  },
  {
    type: 'metric-flipper',
    category: 'metrics',
    name: '翻牌式数字计数器',
    nameEn: 'Digital Flipper Counter',
    iconName: 'Binary',
    description: '工业电子LED数字数码管翻牌器，适用于累计发电量、运行时长与报警数',
    defaultWidth: 220,
    defaultHeight: 70,
    defaultStyle: {
      textColor: '#00f2ff',
      fontSize: 28
    },
    defaultData: {
      datasetId: 'ds-scada-station',
      mapping: {
        valueKey: 'DEV_101_DD_1'
      }
    }
  },
  {
    type: 'metric-clock-analog',
    category: 'metrics',
    name: '模拟表盘时钟',
    nameEn: 'Analog Dial Clock',
    iconName: 'Clock',
    description: '极简工控模拟圆形表盘时钟，秒针/分针/时针实时旋转，100%自适应贴合边界缩放',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultStyle: {
      textColor: '#00f2ff',
      stroke: '#00f2ff',
      fill: '#040a18'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'metric-clock',
    category: 'metrics',
    name: '实时数字时钟',
    nameEn: 'Digital Clock',
    iconName: 'Clock',
    description: '纯净LED数字时钟，时分秒动态跳动，支持自由拉伸全比例自适应',
    defaultWidth: 160,
    defaultHeight: 44,
    defaultStyle: {
      textColor: '#00f2ff',
      fill: 'transparent'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'metric-time-banner',
    category: 'metrics',
    name: '日期星期显示',
    nameEn: 'Date & Week Display',
    iconName: 'Calendar',
    description: '纯净年月日及星期文本显示，自动同步系统日期',
    defaultWidth: 180,
    defaultHeight: 36,
    defaultStyle: {
      textColor: '#00f2ff',
      fill: 'transparent'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'metric-countdown',
    category: 'metrics',
    name: '安全运行时长计',
    nameEn: 'Runtime Counter',
    iconName: 'Timer',
    description: '纯净安全无故障累计运行天数与时钟显示',
    defaultWidth: 200,
    defaultHeight: 44,
    defaultStyle: {
      textColor: '#00f2ff',
      fill: 'transparent'
    },
    defaultData: { mapping: {} }
  },

  // ==========================================
  // 4. Industrial SCADA & Media (工控/SCADA)
  // ==========================================
  {
    type: 'ind-tank',
    category: 'industrial',
    name: '流体储罐与液位计',
    nameEn: 'Fluid Storage Tank',
    iconName: 'Database',
    description: '工业反应釜与液体储罐，支持波浪动效、百分比液位高度与颜色预警',
    defaultWidth: 140,
    defaultHeight: 180,
    defaultStyle: {
      stroke: '#00f2ff',
      fill: '#00f2ff'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'ind-pipe',
    category: 'industrial',
    name: '介质工艺管道与流动',
    nameEn: 'Industrial Medium Pipe',
    iconName: 'Workflow',
    description: '工业流体管道，支持流速、流动方向与介质状态颜色',
    defaultWidth: 220,
    defaultHeight: 24,
    defaultStyle: {
      stroke: '#00f2ff',
      strokeWidth: 6
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'ind-alarm-list',
    category: 'industrial',
    name: '实时告警事件滚屏',
    nameEn: 'Realtime SCADA Alarm Feed',
    iconName: 'AlertTriangle',
    description: '变电站与生产线实时SOE事件、事故跳闸与越限告警滚屏列表',
    defaultWidth: 320,
    defaultHeight: 200,
    defaultStyle: {
      stroke: '#ef4444',
      fill: 'rgba(15, 23, 42, 0.85)'
    },
    defaultData: { mapping: {} }
  },

  // ==========================================
  // 5. Visual Charts (可视化图表)
  // ==========================================
  {
    type: 'chart-line',
    category: 'charts',
    name: '实时负荷折线趋势图',
    nameEn: 'Live Load Trend Line Chart',
    iconName: 'LineChart',
    description: 'ECharts驱动的24小时有功/无功负荷实时曲线，支持平滑拟合与渐变面积',
    defaultWidth: 340,
    defaultHeight: 220,
    defaultStyle: {
      stroke: '#00f2ff'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'chart-bar',
    category: 'charts',
    name: '能耗分布柱状图',
    nameEn: 'Energy Bar Chart',
    iconName: 'BarChart3',
    description: '各回路分项用电量与峰平谷对比柱状图，支持立体柱体与多系列堆叠',
    defaultWidth: 340,
    defaultHeight: 220,
    defaultStyle: {
      stroke: '#00e5a3'
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'chart-pie',
    category: 'charts',
    name: '负荷占比环形饼图',
    nameEn: 'Load Proportion Pie Chart',
    iconName: 'PieChart',
    description: '高精环形与玫瑰饼图，展示变压器负载率、动力照明空调能耗配比',
    defaultWidth: 300,
    defaultHeight: 220,
    defaultStyle: {},
    defaultData: { mapping: {} }
  },
  {
    type: 'chart-gauge',
    category: 'charts',
    name: '功率因数 / 频率仪表盘',
    nameEn: 'Power Factor Gauge',
    iconName: 'Gauge',
    description: '汽车仪表级指针仪表盘，刻度发光，精确监控电网频率与CosΦ',
    defaultWidth: 240,
    defaultHeight: 200,
    defaultStyle: {},
    defaultData: { mapping: {} }
  },

  // ==========================================
  // 6. Cyber Decorations & Borders (科技边框)
  // ==========================================
  {
    type: 'deco-border-neon',
    category: 'decoration',
    name: '霓虹科技发光边框',
    nameEn: 'Cyber Neon Border',
    iconName: 'Frame',
    description: '赛博朋克发光外边框，带四角切角与动态脉冲粒子流光',
    defaultWidth: 340,
    defaultHeight: 220,
    defaultStyle: {
      stroke: '#00f2ff',
      borderRadius: 12
    },
    defaultData: { mapping: {} }
  },
  {
    type: 'deco-tech-plate',
    category: 'decoration',
    name: '工业机甲装甲面板',
    nameEn: 'Industrial Armor Plate',
    iconName: 'SquareCode',
    description: '带螺栓铆钉与倾斜切角的机甲底板，适用于重工业SCADA控制大屏',
    defaultWidth: 340,
    defaultHeight: 220,
    defaultStyle: {
      stroke: '#38bdf8',
      fill: 'rgba(15, 23, 42, 0.7)'
    },
    defaultData: { mapping: {} }
  }
];
