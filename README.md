<div align="center">

# openclaw-mcsmanager-plugin

> 面向 OpenClaw 的 MCSManager 插件

让 Agent 以更自然的方式接入 MCSManager，  
完成实例查询、状态查看、启停重启、控制台命令下发等常用操作。  
当前版本聚焦仪表盘管理与实例管理，并为后续扩展节点、文件、镜像等模块预留了清晰结构。

---

[![npm version](https://img.shields.io/npm/v/openclaw-mcsmanager-plugin?style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/openclaw-mcsmanager-plugin)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://github.com/swxswxer/openclaw-mcsmanager-plugin/blob/main/LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-2026.3.13%2B-blue?style=flat-square)](https://openclaw.cc/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Plugin-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://github.com/swxswxer/openclaw-mcsmanager-plugin)

</div>

## 功能矩阵

| 模块 | 特性 | 工具名称 | 是否实现  |
| --- | --- | --- |-------|
| 仪表盘管理 | 获取面板概览与节点 `daemonId` | `mcsmanager_overview` | ✅     |
| 实例管理 | 获取实例列表 | `mcsmanager_instance_list` | ✅     |
| 实例管理 | 获取实例详情与运行状态 | `mcsmanager_instance_detail` | ✅     |
| 实例管理 | 启动实例 | `mcsmanager_instance_start` | ✅     |
| 实例管理 | 停止实例 | `mcsmanager_instance_stop` | ✅     |
| 实例管理 | 重启实例 | `mcsmanager_instance_restart` | ✅     |
| 实例管理 | 向实例发送控制台命令 | `mcsmanager_instance_command` | ✅     |
| 节点管理 | 查询节点列表与节点详情 | `mcsmanager_node_list` / `mcsmanager_node_detail` | ❌     |
| 文件管理 | 浏览、上传、下载、删除实例文件 | `mcsmanager_file_*` | ❌     |
| 镜像管理 | 查询镜像列表与镜像详情 | `mcsmanager_image_*` | ❌     |
| 用户管理 | 查询用户信息与权限 | `mcsmanager_user_*` | ❌     |
| 实例管理 | 获取实例日志与控制台输出 | `mcsmanager_instance_logs` | ❌     |
| 实例管理 | 创建、编辑、删除实例 | `mcsmanager_instance_create` / `mcsmanager_instance_update` / `mcsmanager_instance_delete` | ❌     |
> **插件持续更新**：更多特性将在后续更新中实现

## 安装
### 方式一：通过 npx 安装

```bash
npx -y openclaw-mcsmanager-plugin install
```

该命令会：

1. 清理当前用户 `.openclaw` 中这个插件的陈旧配置键
2. 从 npm 安装插件
3. 补回插件允许列表与启用状态
4. 自动重启 OpenClaw Gateway

### 方式二：从本地路径安装

适合开发或自托管部署：

```bash
cd /path/to/openclaw-mcsmanager-plugin
npm install
npm run build
openclaw plugins install /path/to/openclaw-mcsmanager-plugin
openclaw gateway restart
```

### 方式三：更新已安装插件

如果你已经安装过旧版本，可以直接使用：

```bash
npx -y openclaw-mcsmanager-plugin update
```

该命令会：

1. 先清理 `plugins.allow` 和 `plugins.entries` 中的旧记录
2. 调用 `openclaw plugins uninstall openclaw-mcsmanager-plugin --force`
3. 清理残留的 `plugins.installs` 记录和旧扩展目录
4. 设置 npm 官方 registry
5. 从 npm 重新安装插件
6. 补回插件允许列表与启用状态
7. 自动恢复插件目录内已有的 `.env`
8. 自动重启 OpenClaw Gateway

## 配置

需要先配置参数 `baseUrl` / `apiKey`，插件相关工具才会注册。

配置优先级如下：

1. `plugins.entries.openclaw-mcsmanager-plugin.config`
2. 插件根目录 `.env`
3. 系统环境变量 `MCSMANAGER_BASE_URL` / `MCSMANAGER_API_KEY`

### OpenClaw 配置示例

```json
{
  "plugins": {
    "entries": {
      "openclaw-mcsmanager-plugin": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:23333",
          "apiKey": "your-api-key",
          "timeoutMs": 15000
        }
      }
    }
  }
}
```

### `.env` 示例

将 `.env` 放在插件安装目录，例如：

`~/.openclaw/extensions/openclaw-mcsmanager-plugin/.env`

内容如下：

```env
MCSMANAGER_BASE_URL=http://127.0.0.1:23333
MCSMANAGER_API_KEY=your_api_key
MCSMANAGER_TIMEOUT_MS=15000
```

### 环境变量示例

```bash
export MCSMANAGER_BASE_URL="http://127.0.0.1:23333"
export MCSMANAGER_API_KEY="your_api_key"
export MCSMANAGER_TIMEOUT_MS="15000"
```

## 工作原理

插件内部会统一处理 MCSManager 的鉴权与请求细节：

- `apikey` 通过 URL Query 传递
- 自动添加 `X-Requested-With: XMLHttpRequest`
- 自动添加 `Content-Type: application/json; charset=utf-8`

如果默认配置缺失，插件会进入待机状态，不注册工具，并在日志中提示需要补齐配置。

## 项目结构

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


## 致谢

- [MCSManager](https://github.com/MCSManager/MCSManager)
- [OpenClaw](https://github.com/openclaw/openclaw)

## License

MIT
