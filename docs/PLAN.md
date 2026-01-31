# UltraReader 开发计划

## 开发阶段概览

```
Phase 1: 核心引擎 ──▶ Phase 2: UI 组件 ──▶ Phase 3: 集成调优 ──▶ Phase 4: 测试验收
```

---

## Phase 1: 核心引擎开发

### 1.1 类型定义 (`src/types/index.ts`)
- [ ] Token 类型定义
- [ ] ORP 结果类型
- [ ] 播放器状态类型
- [ ] 标点类型枚举

### 1.2 Tokenizer 模块 (`src/core/tokenizer.ts`)
- [ ] 文本预处理（换行符统一）
- [ ] 单词匹配正则
- [ ] 标点识别与分离
- [ ] 段落标点处理 (`\n\n`)
- [ ] Token 数组生成

### 1.3 ORP 模块 (`src/core/orp.ts`)
- [ ] ORP 索引计算函数
- [ ] 单词拆分函数 (left/pivot/right)
- [ ] 边界情况处理

### 1.4 Timing 模块 (`src/core/timing.ts`)
- [ ] 基础间隔计算
- [ ] 标点类型识别
- [ ] 标点延迟倍数映射
- [ ] 单词长度补偿
- [ ] 最终延迟计算函数

---

## Phase 2: UI 组件开发

### 2.1 RSVPDisplay 组件
- [ ] 组件结构设计
- [ ] ORP 固定位置布局（关键）
- [ ] 等宽字体样式
- [ ] pivot 红色高亮
- [ ] 标点符号显示处理

### 2.2 TextInput 组件
- [ ] 文本输入区域
- [ ] 粘贴支持
- [ ] 提交按钮
- [ ] 清空功能

### 2.3 Controls 组件
- [ ] Play/Pause 按钮
- [ ] Reset 按钮
- [ ] WPM 滑块 (100-1000)
- [ ] 进度条显示

### 2.4 HUD 组件
- [ ] WPM 显示
- [ ] 进度显示 (current/total)
- [ ] 百分比进度

---

## Phase 3: 状态管理与集成

### 3.1 useRSVPPlayer Hook
- [ ] 状态定义 (tokens, index, isPlaying, wpm)
- [ ] 播放逻辑 (setTimeout 动态延迟)
- [ ] 暂停/继续逻辑
- [ ] Seek 功能 (±1, ±5)
- [ ] WPM 实时调节
- [ ] Reset 功能

### 3.2 键盘快捷键
- [ ] useEffect 键盘监听
- [ ] Space: Play/Pause
- [ ] 方向键: Seek
- [ ] Shift+方向键: 快速 Seek
- [ ] 上下键: WPM 调节

### 3.3 主应用集成
- [ ] 组件组合
- [ ] 状态流转
- [ ] 布局样式

---

## Phase 4: 测试与优化

### 4.1 功能测试
- [ ] Tokenizer 单元测试
- [ ] ORP 计算测试
- [ ] Timing 计算测试
- [ ] 播放流程测试

### 4.2 性能优化
- [ ] ORP 位置稳定性验证
- [ ] 帧率检测
- [ ] 长时间播放测试
- [ ] 时间漂移检测

### 4.3 用户体验
- [ ] 300-600 WPM 阅读测试
- [ ] 标点节奏感知测试
- [ ] 视觉疲劳评估

---

## 模块依赖关系

```
types/index.ts
      │
      ▼
┌─────────────────────────────────────┐
│           core/ 模块                 │
│  tokenizer.ts ◀── orp.ts            │
│       │              │              │
│       └──────┬───────┘              │
│              ▼                      │
│         timing.ts                   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      hooks/useRSVPPlayer.ts         │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         components/                  │
│  TextInput  RSVPDisplay  Controls   │
│              HUD                     │
└─────────────────────────────────────┘
              │
              ▼
         App.tsx
```

---

## 开发顺序建议

1. **types/index.ts** - 先定义所有类型
2. **core/tokenizer.ts** - 文本处理基础
3. **core/orp.ts** - ORP 计算
4. **core/timing.ts** - 节奏引擎
5. **components/RSVPDisplay** - 最关键的显示组件
6. **hooks/useRSVPPlayer.ts** - 播放器状态机
7. **components/TextInput** - 输入组件
8. **components/Controls** - 控制组件
9. **components/HUD** - 信息显示
10. **App.tsx** - 集成所有组件
11. **键盘快捷键** - 最后添加
12. **样式优化** - 整体调优

---

## 关键风险点

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| ORP 位置抖动 | 严重 | 使用固定宽度容器 + CSS Grid |
| 时间漂移 | 中等 | 使用 setTimeout 而非 setInterval |
| 标点节奏不明显 | 中等 | 仔细调试延迟倍数 |
| 键盘事件冲突 | 低 | 正确处理 event.preventDefault |

---

## 文件清单

```
src/
├── types/
│   └── index.ts              # 类型定义
├── core/
│   ├── tokenizer.ts          # 分词器
│   ├── orp.ts                # ORP 计算
│   └── timing.ts             # 节奏引擎
├── components/
│   ├── RSVPDisplay/
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── TextInput/
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── Controls/
│   │   ├── index.tsx
│   │   └── styles.css
│   └── HUD/
│       ├── index.tsx
│       └── styles.css
├── hooks/
│   └── useRSVPPlayer.ts      # 播放器 Hook
├── App.tsx                   # 主应用
├── App.css                   # 全局样式
├── main.tsx                  # 入口
└── index.css                 # 基础样式
```
