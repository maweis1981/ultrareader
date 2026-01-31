# UltraReader - RSVP 快速阅读工具

## 技术规格文档 v1.0

---

## 1. 项目概述

### 1.1 产品定义
基于 RSVP（Rapid Serial Visual Presentation）+ ORP（Optimal Recognition Point）的英文快速阅读工具。

### 1.2 技术栈
- **框架**: React 19 + TypeScript
- **构建**: Vite 7
- **样式**: CSS Modules / CSS Variables
- **状态管理**: React Hooks (useState, useReducer, useRef)

---

## 2. 核心模块架构

```
src/
├── core/                    # 核心逻辑（无 UI 依赖）
│   ├── tokenizer.ts         # 文本分词器
│   ├── orp.ts               # ORP 计算
│   └── timing.ts            # 节奏引擎
├── components/              # UI 组件
│   ├── RSVPDisplay/         # 单词显示组件
│   ├── Controls/            # 播放控制
│   ├── HUD/                  # 状态信息显示
│   └── TextInput/           # 文本输入
├── hooks/                   # 自定义 Hooks
│   └── useRSVPPlayer.ts     # 播放器状态机
├── types/                   # TypeScript 类型定义
│   └── index.ts
└── App.tsx                  # 主应用
```

---

## 3. 数据类型定义

```typescript
// Token 类型
type TokenType = 'word' | 'punct';

interface Token {
  type: TokenType;
  value: string;
  index: number;
}

// ORP 结果
interface ORPResult {
  left: string;      // ORP 左侧字符
  pivot: string;     // ORP 字符（红色高亮）
  right: string;     // ORP 右侧字符
  pivotIndex: number;
}

// 播放器状态
interface PlayerState {
  tokens: Token[];
  currentIndex: number;
  isPlaying: boolean;
  wpm: number;
}

// 标点类型
type PunctuationType = 'light' | 'heavy' | 'paragraph' | 'quote' | 'none';
```

---

## 4. 核心算法规格

### 4.1 Tokenizer（分词器）

**输入**: 原始文本字符串
**输出**: Token 数组

**规则**:
- 单词: 匹配 `/[a-zA-Z0-9]+(?:[''-][a-zA-Z0-9]+)*/`
- 支持缩写: `can't`, `don't`, `we're`
- 支持连字符: `e-mail`, `self-aware`
- 支持数字: `3.14`, `1,000`
- 标点单独成 token
- `\n\n` 及以上视为段落标点

### 4.2 ORP 计算

| 单词长度 | ORP 索引 (0-based) |
|---------|-------------------|
| ≤ 1     | 0                 |
| 2–5     | 1                 |
| 6–9     | 2                 |
| ≥ 10    | 3                 |

**约束**: `clamp(orpIndex, 0, word.length - 1)`

### 4.3 Timing Engine（节奏引擎）

**基础间隔**:
```
interval_ms = 60000 / WPM
```

**标点延迟倍数**:
| 类型       | 符号                    | 倍数 |
|-----------|------------------------|------|
| light     | `,` `:` `;`            | 1.3  |
| heavy     | `.` `!` `?`            | 1.8  |
| paragraph | `\n\n`                 | 2.5  |
| quote     | `"` `'` `(` `)` `[` `]`| 1.2  |
| none      | 其他                    | 1.0  |

**单词长度补偿**:
| 长度  | 倍数 |
|------|------|
| ≤ 4  | 1.0  |
| 5–7  | 1.1  |
| ≥ 8  | 1.3  |

**最终计算**:
```
delay_ms = interval_ms × punct_multiplier × length_multiplier
```

---

## 5. 组件规格

### 5.1 RSVPDisplay

**职责**: 显示当前 token，ORP 字母固定位置

**关键要求**:
- ORP 字母（pivot）必须在屏幕固定像素位置
- 使用等宽字体
- 左侧文本右对齐，右侧文本左对齐
- pivot 使用红色 (#FF0000)

**实现方案**:
```
┌─────────────────────────────────────┐
│     [left]  [pivot]  [right]        │
│      right-align │ left-align       │
│              固定位置                │
└─────────────────────────────────────┘
```

### 5.2 Controls

**功能**:
- Play/Pause 按钮
- Reset 按钮
- WPM 滑块 (100-1000, 步进 50)
- 进度条（可点击跳转）

### 5.3 HUD

**显示信息**:
- 当前 WPM
- 进度: `{current} / {total}`
- 百分比进度

---

## 6. 键盘快捷键

| 按键            | 行为              |
|----------------|-------------------|
| `Space`        | Play / Pause      |
| `←` / `→`      | 前/后 1 token     |
| `Shift + ←/→`  | 前/后 5 tokens    |
| `↑` / `↓`      | WPM ±50           |
| `R`            | Reset             |

---

## 7. 状态机

```
         ┌──────────┐
         │  IDLE    │ ← 初始状态 / Reset
         └────┬─────┘
              │ 输入文本
              ▼
         ┌──────────┐
         │  READY   │ ← 文本已加载
         └────┬─────┘
              │ Play
              ▼
         ┌──────────┐
    ┌───▶│ PLAYING  │◀───┐
    │    └────┬─────┘    │
    │         │          │
    │ Resume  │ Pause    │ Seek
    │         ▼          │
    │    ┌──────────┐    │
    └────│  PAUSED  │────┘
         └────┬─────┘
              │ 到达末尾
              ▼
         ┌──────────┐
         │ FINISHED │
         └──────────┘
```

---

## 8. 性能要求

- UI 帧率 ≥ 60 FPS
- 时间误差 < ±5ms
- 无视觉抖动
- 长时间播放无时间漂移

---

## 9. 验收标准

1. ORP 位置在整个阅读过程中保持绝对稳定
2. 标点处节奏明显放慢
3. 用户可在 300-600 WPM 间稳定阅读
4. 连续阅读 10 分钟不产生明显视觉疲劳
5. 所有键盘快捷键正常工作
