import { CustomSymbolDef, ScreenComponent } from '../types';

const STORAGE_KEY = 'datav_custom_symbols_v3';

export const PRESET_CUSTOM_SYMBOLS: CustomSymbolDef[] = [
  // 1. 真空断路器 QF (三态多状态图元)
  {
    id: 'symbol-elec-breaker',
    name: '真空断路器 QF (三态)',
    category: 'electrical',
    iconName: 'Zap',
    description: '工业级高压真空断路器，支持合闸(红)、分闸(绿)与故障跳闸(黄)三态',
    defaultWidth: 90,
    defaultHeight: 110,
    type: 'composite-symbol',
    defaultStyle: {
      fill: 'transparent',
      stroke: '#00f2ff',
      strokeWidth: 2,
      borderRadius: 6
    },
    states: [
      {
        id: '1',
        name: '状态 1 (合闸 / 运行)',
        matchValue: 'closed',
        children: [
          // Top Lead Line
          {
            id: 'brk-line-top',
            name: '上引线',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 5,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          },
          // Breaker Body Box
          {
            id: 'brk-box',
            name: '灭弧室主体',
            type: 'draw-rect',
            category: 'basic',
            x: 25,
            y: 30,
            width: 40,
            height: 44,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444', strokeWidth: 2.5, borderRadius: 4 }
          },
          // Closed Cross / Contact inside
          {
            id: 'brk-text',
            name: '合闸符号',
            type: 'draw-text',
            category: 'basic',
            x: 31,
            y: 40,
            width: 28,
            height: 24,
            rotation: 0,
            zIndex: 3,
            style: { fill: 'transparent', fontSize: 16, textColor: '#ef4444', fontWeight: 'bold' }
          },
          // Bottom Lead Line
          {
            id: 'brk-line-bot',
            name: '下引线',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 74,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          }
        ]
      },
      {
        id: '2',
        name: '状态 2 (分闸 / 备用)',
        matchValue: 'open',
        children: [
          // Top Lead Line
          {
            id: 'brk-line-top-2',
            name: '上引线',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 5,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          },
          // Breaker Body Box
          {
            id: 'brk-box-2',
            name: '灭弧室主体',
            type: 'draw-rect',
            category: 'basic',
            x: 25,
            y: 30,
            width: 40,
            height: 44,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(16, 185, 129, 0.15)', stroke: '#10b981', strokeWidth: 2, borderRadius: 4 }
          },
          // Open text
          {
            id: 'brk-text-2',
            name: '分闸符号',
            type: 'draw-text',
            category: 'basic',
            x: 31,
            y: 40,
            width: 28,
            height: 24,
            rotation: 0,
            zIndex: 3,
            style: { fill: 'transparent', fontSize: 16, textColor: '#10b981', fontWeight: 'bold' }
          },
          // Bottom Lead Line
          {
            id: 'brk-line-bot-2',
            name: '下引线',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 74,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['断路器', 'QF', '高压开关', '电力系统'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 2. 隔离开关 / 刀闸 QS
  {
    id: 'symbol-elec-disconnector',
    name: '隔离开关 / 刀闸 QS',
    category: 'electrical',
    iconName: 'ZapOff',
    description: '母线及出线高压隔离开关刀闸，支持合闸导通与分闸明显断开间隙',
    defaultWidth: 70,
    defaultHeight: 90,
    type: 'composite-symbol',
    defaultStyle: {
      fill: 'transparent',
      stroke: '#00f2ff',
      strokeWidth: 2
    },
    states: [
      {
        id: '1',
        name: '状态 1 (合闸 / 导通)',
        matchValue: 'closed',
        children: [
          // Top Wire
          {
            id: 'iso-top',
            name: '上导线',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 5,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          },
          // Contact Point Top
          {
            id: 'iso-contact-top',
            name: '静触头',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 28,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 }
          },
          // Closed Blade Line
          {
            id: 'iso-blade-closed',
            name: '合闸动触头',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 35,
            width: 6,
            height: 26,
            rotation: 0,
            zIndex: 2,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 26 }] }
          },
          // Contact Point Bot
          {
            id: 'iso-contact-bot',
            name: '动触头轴',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 58,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 }
          },
          // Bottom Wire
          {
            id: 'iso-bot',
            name: '下导线',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 65,
            width: 6,
            height: 20,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 20 }] }
          }
        ]
      },
      {
        id: '2',
        name: '状态 2 (分闸 / 断开)',
        matchValue: 'open',
        children: [
          // Top Wire
          {
            id: 'iso-top-2',
            name: '上导线',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 5,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          },
          // Contact Point Top
          {
            id: 'iso-contact-top-2',
            name: '静触头',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 28,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2 }
          },
          // Open 45 deg Blade Line
          {
            id: 'iso-blade-open',
            name: '分闸刀闸(倾斜断开)',
            type: 'draw-line',
            category: 'basic',
            x: 33,
            y: 35,
            width: 25,
            height: 28,
            rotation: 0,
            zIndex: 2,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 1, yRatio: 0, x: 25, y: 0 }, { xRatio: 0, yRatio: 1, x: 0, y: 28 }] }
          },
          // Contact Point Bot
          {
            id: 'iso-contact-bot-2',
            name: '动触头轴',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 58,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 2 }
          },
          // Bottom Wire
          {
            id: 'iso-bot-2',
            name: '下导线',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 65,
            width: 6,
            height: 20,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 20 }] }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['隔离开关', '刀闸', 'QS', '电力系统'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 3. 快速接地刀闸 QE
  {
    id: 'symbol-elec-grounding',
    name: '快速接地刀闸 QE',
    category: 'electrical',
    iconName: 'Minus',
    description: '出线及检修接地开关刀闸，带三段分级接地符号',
    defaultWidth: 70,
    defaultHeight: 90,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#64748b', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (分闸 / 隔离)',
        matchValue: 'open',
        children: [
          // Contact Point
          {
            id: 'gnd-contact',
            name: '触头',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 10,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 1,
            style: { fill: '#64748b', stroke: '#64748b', strokeWidth: 2 }
          },
          // Open Blade
          {
            id: 'gnd-blade-open',
            name: '分闸接地动触头',
            type: 'draw-line',
            category: 'basic',
            x: 33,
            y: 20,
            width: 24,
            height: 26,
            rotation: 0,
            zIndex: 2,
            style: { stroke: '#64748b', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 1, yRatio: 0, x: 24, y: 0 }, { xRatio: 0, yRatio: 1, x: 0, y: 26 }] }
          },
          // Ground Axis
          {
            id: 'gnd-axis',
            name: '接地轴点',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 44,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#64748b', stroke: '#64748b', strokeWidth: 2 }
          },
          // Ground Bar 1
          {
            id: 'gnd-bar-1',
            name: '接地排1',
            type: 'draw-line',
            category: 'basic',
            x: 15,
            y: 58,
            width: 40,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#64748b', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 40, y: 3 }] }
          },
          // Ground Bar 2
          {
            id: 'gnd-bar-2',
            name: '接地排2',
            type: 'draw-line',
            category: 'basic',
            x: 22,
            y: 67,
            width: 26,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#64748b', strokeWidth: 2.5 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 26, y: 3 }] }
          },
          // Ground Bar 3
          {
            id: 'gnd-bar-3',
            name: '接地排3',
            type: 'draw-line',
            category: 'basic',
            x: 29,
            y: 75,
            width: 12,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#64748b', strokeWidth: 2 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 12, y: 3 }] }
          }
        ]
      },
      {
        id: '2',
        name: '状态 2 (合闸接地 / 检修)',
        matchValue: 'closed',
        children: [
          // Contact Point
          {
            id: 'gnd-contact-2',
            name: '触头',
            type: 'draw-circle',
            category: 'basic',
            x: 29,
            y: 10,
            width: 12,
            height: 12,
            rotation: 0,
            zIndex: 1,
            style: { fill: '#ef4444', stroke: '#ef4444', strokeWidth: 2 }
          },
          // Closed Blade
          {
            id: 'gnd-blade-closed',
            name: '合闸接地刀闸',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 18,
            width: 6,
            height: 30,
            rotation: 0,
            zIndex: 2,
            style: { stroke: '#ef4444', strokeWidth: 3.5 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 30 }] }
          },
          // Ground Bar 1
          {
            id: 'gnd-bar-1-c',
            name: '接地排1',
            type: 'draw-line',
            category: 'basic',
            x: 15,
            y: 58,
            width: 40,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 40, y: 3 }] }
          },
          // Ground Bar 2
          {
            id: 'gnd-bar-2-c',
            name: '接地排2',
            type: 'draw-line',
            category: 'basic',
            x: 22,
            y: 67,
            width: 26,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 2.5 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 26, y: 3 }] }
          },
          // Ground Bar 3
          {
            id: 'gnd-bar-3-c',
            name: '接地排3',
            type: 'draw-line',
            category: 'basic',
            x: 29,
            y: 75,
            width: 12,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 2 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 12, y: 3 }] }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['接地开关', 'QE', '检修接地', '电力系统'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 4. 双绕组主电力变压器 TM
  {
    id: 'symbol-elec-transformer',
    name: '主变压器 TM (双绕组)',
    category: 'electrical',
    iconName: 'Cpu',
    description: '电力主变压器，由高低压交叠双圆与引线构成的标准电气符号',
    defaultWidth: 90,
    defaultHeight: 130,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#3b82f6', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (正常运行)',
        children: [
          // Top Wire
          {
            id: 'tm-wire-top',
            name: '高压进线',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 5,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          },
          // Primary Coil Top Circle
          {
            id: 'tm-coil-1',
            name: '一次侧绕组',
            type: 'draw-circle',
            category: 'basic',
            x: 23,
            y: 26,
            width: 44,
            height: 44,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444', strokeWidth: 2.5 }
          },
          // Secondary Coil Bottom Circle
          {
            id: 'tm-coil-2',
            name: '二次侧绕组',
            type: 'draw-circle',
            category: 'basic',
            x: 23,
            y: 56,
            width: 44,
            height: 44,
            rotation: 0,
            zIndex: 3,
            style: { fill: 'rgba(0, 242, 255, 0.15)', stroke: '#00f2ff', strokeWidth: 2.5 }
          },
          // Bottom Wire
          {
            id: 'tm-wire-bot',
            name: '低压出线',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 98,
            width: 6,
            height: 25,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#00f2ff', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 25 }] }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['变压器', 'TM', '双绕组', '电力系统'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 5. 电流互感器 CT / TA
  {
    id: 'symbol-elec-ct',
    name: '电流互感器 CT / TA',
    category: 'electrical',
    iconName: 'CircleDot',
    description: '穿心式电流采样互感器，由母线导线穿过感应环构成',
    defaultWidth: 70,
    defaultHeight: 80,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#38bdf8', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (采样测量中)',
        children: [
          // Pass-through Conductor
          {
            id: 'ct-line',
            name: '一次穿心导线',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 5,
            width: 6,
            height: 70,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3.5 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 70 }] }
          },
          // Sensor Coil Ring
          {
            id: 'ct-ring',
            name: '采样线圈',
            type: 'draw-circle',
            category: 'basic',
            x: 18,
            y: 24,
            width: 34,
            height: 34,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38bdf8', strokeWidth: 2.5 }
          },
          // Dot marker
          {
            id: 'ct-dot',
            name: '极性同名端',
            type: 'draw-circle',
            category: 'basic',
            x: 48,
            y: 26,
            width: 8,
            height: 8,
            rotation: 0,
            zIndex: 3,
            style: { fill: '#38bdf8', stroke: '#38bdf8', strokeWidth: 1 }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['电流互感器', 'CT', 'TA', '采样测量'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 6. 氧化锌避雷器 F
  {
    id: 'symbol-elec-arrester',
    name: '氧化锌避雷器 F',
    category: 'electrical',
    iconName: 'ZapOff',
    description: '防雷过电压保护避雷器，带非线性电阻箱与接地符号',
    defaultWidth: 70,
    defaultHeight: 90,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#f59e0b', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (防护中)',
        children: [
          // Lead Top
          {
            id: 'arr-line-top',
            name: '进线',
            type: 'draw-line',
            category: 'basic',
            x: 32,
            y: 5,
            width: 6,
            height: 18,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#f59e0b', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 18 }] }
          },
          // Resistor Box
          {
            id: 'arr-box',
            name: '阀片电阻箱',
            type: 'draw-rect',
            category: 'basic',
            x: 20,
            y: 22,
            width: 30,
            height: 40,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b', strokeWidth: 2, borderRadius: 3 }
          },
          // Zigzag line inside
          {
            id: 'arr-text',
            name: '避雷符号',
            type: 'draw-text',
            category: 'basic',
            x: 24,
            y: 28,
            width: 22,
            height: 24,
            rotation: 0,
            zIndex: 3,
            style: { fill: 'transparent', fontSize: 16, textColor: '#f59e0b', fontWeight: 'bold' }
          },
          // Ground Bar
          {
            id: 'arr-gnd-1',
            name: '接地排',
            type: 'draw-line',
            category: 'basic',
            x: 18,
            y: 68,
            width: 34,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#f59e0b', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 34, y: 3 }] }
          },
          {
            id: 'arr-gnd-2',
            name: '接地排2',
            type: 'draw-line',
            category: 'basic',
            x: 25,
            y: 76,
            width: 20,
            height: 6,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#f59e0b', strokeWidth: 2 },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 3 }, { xRatio: 1, yRatio: 0.5, x: 20, y: 3 }] }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['避雷器', '过电压', '电力保护'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 7. 高低压主母线段 (Busbar)
  {
    id: 'symbol-elec-busbar',
    name: '高低压主母线段 (Busbar)',
    category: 'electrical',
    iconName: 'Minus',
    description: '工业铜排主母线，带高亮边缘与引线节点',
    defaultWidth: 260,
    defaultHeight: 40,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#ef4444', strokeWidth: 6 },
    states: [
      {
        id: '1',
        name: '状态 1 (带电运行)',
        children: [
          // Main thick busbar
          {
            id: 'bus-main-bar',
            name: '10kV I段母线排',
            type: 'draw-line',
            category: 'basic',
            x: 5,
            y: 12,
            width: 250,
            height: 12,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 6, lineStyle: 'solid' },
            customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 6 }, { xRatio: 1, yRatio: 0.5, x: 250, y: 6 }] }
          },
          // Node 1
          {
            id: 'bus-node-1',
            name: '引出节点1',
            type: 'draw-circle',
            category: 'basic',
            x: 45,
            y: 11,
            width: 14,
            height: 14,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }
          },
          // Node 2
          {
            id: 'bus-node-2',
            name: '引出节点2',
            type: 'draw-circle',
            category: 'basic',
            x: 125,
            y: 11,
            width: 14,
            height: 14,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }
          },
          // Node 3
          {
            id: 'bus-node-3',
            name: '引出节点3',
            type: 'draw-circle',
            category: 'basic',
            x: 205,
            y: 11,
            width: 14,
            height: 14,
            rotation: 0,
            zIndex: 2,
            style: { fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['母线', 'Busbar', '10kV', '电力系统'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 8. 工业储罐 (Fluid Storage Tank)
  {
    id: 'symbol-ind-tank',
    name: '工业储罐 / 储液槽',
    category: 'industrial',
    iconName: 'Database',
    description: '工业圆柱形储液罐，带封头弧线与液位指示',
    defaultWidth: 100,
    defaultHeight: 140,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#0284c7', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (储液中)',
        children: [
          // Tank Base Rect
          {
            id: 'tank-body',
            name: '储罐主体',
            type: 'draw-rect',
            category: 'basic',
            x: 10,
            y: 20,
            width: 80,
            height: 100,
            rotation: 0,
            zIndex: 1,
            style: { fill: 'rgba(14, 165, 233, 0.15)', stroke: '#0ea5e9', strokeWidth: 2, borderRadius: 12 }
          },
          // Fluid Level Fill
          {
            id: 'tank-fluid',
            name: '罐内液位',
            type: 'draw-rect',
            category: 'basic',
            x: 14,
            y: 55,
            width: 72,
            height: 60,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(14, 165, 233, 0.5)', stroke: '#38bdf8', strokeWidth: 1, borderRadius: 6 }
          },
          // Level Metric
          {
            id: 'tank-metric',
            name: '液位遥测',
            type: 'metric-float',
            category: 'metrics',
            x: 15,
            y: 65,
            width: 70,
            height: 24,
            rotation: 0,
            zIndex: 3,
            style: { textColor: '#ffffff', fontSize: 13, decimals: 1, suffix: 'm', fill: 'transparent' }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['储罐', '液位', '工业SCADA'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 9. 工业加压泵 (Pressure Pump / Motor)
  {
    id: 'symbol-ind-pump',
    name: '离心泵 / 加压泵',
    category: 'industrial',
    iconName: 'Activity',
    description: '工业离心泵符号，由圆形泵壳与切向出水口构成',
    defaultWidth: 90,
    defaultHeight: 90,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#10b981', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (运行 / 绿色)',
        matchValue: 'running',
        children: [
          // Pump Casing Circle
          {
            id: 'pump-casing',
            name: '泵壳体',
            type: 'draw-circle',
            category: 'basic',
            x: 15,
            y: 20,
            width: 55,
            height: 55,
            rotation: 0,
            zIndex: 1,
            style: { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981', strokeWidth: 2.5 }
          },
          // Discharge Nozzle
          {
            id: 'pump-nozzle',
            name: '切向出水口',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 6,
            width: 40,
            height: 18,
            rotation: 0,
            zIndex: 2,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0, yRatio: 1, x: 0, y: 18 }, { xRatio: 1, yRatio: 0, x: 40, y: 0 }] }
          },
          // Center Impeller
          {
            id: 'pump-impeller',
            name: '叶轮中心',
            type: 'draw-circle',
            category: 'basic',
            x: 36,
            y: 41,
            width: 14,
            height: 14,
            rotation: 0,
            zIndex: 3,
            style: { fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }
          }
        ]
      },
      {
        id: '2',
        name: '状态 2 (停机 / 灰色)',
        matchValue: 'stopped',
        children: [
          {
            id: 'pump-casing-2',
            name: '泵壳体',
            type: 'draw-circle',
            category: 'basic',
            x: 15,
            y: 20,
            width: 55,
            height: 55,
            rotation: 0,
            zIndex: 1,
            style: { fill: 'rgba(100, 116, 139, 0.2)', stroke: '#64748b', strokeWidth: 2 }
          },
          {
            id: 'pump-nozzle-2',
            name: '切向出水口',
            type: 'draw-line',
            category: 'basic',
            x: 42,
            y: 6,
            width: 40,
            height: 18,
            rotation: 0,
            zIndex: 2,
            style: { stroke: '#64748b', strokeWidth: 2.5 },
            customProps: { points: [{ xRatio: 0, yRatio: 1, x: 0, y: 18 }, { xRatio: 1, yRatio: 0, x: 40, y: 0 }] }
          },
          {
            id: 'pump-impeller-2',
            name: '叶轮中心',
            type: 'draw-circle',
            category: 'basic',
            x: 36,
            y: 41,
            width: 14,
            height: 14,
            rotation: 0,
            zIndex: 3,
            style: { fill: '#64748b', stroke: '#94a3b8', strokeWidth: 1 }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['水泵', '电机', '工业SCADA'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 10. 电动调节阀 (Control Valve)
  {
    id: 'symbol-ind-valve',
    name: '电动调节阀 / 蝶阀',
    category: 'industrial',
    iconName: 'ToggleRight',
    description: '标准双三角形对置调节阀门，带执行机构顶座',
    defaultWidth: 80,
    defaultHeight: 70,
    type: 'composite-symbol',
    defaultStyle: { fill: 'transparent', stroke: '#38bdf8', strokeWidth: 2 },
    states: [
      {
        id: '1',
        name: '状态 1 (开启 / 导通)',
        matchValue: 'open',
        children: [
          // Actuator Stem
          {
            id: 'valve-stem',
            name: '执行器立柱',
            type: 'draw-line',
            category: 'basic',
            x: 37,
            y: 10,
            width: 6,
            height: 24,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#10b981', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 24 }] }
          },
          // Actuator Top Box
          {
            id: 'valve-actuator',
            name: '电动执行器',
            type: 'draw-rect',
            category: 'basic',
            x: 26,
            y: 6,
            width: 28,
            height: 14,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(16, 185, 129, 0.3)', stroke: '#10b981', strokeWidth: 2, borderRadius: 2 }
          },
          // Left Triangle / Flange
          {
            id: 'valve-left-flange',
            name: '左阀芯',
            type: 'draw-polygon',
            category: 'basic',
            x: 10,
            y: 28,
            width: 30,
            height: 30,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981', strokeWidth: 2 }
          },
          // Right Triangle / Flange
          {
            id: 'valve-right-flange',
            name: '右阀芯',
            type: 'draw-polygon',
            category: 'basic',
            x: 40,
            y: 28,
            width: 30,
            height: 30,
            rotation: 180,
            zIndex: 2,
            style: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981', strokeWidth: 2 }
          }
        ]
      },
      {
        id: '2',
        name: '状态 2 (关闭 / 截断)',
        matchValue: 'closed',
        children: [
          // Actuator Stem
          {
            id: 'valve-stem-2',
            name: '执行器立柱',
            type: 'draw-line',
            category: 'basic',
            x: 37,
            y: 10,
            width: 6,
            height: 24,
            rotation: 0,
            zIndex: 1,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            customProps: { points: [{ xRatio: 0.5, yRatio: 0, x: 3, y: 0 }, { xRatio: 0.5, yRatio: 1, x: 3, y: 24 }] }
          },
          // Actuator Top Box
          {
            id: 'valve-actuator-2',
            name: '电动执行器',
            type: 'draw-rect',
            category: 'basic',
            x: 26,
            y: 6,
            width: 28,
            height: 14,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444', strokeWidth: 2, borderRadius: 2 }
          },
          // Left Triangle
          {
            id: 'valve-left-flange-2',
            name: '左阀芯',
            type: 'draw-polygon',
            category: 'basic',
            x: 10,
            y: 28,
            width: 30,
            height: 30,
            rotation: 0,
            zIndex: 2,
            style: { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444', strokeWidth: 2 }
          },
          // Right Triangle
          {
            id: 'valve-right-flange-2',
            name: '右阀芯',
            type: 'draw-polygon',
            category: 'basic',
            x: 40,
            y: 28,
            width: 30,
            height: 30,
            rotation: 180,
            zIndex: 2,
            style: { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444', strokeWidth: 2 }
          }
        ]
      }
    ],
    activeStateId: '1',
    tags: ['调节阀', '电动阀', '截断阀', '工业管道'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 11. 10kV 出线间隔综合图元 (组合图元)
  {
    id: 'symbol-scada-feeder-bay',
    name: '10kV 典型断路器出线间隔组合',
    category: 'custom',
    iconName: 'Zap',
    description: '由高压母线段、隔离开关、断路器、电流互感器、浮点数测控表及指示灯组合而成的纯图元组合体',
    defaultWidth: 220,
    defaultHeight: 340,
    type: 'composite-symbol',
    defaultStyle: {
      fill: 'rgba(6, 14, 28, 0.95)',
      stroke: '#00f2ff',
      strokeWidth: 1.5,
      borderRadius: 12
    },
    children: [
      {
        id: 'c-bus',
        name: '10kV母线段',
        type: 'draw-line',
        category: 'basic',
        x: 10,
        y: 15,
        width: 200,
        height: 12,
        rotation: 0,
        zIndex: 1,
        style: { stroke: '#ef4444', strokeWidth: 6 },
        customProps: { points: [{ xRatio: 0, yRatio: 0.5, x: 0, y: 6 }, { xRatio: 1, yRatio: 0.5, x: 200, y: 6 }] }
      },
      {
        id: 'c-iso',
        name: '母线隔离开关 QS',
        type: 'draw-rect',
        category: 'basic',
        x: 75,
        y: 35,
        width: 70,
        height: 50,
        rotation: 0,
        zIndex: 2,
        style: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444', strokeWidth: 2, borderRadius: 4 }
      },
      {
        id: 'c-brk',
        name: '真空断路器 QF',
        type: 'draw-rect',
        category: 'basic',
        x: 55,
        y: 100,
        width: 110,
        height: 80,
        rotation: 0,
        zIndex: 3,
        style: { fill: 'rgba(0, 242, 255, 0.2)', stroke: '#00f2ff', strokeWidth: 2, borderRadius: 6 }
      },
      {
        id: 'c-ct',
        name: '互感采样 TA',
        type: 'draw-circle',
        category: 'basic',
        x: 88,
        y: 195,
        width: 44,
        height: 44,
        rotation: 0,
        zIndex: 4,
        style: { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38bdf8', strokeWidth: 2 }
      },
      {
        id: 'c-float-current',
        name: '出线电流表',
        type: 'metric-float',
        category: 'metrics',
        x: 20,
        y: 260,
        width: 180,
        height: 40,
        rotation: 0,
        zIndex: 5,
        style: { fill: 'rgba(4, 9, 20, 0.9)', textColor: '#00f2ff', suffix: ' A', decimals: 2 }
      }
    ],
    tags: ['组合图元', '10kV间隔', '断路器柜'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getCustomSymbols(): CustomSymbolDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCustomSymbols(PRESET_CUSTOM_SYMBOLS);
      return PRESET_CUSTOM_SYMBOLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PRESET_CUSTOM_SYMBOLS;
  } catch (e) {
    console.error('Failed to load custom symbols:', e);
    return PRESET_CUSTOM_SYMBOLS;
  }
}

export function saveCustomSymbols(symbols: CustomSymbolDef[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('datav:custom-symbols-updated'));
    }
  } catch (e) {
    console.error('Failed to save custom symbols:', e);
  }
}

export function addCustomSymbol(symbol: CustomSymbolDef): CustomSymbolDef[] {
  const list = getCustomSymbols();
  const existingIdx = list.findIndex(s => s.id === symbol.id);
  if (existingIdx !== -1) {
    list[existingIdx] = symbol;
  } else {
    list.unshift(symbol);
  }
  saveCustomSymbols(list);
  return list;
}

export function removeCustomSymbol(id: string): CustomSymbolDef[] {
  const list = getCustomSymbols().filter(s => s.id !== id);
  saveCustomSymbols(list);
  return list;
}

