---
name: mcsmanager-instance
description: |
  MCSManager 实例管理工具使用指南，覆盖实例列表、实例详情、启动、停止、重启、发送命令、状态展示。

  **当以下情况时使用此 Skill**:
  (1) 需要查看某个节点下的实例列表
  (2) 需要查看某个实例的运行状态、在线人数、占用情况
  (3) 需要启动、停止、重启实例
  (4) 需要向实例控制台发送命令
  (5) 用户提到“实例状态”“服务器状态”“重启服”“启动实例”“停止实例”“在线人数”“发送命令”“执行指令”
---

# MCSManager 实例管理

## 执行前必读

- 先完成插件默认配置，否则相关工具不会注册
- 默认配置优先级如下：

| 来源 | 说明 |
|------|------|
| `plugins.entries.openclaw-mcsmanager-plugin.config` | OpenClaw 插件配置 |
| 插件根目录 `.env` | 推荐部署方式 |
| `MCSMANAGER_BASE_URL` / `MCSMANAGER_API_KEY` | 系统环境变量 |

- 实例相关工具通常依赖两个关键字段：`daemonId` 和 `uuid`
- 如果还不知道 `daemonId`，应先使用仪表盘相关 skill 获取

---

## 快速索引：意图 → 工具

| 用户意图 | 工具 | 必填参数 | 常用可选 |
|---------|------|---------|---------|
| 查看某节点下有哪些实例 | `mcsmanager_instance_list` | `daemonId` | `page`, `pageSize`, `instanceName`, `status` |
| 查看某个实例详情 | `mcsmanager_instance_detail` | `daemonId`, `uuid` | - |
| 启动实例 | `mcsmanager_instance_start` | `daemonId`, `uuid` | - |
| 停止实例 | `mcsmanager_instance_stop` | `daemonId`, `uuid` | - |
| 重启实例 | `mcsmanager_instance_restart` | `daemonId`, `uuid` | - |
| 向实例发送命令 | `mcsmanager_instance_command` | `daemonId`, `uuid`, `command` | - |
| 展示实例状态 | `mcsmanager_instance_detail` | `daemonId`, `uuid` | - |

---

## 核心约束

### 1. 不知道 `uuid` 时，先查实例列表

当用户只提供实例名称、别名或模糊描述时，应先调用 `mcsmanager_instance_list`，再根据结果定位 `uuid`。

### 2. 对实例做变更前，优先读取实例详情

| 操作 | 建议行为 |
|------|---------|
| 启动实例 | 先看当前是否已经运行 |
| 停止实例 | 先看当前是否已经停止 |
| 重启实例 | 先确认目标实例和当前状态 |
| 发送命令 | 先确认目标实例和命令内容 |

### 3. 状态展示优先使用实例详情

不要只拿实例列表里的状态字段就直接回答“实例状态”；如果用户问运行状态、在线人数、资源占用，应优先调用 `mcsmanager_instance_detail`。

### 4. 多候选实例时不要擅自操作

| 场景 | 建议行为 |
|------|---------|
| 只有一个明确匹配实例 | 继续操作 |
| 多个实例名称相似 | 展示候选实例名称和 `uuid`，让用户确认 |
| 用户未确认目标 | 不执行启动、停止、重启 |

---

## 工具说明

### `mcsmanager_instance_list`

按 `daemonId` 获取实例列表。

#### 参数

| 参数 | 是否必填 | 说明 |
|------|---------|------|
| `daemonId` | 是 | 节点 daemonId |
| `page` | 否 | 页码，默认 1 |
| `pageSize` | 否 | 每页数量，默认 20 |
| `instanceName` | 否 | 实例名称模糊过滤 |
| `status` | 否 | 状态过滤 |

#### 返回重点

| 字段 | 说明 |
|------|------|
| `items[].instanceUuid` | 实例 UUID |
| `items[].config.nickname` | 实例名称 |
| `items[].status` | 实例状态 |

### `mcsmanager_instance_detail`

获取单个实例的详细信息。

#### 参数

| 参数 | 是否必填 | 说明 |
|------|---------|------|
| `daemonId` | 是 | 节点 daemonId |
| `uuid` | 是 | 实例 UUID |

#### 返回重点

| 字段 | 说明 |
|------|------|
| `config.nickname` | 实例名称 |
| `status` | 当前状态 |
| `info.currentPlayers` | 当前在线人数 |
| `info.maxPlayers` | 最大人数 |
| `processInfo.cpu` | CPU 占用 |
| `processInfo.memory` | 内存占用 |
| `started` | 启动次数 |

### `mcsmanager_instance_start`

启动实例。

### `mcsmanager_instance_stop`

停止实例。

### `mcsmanager_instance_restart`

重启实例。

### `mcsmanager_instance_command`

向实例控制台发送命令。

#### 参数

| 参数 | 是否必填 | 说明 |
|------|---------|------|
| `daemonId` | 是 | 节点 daemonId |
| `uuid` | 是 | 实例 UUID |
| `command` | 是 | 要发送的控制台命令 |

这四个实例控制工具的参数要求如下：

| 工具 | 必填参数 |
|------|---------|
| `mcsmanager_instance_start` | `daemonId`, `uuid` |
| `mcsmanager_instance_stop` | `daemonId`, `uuid` |
| `mcsmanager_instance_restart` | `daemonId`, `uuid` |
| `mcsmanager_instance_command` | `daemonId`, `uuid`, `command` |

---

## 状态字段解释

| 状态值 | 含义 |
|------|------|
| `-1` | 忙碌 |
| `0` | 已停止 |
| `1` | 停止中 |
| `2` | 启动中 |
| `3` | 运行中 |

---

## 使用场景示例

### 场景 1：查看某个节点下的实例列表

```json
{
  "daemonId": "目标节点 daemonId",
  "page": 1,
  "pageSize": 20
}
```

### 场景 2：查看某个实例的状态

步骤建议：

1. 如果缺少 `daemonId`，先获取节点信息
2. 如果缺少 `uuid`，先调用 `mcsmanager_instance_list`
3. 调用 `mcsmanager_instance_detail`

### 场景 3：重启某个实例

步骤建议：

1. 先确认 `daemonId`
2. 先确认 `uuid`
3. 调用 `mcsmanager_instance_detail` 复核目标
4. 调用 `mcsmanager_instance_restart`

### 场景 4：向实例发送命令

步骤建议：

1. 先确认 `daemonId`
2. 先确认 `uuid`
3. 明确要发送的 `command`
4. 如有必要，先调用 `mcsmanager_instance_detail` 确认目标实例正在运行
5. 调用 `mcsmanager_instance_command`

---

## 输出建议

| 输出项 | 说明                            |
|------|-------------------------------|
| 实例名称 | `config.nickname`             |
| 当前状态 | 根据 `status` 翻译                |
| 在线人数 | `currentPlayers / maxPlayers` |
| CPU 占用 | `processInfo.cpu`             |
| 内存占用 | 以MB为单位`processInfo.memory`    |
| 启动次数 | `started`                     |

如果接口没有返回某项数据，直接说明“当前接口未返回该项数据”，不要猜测。

---

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
|---------|---------|---------|
| 工具不可用 | 默认配置缺失 | 补齐插件配置、`.env` 或环境变量 |
| 找不到实例 | `daemonId` 错误或实例不在该节点 | 重新获取节点概览并确认实例列表 |
| 无法执行启停重启 | `uuid` 错误或权限不足 | 先查实例详情，确认权限和目标实例 |
| 发送命令失败 | 实例未运行、命令为空或权限不足 | 确认实例状态、命令内容和 API Key 权限 |
| 状态信息不完整 | 只查了实例列表 | 改用 `mcsmanager_instance_detail` |
| 操作对象不明确 | 多个相似实例 | 先向用户展示候选项，再执行操作 |
