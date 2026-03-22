# OpenClaw MCSManager 插件

这是一个给 OpenClaw 使用的 MCSManager 插件，当前先实现了最核心的一组能力：

- 获取仪表盘概览数据
- 提取节点 `daemonId`
- 获取实例列表
- 获取实例详情
- 启动实例
- 停止实例
- 重启实例
- 向实例发送命令

项目结构保留了扩展空间，后续可以继续接入文件管理、镜像管理、用户管理等剩余接口。

## 目录结构

```text
openclaw-mcsmanager-plugin/
├── openclaw.plugin.json
├── package.json
├── README.md
├── skills/
│   ├── mcsmanager/
│   │   └── SKILL.md
│   ├── mcsmanager-dashboard/
│   │   └── SKILL.md
│   └── mcsmanager-instance/
│       └── SKILL.md
├── src/
│   ├── client.ts
│   ├── index.ts
│   └── tools/
│       ├── instances.ts
│       ├── overview.ts
│       └── shared.ts
└── tsconfig.json
```

## 已实现工具

更偏向 agent 的工具调用说明请看：

- [mcsmanager-dashboard/SKILL.md](/Users/swxswx/Desktop/code/codex/getMd/openclaw-mcsmanager-plugin/skills/mcsmanager-dashboard/SKILL.md)
- [mcsmanager-instance/SKILL.md](/Users/swxswx/Desktop/code/codex/getMd/openclaw-mcsmanager-plugin/skills/mcsmanager-instance/SKILL.md)

其中：

- 仪表盘、节点概览、`daemonId` 获取，归 `mcsmanager-dashboard`
- 实例列表、实例详情、启动、停止、重启，归 `mcsmanager-instance`
- 实例列表、实例详情、启动、停止、重启、发送命令，归 `mcsmanager-instance`

### 1. `mcsmanager_overview`

获取面板概览数据，并整理出节点 `daemonId` 列表。

### 2. `mcsmanager_instance_list`

根据 `daemonId` 获取实例列表，支持分页和实例名过滤。

### 3. `mcsmanager_instance_detail`

根据 `daemonId + uuid` 获取实例详情。

### 4. `mcsmanager_instance_start`

启动实例。

### 5. `mcsmanager_instance_stop`

停止实例。

### 6. `mcsmanager_instance_restart`

重启实例。

### 7. `mcsmanager_instance_command`

向指定实例发送控制台命令。

## 配置方式

插件不再支持在每次工具调用时手动传入 `baseUrl` / `apiKey`。

你需要提前通过下面任一方式提供默认配置。

### 方式一：使用 OpenClaw 插件配置

```json
{
      "plugins": {
        "entries": {
      "openclaw-mcsmanager-plugin": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:23333",
          "apiKey": "你的 API Key",
          "timeoutMs": 15000
        }
      }
    }
  }
}
```

### 方式二：使用插件目录下的 `.env`

插件会默认读取插件根目录下的 `.env` 文件。

示例：

```env
MCSMANAGER_BASE_URL=http://127.0.0.1:23333
MCSMANAGER_API_KEY=你的_API_Key
MCSMANAGER_TIMEOUT_MS=15000
```

例如插件目录是：

```text
~/.openclaw/extensions/openclaw-mcsmanager-plugin/
```

那么就放在：

```text
~/.openclaw/extensions/openclaw-mcsmanager-plugin/.env
```

### 方式三：使用环境变量

```bash
export MCSMANAGER_BASE_URL="http://127.0.0.1:23333"
export MCSMANAGER_API_KEY="你的 API Key"
export MCSMANAGER_TIMEOUT_MS="15000"
```

安装插件和启动 Gateway 时，OpenClaw 会基于插件元数据提示缺失的关键环境变量：

- `MCSMANAGER_BASE_URL`
- `MCSMANAGER_API_KEY`

其中主环境变量标记为：

- `MCSMANAGER_API_KEY`

## 配置优先级

插件按下面顺序取值：

1. OpenClaw 插件配置 `plugins.entries.openclaw-mcsmanager-plugin.config`
2. 插件目录下的 `.env`
3. 进程环境变量

如果 `baseUrl` 或 `apiKey` 缺失，插件会进入 `idle` 状态，不注册任何工具，并在 Gateway 日志里提示需要补齐配置。

## MCSManager 鉴权说明

根据官方 API 文档：

- API Key 需要放在 URL Query 的 `apikey` 参数中
- 需要带上请求头 `X-Requested-With: XMLHttpRequest`
- 需要带上请求头 `Content-Type: application/json; charset=utf-8`

插件内部已经统一处理了这些细节。
