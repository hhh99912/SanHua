import { ScreenItem, DatasetItem } from '../types';
import { INITIAL_DATASETS } from './presetDatasets';

export const PRESET_MULTI_SCREENS: ScreenItem[] = [
  // Screen 1: 10kV配电室一次系统接线图
  {
    id: 'screen-10kv-main',
    name: '10kV配电室一次系统接线图',
    description: '10kV I段与II段单母线分段接线系统，含进线柜、PT柜、母联柜与馈线出线柜',
    screen: {
      id: 'screen-10kv-main',
      name: '10kV配电室一次系统接线图',
      width: 1920,
      height: 1080,
      backgroundColor: '#040914',
      backgroundGrid: true,
      gridSize: 20,
      gridColor: 'rgba(0, 242, 255, 0.05)',
      theme: 'cyber-dark',
      version: '2.0.0',
      updatedAt: new Date().toISOString()
    },
    components: [
      // 1. Navigation Bar
      {
        id: 'comp-nav-bar',
        name: '多大屏全局导航条',
        type: 'nav-tabs',
        category: 'custom',
        x: 60,
        y: 20,
        width: 1800,
        height: 52,
        rotation: 0,
        zIndex: 10,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          strokeWidth: 1,
          borderRadius: 10
        },
        data: {
          mapping: {}
        },
        customProps: {
          screens: [
            { id: 'screen-10kv-main', name: '⚡ 10kV一次系统接线图' },
            { id: 'screen-transformer-detail', name: '🔄 #1主变压器及测控大屏' },
            { id: 'screen-low-voltage-04kv', name: '🏭 0.4kV低压配电大屏' },
            { id: 'screen-telemetry-scada', name: '📊 全站电力遥测与告警' }
          ]
        }
      },

      // 2. Title & Header
      {
        id: 'comp-main-title',
        name: '大屏主标题',
        type: 'metric-title',
        category: 'metrics',
        x: 600,
        y: 84,
        width: 720,
        height: 54,
        rotation: 0,
        zIndex: 2,
        style: {
          fill: 'transparent',
          fontSize: 26,
          fontWeight: '700',
          textColor: '#e2f1ff',
          textAlign: 'center',
          letterSpacing: 4
        },
        data: {
          mapping: {
            titleKey: '智能变电站 10kV 一次系统接线总览图'
          }
        }
      },

      // 3. 10kV I段主母线
      {
        id: 'comp-busbar-1',
        name: '10kV I段工作母线',
        type: 'elec-busbar',
        category: 'electrical',
        x: 100,
        y: 220,
        width: 800,
        height: 64,
        rotation: 0,
        zIndex: 3,
        style: {
          stroke: '#ef4444',
          voltageLevel: '10kV',
          feederName: '10kV I段工作母线 (10.35kV / 50.00Hz)'
        },
        customProps: {
          name: '10kV I段母线',
          voltage: '10.35 kV',
          frequency: '50.00 Hz',
          isEnergized: true
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '10kV I段母线',
            voltageKey: 'voltage_kv',
            frequencyKey: 'frequency_hz'
          }
        }
      },

      // 4. 10kV II段主母线
      {
        id: 'comp-busbar-2',
        name: '10kV II段工作母线',
        type: 'elec-busbar',
        category: 'electrical',
        x: 1020,
        y: 220,
        width: 800,
        height: 64,
        rotation: 0,
        zIndex: 3,
        style: {
          stroke: '#ef4444',
          voltageLevel: '10kV',
          feederName: '10kV II段工作母线 (10.32kV / 50.01Hz)'
        },
        customProps: {
          name: '10kV II段母线',
          voltage: '10.32 kV',
          frequency: '50.01 Hz',
          isEnergized: true
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '10kV II段母线',
            voltageKey: 'voltage_kv',
            frequencyKey: 'frequency_hz'
          }
        }
      },

      // 5. 101 进线断路器 (I段进线)
      {
        id: 'comp-breaker-101',
        name: '101 进线断路器柜',
        type: 'elec-breaker',
        category: 'electrical',
        x: 120,
        y: 340,
        width: 170,
        height: 160,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          voltageLevel: '10kV',
          feederName: '101 进线断路器'
        },
        customProps: {
          state: 'closed',
          feederName: '101 进线柜',
          current: '142.5'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '101 进线开关',
            stateKey: 'circuit_breaker_101_state',
            currentKey: 'current_a'
          },
          action: {
            type: 'jump-screen',
            targetScreenId: 'screen-transformer-detail',
            label: '跳转至主变压器测控大屏'
          }
        }
      },

      // 6. 101 测控仪表
      {
        id: 'comp-meter-101',
        name: '101 进线多功能测控表',
        type: 'elec-multimeter',
        category: 'electrical',
        x: 120,
        y: 530,
        width: 320,
        height: 180,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          feederName: '101 进线多功能仪表'
        },
        customProps: {
          name: '101 进线测控'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '101 测控表',
            voltageKey: 'voltage_kv',
            currentKey: 'current_a'
          }
        }
      },

      // 7. 201 抽出式手车出线柜
      {
        id: 'comp-handcart-201',
        name: '201 馈线手车开关柜',
        type: 'elec-handcart',
        category: 'electrical',
        x: 320,
        y: 340,
        width: 190,
        height: 160,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          voltageLevel: '10kV',
          feederName: '201 车间动力馈线'
        },
        customProps: {
          position: 'working',
          feederName: '201 动力出线'
        },
        data: {
          mapping: {
            titleKey: '201 馈线'
          }
        }
      },

      // 8. 202 出线断路器
      {
        id: 'comp-breaker-202',
        name: '202 低压变出线断路器',
        type: 'elec-breaker',
        category: 'electrical',
        x: 540,
        y: 340,
        width: 170,
        height: 160,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          voltageLevel: '10kV',
          feederName: '202 站用变断路器'
        },
        customProps: {
          state: 'closed',
          feederName: '202 站用变',
          current: '68.2'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '202 站用变',
            currentKey: 'current_a'
          },
          action: {
            type: 'jump-screen',
            targetScreenId: 'screen-low-voltage-04kv',
            label: '跳转至0.4kV低压配电大屏'
          }
        }
      },

      // 9. 100 母联断路器 (I段与II段联络)
      {
        id: 'comp-breaker-tie',
        name: '100 母联分段断路器',
        type: 'elec-breaker',
        category: 'electrical',
        x: 910,
        y: 220,
        width: 100,
        height: 130,
        rotation: 0,
        zIndex: 5,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#eab308',
          voltageLevel: '10kV',
          feederName: '100 母联'
        },
        customProps: {
          state: 'open',
          feederName: '100 母联开关'
        },
        data: {
          mapping: {
            titleKey: '100 母联开关'
          }
        }
      },

      // 10. 10kV TV 电压互感器
      {
        id: 'comp-pt-1',
        name: '10kV I段 TV电压互感器',
        type: 'elec-pt',
        category: 'electrical',
        x: 740,
        y: 340,
        width: 140,
        height: 120,
        rotation: 0,
        zIndex: 4,
        style: {
          stroke: '#a855f7',
          feederName: '10kV I段 TV柜'
        },
        customProps: {
          name: '10kV I段 TV',
          ratio: '10/0.1kV 0.5级'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: 'I段 TV',
            voltageKey: 'voltage_kv'
          }
        }
      },

      // 11. 102 进线断路器 (II段进线)
      {
        id: 'comp-breaker-102',
        name: '102 进线断路器柜',
        type: 'elec-breaker',
        category: 'electrical',
        x: 1040,
        y: 340,
        width: 170,
        height: 160,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          voltageLevel: '10kV',
          feederName: '102 进线断路器'
        },
        customProps: {
          state: 'closed',
          feederName: '102 进线柜',
          current: '138.4'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '102 进线开关'
          }
        }
      },

      // 12. #1 主变压器 (TM-01)
      {
        id: 'comp-transformer-1',
        name: '#1 主变压器 (110/10.5kV)',
        type: 'elec-transformer',
        category: 'electrical',
        x: 1240,
        y: 340,
        width: 280,
        height: 200,
        rotation: 0,
        zIndex: 4,
        style: {
          stroke: '#00f2ff',
          feederName: '#1 主变压器 (110/10.5kV)'
        },
        customProps: {
          name: '#1 主变压器',
          capacity: 'SFZ11-31500kVA',
          oilTemp: 48.5,
          loadRate: 74.2,
          hvCurrent: 162.8
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '#1 主变压器',
            temperatureKey: 'ambient_temperature_c',
            valueKey: 'furnace_heat_percent',
            currentKey: 'current_a'
          },
          action: {
            type: 'jump-screen',
            targetScreenId: 'screen-transformer-detail',
            label: '查看主变运行参数大屏'
          }
        }
      },

      // 13. 电力遥测折线趋势
      {
        id: 'comp-power-chart',
        name: '全站负荷功率趋势',
        type: 'chart-line',
        category: 'charts',
        x: 1040,
        y: 560,
        width: 780,
        height: 280,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.9)',
          stroke: '#00f2ff',
          strokeWidth: 1,
          borderRadius: 12
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '10kV母线全站负荷功率波动曲线 (MW)',
            categoriesKey: 'series_time',
            seriesKey: 'series_power',
            unitKey: 'kW'
          }
        }
      },

      // 14. 浮点数据显示 (母线实时频率)
      {
        id: 'comp-float-freq',
        name: '母线实时频率读数',
        type: 'metric-float',
        category: 'metrics',
        x: 480,
        y: 530,
        width: 240,
        height: 120,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          decimals: 2,
          suffix: ' Hz'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '母线实时电网频率',
            valueKey: 'frequency_hz',
            unitKey: 'Hz'
          }
        }
      },

      // 15. 浮点数据显示 (母线实时电压)
      {
        id: 'comp-float-volt',
        name: '母线线电压读数',
        type: 'metric-float',
        category: 'metrics',
        x: 740,
        y: 530,
        width: 240,
        height: 120,
        rotation: 0,
        zIndex: 4,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#f59e0b',
          decimals: 2,
          suffix: ' kV'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '10kV母线线电压 Uab',
            valueKey: 'voltage_kv',
            unitKey: 'kV'
          }
        }
      }
    ]
  },

  // Screen 2: #1主变压器及高低压测控大屏
  {
    id: 'screen-transformer-detail',
    name: '主变压器及进线测控大屏',
    description: '110kV/10.5kV SFZ11-31500kVA 电力主变压器高低压侧测控、冷却器与油温监测',
    screen: {
      id: 'screen-transformer-detail',
      name: '主变压器及进线测控大屏',
      width: 1920,
      height: 1080,
      backgroundColor: '#040914',
      backgroundGrid: true,
      gridSize: 20,
      gridColor: 'rgba(0, 242, 255, 0.05)',
      theme: 'cyber-dark',
      version: '2.0.0',
      updatedAt: new Date().toISOString()
    },
    components: [
      {
        id: 'comp-nav-bar-2',
        name: '大屏导航条',
        type: 'nav-tabs',
        category: 'custom',
        x: 60,
        y: 20,
        width: 1800,
        height: 52,
        rotation: 0,
        zIndex: 10,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          strokeWidth: 1,
          borderRadius: 10
        },
        data: { mapping: {} }
      },
      {
        id: 'comp-tf-title',
        name: '主变标题',
        type: 'metric-title',
        category: 'metrics',
        x: 600,
        y: 84,
        width: 720,
        height: 54,
        rotation: 0,
        zIndex: 2,
        style: {
          fill: 'transparent',
          fontSize: 26,
          fontWeight: '700',
          textColor: '#00f2ff',
          textAlign: 'center',
          letterSpacing: 4
        },
        data: {
          mapping: {
            titleKey: '#1 主变压器 (110kV/10.5kV) 综合测控中心'
          }
        }
      },
      {
        id: 'comp-tf-large',
        name: '#1 主变压器本体',
        type: 'elec-transformer',
        category: 'electrical',
        x: 100,
        y: 180,
        width: 440,
        height: 300,
        rotation: 0,
        zIndex: 4,
        style: {
          stroke: '#00f2ff',
          feederName: '#1 主变压器 (SFZ11-31500kVA)'
        },
        customProps: {
          name: '#1 主变压器',
          capacity: '31500 kVA (ONAN/ONAF)',
          oilTemp: 48.5,
          loadRate: 72.4,
          hvCurrent: 162.8
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '#1 主变压器',
            temperatureKey: 'ambient_temperature_c',
            valueKey: 'furnace_heat_percent',
            currentKey: 'current_a'
          }
        }
      },
      {
        id: 'comp-tf-meter',
        name: '高压侧保护测控表',
        type: 'elec-multimeter',
        category: 'electrical',
        x: 580,
        y: 180,
        width: 380,
        height: 220,
        rotation: 0,
        zIndex: 4,
        style: {
          stroke: '#ef4444',
          feederName: '110kV 高压侧进线测控'
        },
        data: {
          datasetId: 'ds-factory-telemetry',
          mapping: {
            titleKey: '110kV 进线测控',
            voltageKey: 'voltage_kv',
            currentKey: 'current_a'
          }
        }
      },
      {
        id: 'comp-alarm-tf',
        name: '变压器瓦斯与温度告警列表',
        type: 'ind-alarm-list',
        category: 'industrial',
        x: 1000,
        y: 180,
        width: 820,
        height: 480,
        rotation: 0,
        zIndex: 4,
        style: {
          stroke: '#f59e0b'
        },
        data: {
          datasetId: 'ds-alarms',
          mapping: {}
        }
      }
    ]
  },

  // Screen 3: 0.4kV低压配电大屏
  {
    id: 'screen-low-voltage-04kv',
    name: '0.4kV低压配电及无功补偿大屏',
    description: '0.4kV 低压进线柜、电容补偿柜、动力配电回路与微机电表实时监测',
    screen: {
      id: 'screen-low-voltage-04kv',
      name: '0.4kV低压配电及无功补偿大屏',
      width: 1920,
      height: 1080,
      backgroundColor: '#040914',
      backgroundGrid: true,
      gridSize: 20,
      gridColor: 'rgba(0, 242, 255, 0.05)',
      theme: 'cyber-dark',
      version: '2.0.0',
      updatedAt: new Date().toISOString()
    },
    components: [
      {
        id: 'comp-nav-bar-3',
        name: '大屏导航条',
        type: 'nav-tabs',
        category: 'custom',
        x: 60,
        y: 20,
        width: 1800,
        height: 52,
        rotation: 0,
        zIndex: 10,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          strokeWidth: 1,
          borderRadius: 10
        },
        data: { mapping: {} }
      },
      {
        id: 'comp-lv-title',
        name: '低压配电标题',
        type: 'metric-title',
        category: 'metrics',
        x: 600,
        y: 84,
        width: 720,
        height: 54,
        rotation: 0,
        zIndex: 2,
        style: {
          fill: 'transparent',
          fontSize: 26,
          fontWeight: '700',
          textColor: '#00e5a3',
          textAlign: 'center',
          letterSpacing: 4
        },
        data: {
          mapping: {
            titleKey: '0.4kV 低压动力配电及智能电容补偿大屏'
          }
        }
      },
      {
        id: 'comp-lv-bus',
        name: '0.4kV I段低压母线',
        type: 'elec-busbar',
        category: 'electrical',
        x: 100,
        y: 180,
        width: 1720,
        height: 64,
        rotation: 0,
        zIndex: 3,
        style: {
          stroke: '#00f2ff',
          voltageLevel: '0.4kV',
          feederName: '0.4kV I段低压主母线 (395V / 50.00Hz)'
        },
        customProps: {
          name: '0.4kV I段母线',
          voltage: '0.40 kV',
          frequency: '50.00 Hz',
          isEnergized: true
        },
        data: {
          mapping: {
            titleKey: '0.4kV 母线'
          }
        }
      }
    ]
  },

  // Screen 4: 全站电力遥测与告警中心
  {
    id: 'screen-telemetry-scada',
    name: '全站电力遥测与告警指挥中心',
    description: '全站 SCADA 综合监控、时序趋势图、负荷平衡与电网电能质量分析',
    screen: {
      id: 'screen-telemetry-scada',
      name: '全站电力遥测与告警指挥中心',
      width: 1920,
      height: 1080,
      backgroundColor: '#040914',
      backgroundGrid: true,
      gridSize: 20,
      gridColor: 'rgba(0, 242, 255, 0.05)',
      theme: 'cyber-dark',
      version: '2.0.0',
      updatedAt: new Date().toISOString()
    },
    components: [
      {
        id: 'comp-nav-bar-4',
        name: '大屏导航条',
        type: 'nav-tabs',
        category: 'custom',
        x: 60,
        y: 20,
        width: 1800,
        height: 52,
        rotation: 0,
        zIndex: 10,
        style: {
          fill: 'rgba(6, 14, 28, 0.92)',
          stroke: '#00f2ff',
          strokeWidth: 1,
          borderRadius: 10
        },
        data: { mapping: {} }
      },
      {
        id: 'comp-scada-title',
        name: '全站遥测标题',
        type: 'metric-title',
        category: 'metrics',
        x: 600,
        y: 84,
        width: 720,
        height: 54,
        rotation: 0,
        zIndex: 2,
        style: {
          fill: 'transparent',
          fontSize: 26,
          fontWeight: '700',
          textColor: '#38bdf8',
          textAlign: 'center',
          letterSpacing: 4
        },
        data: {
          mapping: {
            titleKey: '变电站 SCADA 全站遥测与电网质量监控中心'
          }
        }
      }
    ]
  }
];
