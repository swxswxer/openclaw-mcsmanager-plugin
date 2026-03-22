import { Type } from "@sinclair/typebox";
import type { AnyAgentTool, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { createClient, createTextResult } from "./shared.js";

export function createOverviewTool(api: OpenClawPluginApi): AnyAgentTool {
  return {
    name: "mcsmanager_overview",
    label: "MCSManager 概览",
    description: "获取 MCSManager 仪表盘概览数据，并返回所有节点的 daemonId。",
    parameters: Type.Object({}),
    async execute() {
      const client = createClient(api);
      const overview = await client.getOverview();
      const payload = {
        panel: {
          version: overview.version,
          specifiedDaemonVersion: overview.specifiedDaemonVersion,
          remoteCount: overview.remoteCount,
          system: overview.system,
          process: overview.process,
          record: overview.record,
          chart: overview.chart
        },
        daemons: (overview.remote ?? []).map((item) => ({
          daemonId: item.uuid,
          remarks: item.remarks,
          ip: item.ip,
          port: item.port,
          prefix: item.prefix,
          available: item.available,
          version: item.version,
          instance: item.instance
        })),
        raw: overview
      };
      return createTextResult("MCSManager 概览数据", payload);
    }
  };
}
