import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import {
  createInstanceCommandTool,
  createInstanceDetailTool,
  createInstanceListTool,
  createInstanceRestartTool,
  createInstanceStartTool,
  createInstanceStopTool
} from "./tools/instances.js";
import { createOverviewTool } from "./tools/overview.js";
import { resolveDefaultConnectionConfig } from "./tools/shared.js";

export default function register(api: OpenClawPluginApi) {
  const logPrefix = "openclaw-mcsmanager-plugin";
  const defaults = resolveDefaultConnectionConfig(api);
  const missing: string[] = [];

  if (!defaults.baseUrl) {
    missing.push("MCSMANAGER_BASE_URL");
  }

  if (!defaults.apiKey) {
    missing.push("MCSMANAGER_API_KEY");
  }

  if (missing.length > 0) {
    api.logger.warn(
      `${logPrefix}: no default config found. Set ${missing.join(
        " and "
      )} env var${missing.length > 1 ? "s" : ""} or plugins.entries.openclaw-mcsmanager-plugin.config.{baseUrl,apiKey}. Plugin idle.`
    );
    api.registerService({
      id: "openclaw-mcsmanager-plugin-config-status",
      start: () =>
        api.logger.info(
          `${logPrefix}: waiting for baseUrl/apiKey from plugin config, plugin root .env, or process env.`
        ),
      stop: () => {}
    });
    return;
  }

  api.logger.info(`${logPrefix}: initialized with default connection config.`);

  api.registerTool(createOverviewTool(api));
  api.registerTool(createInstanceListTool(api));
  api.registerTool(createInstanceDetailTool(api));
  api.registerTool(createInstanceStartTool(api));
  api.registerTool(createInstanceStopTool(api));
  api.registerTool(createInstanceRestartTool(api));
  api.registerTool(createInstanceCommandTool(api));
}
