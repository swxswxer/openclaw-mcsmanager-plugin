import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McsManagerClient, type McsManagerConnectionConfig } from "../client.js";

export function createClient(api: any): McsManagerClient {
  const config = resolveConnectionConfig(api);
  return new McsManagerClient(config);
}

export function resolveDefaultConnectionConfig(api: any): Partial<McsManagerConnectionConfig> {
  const pluginConfig = readPluginConfig(api);
  const dotenv = readPluginDotenv();

  return {
    baseUrl: pluginConfig.baseUrl ?? dotenv.MCSMANAGER_BASE_URL ?? process.env.MCSMANAGER_BASE_URL,
    apiKey: pluginConfig.apiKey ?? dotenv.MCSMANAGER_API_KEY ?? process.env.MCSMANAGER_API_KEY,
    timeoutMs: pluginConfig.timeoutMs ?? readTimeoutEnv(dotenv)
  };
}

export function createTextResult(title: string, payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${title}\n\n${JSON.stringify(payload, null, 2)}`
      }
    ],
    details: payload
  };
}

let cachedDotenv: Record<string, string> | null = null;

function resolveConnectionConfig(api: any): McsManagerConnectionConfig {
  const defaults = resolveDefaultConnectionConfig(api);
  const baseUrl = defaults.baseUrl;
  const apiKey = defaults.apiKey;
  const timeoutMs = defaults.timeoutMs;

  if (!baseUrl) {
    throw new Error(
      "未找到 MCSManager baseUrl。请配置插件配置、插件目录 .env 或环境变量 MCSMANAGER_BASE_URL。"
    );
  }

  if (!apiKey) {
    throw new Error(
      "未找到 MCSManager apiKey。请配置插件配置、插件目录 .env 或环境变量 MCSMANAGER_API_KEY。"
    );
  }

  return { baseUrl, apiKey, timeoutMs };
}

function readPluginConfig(api: any): Record<string, any> {
  if (api?.pluginConfig && typeof api.pluginConfig === "object") {
    return api.pluginConfig as Record<string, any>;
  }

  const pluginNames = [
    "openclaw-mcsmanager-plugin",
    "mcsmanager"
  ];

  for (const name of pluginNames) {
    const config = api?.config?.plugins?.entries?.[name]?.config;
    if (config && typeof config === "object") {
      return config;
    }
  }

  return {};
}

function readTimeoutEnv(dotenv: Record<string, string>): number | undefined {
  const raw = dotenv.MCSMANAGER_TIMEOUT_MS ?? process.env.MCSMANAGER_TIMEOUT_MS;
  if (!raw) {
    return undefined;
  }

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function readPluginDotenv(): Record<string, string> {
  if (cachedDotenv) {
    return cachedDotenv;
  }

  const pluginRoot = resolvePluginRoot();
  const dotenvPath = path.join(pluginRoot, ".env");

  if (!fs.existsSync(dotenvPath)) {
    cachedDotenv = {};
    return cachedDotenv;
  }

  const content = fs.readFileSync(dotenvPath, "utf8");
  cachedDotenv = parseDotenv(content);
  return cachedDotenv;
}

function resolvePluginRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../../");
}

function parseDotenv(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}
