import { Type } from "@sinclair/typebox";
import type { AnyAgentTool, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { createClient, createTextResult } from "./shared.js";

export function createInstanceListTool(api: OpenClawPluginApi): AnyAgentTool {
  return {
    name: "mcsmanager_instance_list",
    label: "MCSManager 实例列表",
    description: "按 daemonId 获取实例列表。",
    parameters: Type.Object({
      daemonId: Type.String({
        description: "节点 daemonId，可先通过 mcsmanager_overview 获取。"
      }),
      page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
      pageSize: Type.Optional(Type.Number({ minimum: 1, default: 20 })),
      instanceName: Type.Optional(
        Type.String({
          description: "按实例名称模糊过滤。"
        })
      ),
      status: Type.Optional(
        Type.String({
          description: "实例状态过滤值；不确定时可留空。"
        })
      )
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const client = createClient(api);
      const daemonId = expectString(params.daemonId, "daemonId");
      const result = await client.listInstances({
        daemonId,
        page: optionalNumber(params.page),
        pageSize: optionalNumber(params.pageSize),
        instanceName: optionalString(params.instanceName),
        status: optionalString(params.status)
      });

      return createTextResult("MCSManager 实例列表", {
        daemonId,
        page: optionalNumber(params.page) ?? 1,
        pageSize: optionalNumber(params.pageSize) ?? 20,
        total: result.total,
        maxPage: result.maxPage,
        items: result.data
      });
    }
  };
}

export function createInstanceDetailTool(api: OpenClawPluginApi): AnyAgentTool {
  return createInstanceActionLikeTool(api, {
    name: "mcsmanager_instance_detail",
    label: "MCSManager 实例详情",
    description: "获取单个实例的详细信息。",
    run: (client, params) => client.getInstanceDetail(params),
    resultTitle: "MCSManager 实例详情"
  });
}

export function createInstanceStartTool(api: OpenClawPluginApi): AnyAgentTool {
  return createInstanceActionLikeTool(api, {
    name: "mcsmanager_instance_start",
    label: "启动 MCSManager 实例",
    description: "启动一个实例。",
    run: (client, params) => client.startInstance(params),
    resultTitle: "MCSManager 实例启动结果"
  });
}

export function createInstanceStopTool(api: OpenClawPluginApi): AnyAgentTool {
  return createInstanceActionLikeTool(api, {
    name: "mcsmanager_instance_stop",
    label: "停止 MCSManager 实例",
    description: "停止一个实例。",
    run: (client, params) => client.stopInstance(params),
    resultTitle: "MCSManager 实例停止结果"
  });
}

export function createInstanceRestartTool(api: OpenClawPluginApi): AnyAgentTool {
  return createInstanceActionLikeTool(api, {
    name: "mcsmanager_instance_restart",
    label: "重启 MCSManager 实例",
    description: "重启一个实例。",
    run: (client, params) => client.restartInstance(params),
    resultTitle: "MCSManager 实例重启结果"
  });
}

export function createInstanceCommandTool(api: OpenClawPluginApi): AnyAgentTool {
  return {
    name: "mcsmanager_instance_command",
    label: "发送 MCSManager 实例命令",
    description: "向指定实例发送一条控制台命令。",
    parameters: Type.Object({
      daemonId: Type.String({
        description: "节点 daemonId。"
      }),
      uuid: Type.String({
        description: "实例 UUID。"
      }),
      command: Type.String({
        minLength: 1,
        description: "要发送到实例控制台的命令内容。"
      })
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const client = createClient(api);
      const input = {
        daemonId: expectString(params.daemonId, "daemonId"),
        uuid: expectString(params.uuid, "uuid"),
        command: expectString(params.command, "command")
      };
      const result = await client.sendInstanceCommand(input);
      return createTextResult("MCSManager 实例发送命令结果", {
        ...result,
        command: input.command
      });
    }
  };
}

function createInstanceActionLikeTool(
  api: OpenClawPluginApi,
  options: {
    name: string;
    label: string;
    description: string;
    resultTitle: string;
    run: (
      client: ReturnType<typeof createClient>,
      params: { daemonId: string; uuid: string }
    ) => Promise<unknown>;
  }
): AnyAgentTool {
  return {
    name: options.name,
    label: options.label,
    description: options.description,
    parameters: Type.Object({
      daemonId: Type.String(),
      uuid: Type.String({
        description: "实例 UUID。"
      })
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const client = createClient(api);
      const input = {
        daemonId: expectString(params.daemonId, "daemonId"),
        uuid: expectString(params.uuid, "uuid")
      };
      const result = await options.run(client, input);
      return createTextResult(options.resultTitle, result);
    }
  };
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} 不能为空`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
