# 虚拟列表开发总结（AI Chat 前端）

## 1. 背景与目标

聊天页原先采用全量渲染：消息越多，DOM 节点越多，滚动与更新性能会持续下降。  
本次改造目标：

1. 在不引入第三方虚拟列表库的前提下，实现原生虚拟滚动。
2. 支持聊天场景常见的动态高度消息（Markdown、代码块、图片等）。
3. 使用 TDD 流程交付，保证核心逻辑可测试、可回归。
4. 给出可量化的性能对比数据，便于面试讲述。

---

## 2. 改造范围

核心改动文件：

1. `src/components/Bubble/virtualList.ts`  
虚拟区间计算核心算法（纯函数）。
2. `src/components/Bubble/virtualList.test.ts`  
核心算法单元测试。
3. `src/components/Bubble/virtualList.benchmark.test.ts`  
性能量化测试（渲染条数缩减 + 计算耗时）。
4. `src/components/Bubble/bubble.tsx`  
聊天列表渲染逻辑从全量渲染改为虚拟渲染。
5. `package.json`  
新增测试脚本：`test`、`test:run`。

---

## 3. 技术方案

### 3.1 核心思路

1. 维护滚动容器状态：`scrollTop`、`viewportHeight`。
2. 根据消息总数、预估高度、实测高度（height map）计算可视区索引范围。
3. 只渲染 `[startIndex, endIndex]` 的消息项。
4. 在顶部和底部渲染占位高度（padding div），保持滚动条长度正确。

### 3.2 动态高度处理

1. 每条可见消息渲染后用 `offsetHeight` 测量真实高度。
2. 将高度写入 `heightMapRef`。
3. 当高度变化超过阈值时触发重新计算虚拟区间。

### 3.3 聊天场景交互策略

1. 底部跟随：当用户接近底部时，新消息到达自动滚动到底部。
2. 非强制打断：当用户上滑查看历史消息时，不强制拉回到底部。
3. 使用 `overscan`（当前为 3）减少滚动临界时的白屏感。

---

## 4. TDD 开发过程

### 4.1 Red（先写失败测试）

先创建 `virtualList.test.ts`，覆盖：

1. 空列表边界行为。
2. 固定预估高度下的区间计算。
3. 实测高度覆盖后的区间计算。

首次运行测试失败（缺少 `virtualList.ts` 实现），进入 Green 阶段。

### 4.2 Green（最小实现使测试通过）

实现 `calculateVirtualRange`：

1. 计算累积高度 offsets。
2. 根据 `scrollTop + viewportHeight` 求可视起止索引。
3. 叠加 overscan。
4. 返回 `startIndex/endIndex/paddingTop/paddingBottom/totalHeight`。

随后单测通过。

### 4.3 Refactor / Integration

在 `bubble.tsx` 中集成虚拟渲染：

1. 从 `Bubble.List items=...` 全量渲染改为“滚动容器 + Bubble 单项渲染”。
2. 加入动态高度测量与缓存。
3. 加入底部跟随策略。

---

## 5. 量化结果（本地基准）

基准文件：`src/components/Bubble/virtualList.benchmark.test.ts`

执行命令：

```bash
npm run test:run -- src/components/Bubble/virtualList.benchmark.test.ts
```

### 5.1 渲染条数缩减（全量 vs 虚拟）

1. `10k-top`: `10000 -> 11`（减少 `99.89%`）
2. `10k-middle`: `10000 -> 14`（减少 `99.86%`）
3. `50k-deep`: `50000 -> 14`（减少 `99.97%`）

### 5.2 核心计算耗时

`calculateVirtualRange` 在 2000 次滚动更新模拟下：

1. `totalMs = 274.62`
2. `avgMs = 0.1373ms / 次`

说明：核心区间计算开销很低，主要性能收益来自“DOM 渲染规模显著下降”。

---

## 6. 结果与价值

1. 技术上：实现了不依赖第三方虚拟列表库的原生虚拟滚动方案。
2. 工程上：核心逻辑具备单元测试与基准测试，可回归、可量化。
3. 业务上：面对万级消息时，渲染节点数量降低约 99.9%，显著缓解卡顿风险。
4. 面试上：可完整讲述“问题识别 -> TDD -> 方案落地 -> 数据验证”的闭环。

---

## 7. 已知限制与后续优化

1. 当前 `calculateVirtualRange` 每次会线性构建 offsets，超大数据下可进一步优化为前缀和缓存。
2. 动态高度依赖测量回填，极端频繁高度变化场景可考虑节流/批量测量。
3. 可补充浏览器级指标采集（FPS、Long Task、Heap、DOM 节点数）形成更完整性能报告。

---

## 8. 可直接用于面试的表述

“我在聊天列表里做了原生虚拟滚动，没用第三方库。先用 TDD 写了区间计算的失败测试，再实现算法并接入动态高度测量。最后通过基准测试量化，10k~50k 消息场景下，页面实际渲染条数稳定在十几条，渲染规模下降约 99.9%，区间计算平均耗时约 0.14ms/次。”  
