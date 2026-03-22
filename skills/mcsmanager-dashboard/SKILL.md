---
name: mcsmanager-dashboard
description: |
  MCSManager 仪表盘与节点概览工具使用指南，覆盖面板概览查询、节点列表识别、daemonId 提取。

  **当以下情况时使用此 Skill**:
  (1) 需要查看 MCSManager 面板概览
  (2) 需要查看有哪些节点在线或可用
  (3) 需要获取节点 daemonId 供后续实例工具使用
  (4) 用户提到“仪表盘”“面板概览”“节点列表”“daemonId”“节点在线情况”
---

# MCSManager 仪表盘与节点概览

## 执行前必读

- 先完成插件默认配置，否则相关工具不会注册
- 默认配置优先级如下：

| 来源 | 说明 |
|------|------|
| `plugins.entries.openclaw-mcsmanager-plugin.config` | OpenClaw 插件配置 |
| 插件根目录 `.env` | 推荐部署方式 |
| `MCSMANAGER_BASE_URL` / `MCSMANAGER_API_KEY` | 系统环境变量 |

- 仪表盘 skill 的核心目标是获取 `daemonId`，为后续实例 skill 提供输入

---

## 快速索引：意图 → 工具

| 用户意图 | 工具 | 必填参数 | 常用输出 |
|---------|------|---------|---------|
| 查看面板概览 | `mcsmanager_overview` | 无 | `panel.version`, `panel.remoteCount` |
| 查看节点列表 | `mcsmanager_overview` | 无 | `daemons[]`, `daemons[].remarks`, `daemons[].available` |
| 获取节点 daemonId | `mcsmanager_overview` | 无 | `daemons[].daemonId` |
| 为实例操作准备节点信息 | `mcsmanager_overview` | 无 | `daemonId`, `remarks`, `instance` |

---

## 核心约束

### 1. 不知道 `daemonId` 时，先查仪表盘

当用户后续需求涉及实例列表、实例详情、启动、停止、重启时，如果还没有节点 `daemonId`，应先调用 `mcsmanager_overview`。

### 2. 多节点场景下优先使用备注识别目标

| 场景 | 建议行为 |
|------|---------|
| 只有一个节点 | 直接使用返回的 `daemonId` |
| 存在多个节点且备注明确 | 用 `remarks` 向用户确认目标 |
| 存在多个节点但备注不清晰 | 展示所有节点的 `daemonId`、`remarks`、`available`，让用户确认 |

### 3. 输出给用户时不要只给原始 JSON

优先整理成面板状态 + 节点列表的摘要；只有在后续工具链需要时，再从 `details.daemons` 读取结构化字段。

---

## 工具说明

### `mcsmanager_overview`

获取仪表盘概览，并提取所有节点信息。

#### 参数

```json
{}
```

#### 返回重点

| 字段 | 说明 |
|------|------|
| `panel.version` | 面板版本 |
| `panel.remoteCount` | 节点数量 |
| `daemons[].daemonId` | 节点唯一标识 |
| `daemons[].remarks` | 节点备注 |
| `daemons[].available` | 节点是否可用 |
| `daemons[].instance` | 节点上的实例数量 |

---

## 使用场景示例

### 场景 1：查看面板是否正常

```json
{}
```

适合回答：

- 面板当前是否在线
- 当前有多少节点
- 节点是否可用

### 场景 2：为实例查询获取 `daemonId`

1. 调用 `mcsmanager_overview`
2. 从 `details.daemons` 中读取目标节点的：
   - `daemonId`
   - `remarks`
3. 再进入实例相关 skill

---

## 输出建议

| 输出项 | 说明 |
|------|------|
| 面板状态 | 是否正常返回概览 |
| 节点数量 | `panel.remoteCount` |
| 节点名称/备注 | 优先显示 `remarks` |
| daemonId | 后续实例工具依赖 |
| 可用状态 | `available` |

---

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
|---------|---------|---------|
| 工具不可用 | 默认配置缺失 | 补齐插件配置、`.env` 或环境变量 |
| 没拿到节点列表 | 面板无可用节点或权限不足 | 检查 API Key 权限与节点状态 |
| 多个节点无法确认目标 | 节点备注不清晰 | 向用户展示 `daemonId + remarks + available` 供确认 |
| 后续实例工具报缺少 `daemonId` | 没先执行概览查询 | 先调用 `mcsmanager_overview` |
