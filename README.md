# openclaw-mcsmanager-plugin

一个面向 OpenClaw 的 MCSManager 插件，用于在对话中管理 Minecraft 服务器或其他由 MCSManager 托管的实例。

当前版本聚焦于最常用的实例管理能力：查看仪表盘概览、获取节点 `daemonId`、查询实例、查看实例详情、启动/停止/重启实例，以及向实例发送控制台命令。

## 特性

- 支持读取 MCSManager 仪表盘概览与节点信息
- 支持查询实例列表和实例详情
- 支持启动、停止、重启实例
- 支持向实例发送控制台命令
- 支持插件配置、插件目录 `.env`、系统环境变量三种配置来源
- Skill 已按模块拆分，便于后续扩展文件管理、节点管理、镜像管理等功能

## 已实现能力

### 仪表盘管理

- `mcsmanager_overview`
  获取面板概览，并提取节点 `daemonId`

### 实例管理

- `mcsmanager_instance_list`
  根据 `daemonId` 获取实例列表
- `mcsmanager_instance_detail`
  获取单个实例详情
- `mcsmanager_instance_start`
  启动实例
- `mcsmanager_instance_stop`
  停止实例
- `mcsmanager_instance_restart`
  重启实例
- `mcsmanager_instance_command`
  向实例发送控制台命令

## Skills

项目将 agent 使用说明拆分为两个模块化 skill：

- [mcsmanager-dashboard/SKILL.md](/Users/swxswx/Desktop/code/codex/getMd/openclaw-mcsmanager-plugin/skills/mcsmanager-dashboard/SKILL.md)
- [mcsmanager-instance/SKILL.md](/Users/swxswx/Desktop/code/codex/getMd/openclaw-mcsmanager-plugin/skills/mcsmanager-instance/SKILL.md)

建议：

- 涉及面板概览、节点、`daemonId` 获取时，优先阅读 `mcsmanager-dashboard`
- 涉及实例状态、启停重启、发送命令时，优先阅读 `mcsmanager-instance`

## 安装

### 方式一：从本地路径安装

适合开发或自托管部署：

```bash
cd /path/to/openclaw-mcsmanager-plugin
npm install
npm run build
openclaw plugins install /path/to/openclaw-mcsmanager-plugin
openclaw gateway restart
```

### 方式二：通过 npx 安装

```bash
npx -y openclaw-mcsmanager-plugin install
```

该命令会：

1. 清理当前用户 `.openclaw` 中这个插件的陈旧配置键
2. 从 npm 安装插件
3. 补回插件允许列表与启用状态
4. 自动重启 OpenClaw Gateway

### 方式三：更新已安装插件

如果你已经安装过旧版本，可以直接使用：

```bash
npx -y openclaw-mcsmanager-plugin update
```

该命令会：

1. 清理 `plugins.allow`、`plugins.entries`、`plugins.installs` 中的旧记录
2. 调用 `openclaw plugins uninstall openclaw-mcsmanager-plugin --force`
3. 删除旧扩展目录
4. 设置 npm 官方 registry
5. 从 npm 重新安装插件
6. 补回插件允许列表与启用状态
7. 自动恢复插件目录内已有的 `.env`
8. 自动重启 OpenClaw Gateway

## 配置

插件不会在单次工具调用时手动接收 `baseUrl` / `apiKey`。  
必须先提供默认配置，相关工具才会注册。

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

## 开发

安装依赖：

```bash
npm install
```

类型检查：

```bash
npm run check
```

构建：

```bash
npm run build
```

## 发布

项目已包含基于 Git tag 的 npm 自动发布工作流：

- [publish.yml](/Users/swxswx/Desktop/code/codex/getMd/openclaw-mcsmanager-plugin/.github/workflows/publish.yml)

触发方式：

```bash
git tag v0.1.0
git push origin v0.1.0
```

工作流会自动：

1. 安装依赖
2. 校验 `package.json.version` 与 tag 一致
3. 执行构建
4. 发布到 npm

发布前需要在 npm 后台为当前 GitHub 仓库配置 Trusted Publishing。

## 路线图

- 文件管理
- 节点管理
- 镜像管理
- 用户管理
- 输出日志读取
- 批量实例操作

## 参考文档

- [API接口-仪表盘管理.md](/Users/swxswx/Desktop/code/codex/getMd/md/API接口-仪表盘管理.md)
- [API接口-实例管理.md](/Users/swxswx/Desktop/code/codex/getMd/md/API接口-实例管理.md)
- [MCSManager Documentation](https://docs.mcsmanager.com/)

## License

MIT
