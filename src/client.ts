export interface McsManagerConnectionConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export interface McsManagerApiResponse<T> {
  status: number;
  data: T;
  time: number;
}

export interface OverviewNode {
  uuid: string;
  ip: string;
  port: number;
  prefix: string;
  available: boolean;
  remarks: string;
  version?: string;
  instance?: {
    running: number;
    total: number;
  };
  system?: Record<string, unknown>;
  process?: Record<string, unknown>;
  cpuMemChart?: Array<Record<string, unknown>>;
}

export interface OverviewData {
  version?: string;
  specifiedDaemonVersion?: string;
  process?: Record<string, unknown>;
  record?: Record<string, unknown>;
  system?: Record<string, unknown>;
  chart?: Record<string, unknown>;
  remoteCount?: {
    available: number;
    total: number;
  };
  remote?: OverviewNode[];
}

export interface InstanceSummary {
  instanceUuid: string;
  config?: {
    nickname?: string;
    type?: string;
    processType?: string;
    cwd?: string;
    createDatetime?: number;
    lastDatetime?: number;
    [key: string]: unknown;
  };
  info?: Record<string, unknown>;
  processInfo?: Record<string, unknown>;
  space?: number;
  started?: number;
  status?: number;
  [key: string]: unknown;
}

export interface InstanceListData {
  maxPage?: number;
  page?: number;
  pageSize?: number;
  total?: number;
  data: InstanceSummary[];
}

export interface InstanceDetail extends InstanceSummary {}

export interface InstanceOperationResult {
  instanceUuid: string;
  [key: string]: unknown;
}

export interface ListInstancesInput {
  daemonId: string;
  page?: number;
  pageSize?: number;
  instanceName?: string;
  status?: string;
}

export interface InstanceActionInput {
  daemonId: string;
  uuid: string;
}

export interface InstanceCommandInput extends InstanceActionInput {
  command: string;
}

export class McsManagerClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config: McsManagerConnectionConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 15_000;
  }

  async getOverview(): Promise<OverviewData> {
    return this.request<OverviewData>("GET", "/api/overview");
  }

  async listInstances(input: ListInstancesInput): Promise<InstanceListData> {
    return this.request<InstanceListData>("GET", "/api/service/remote_service_instances", {
      query: {
        daemonId: input.daemonId,
        page: String(input.page ?? 1),
        page_size: String(input.pageSize ?? 20),
        instance_name: input.instanceName ?? "",
        status: input.status ?? ""
      }
    });
  }

  async getInstanceDetail(input: InstanceActionInput): Promise<InstanceDetail> {
    return this.request<InstanceDetail>("GET", "/api/instance", {
      query: {
        daemonId: input.daemonId,
        uuid: input.uuid
      }
    });
  }

  async startInstance(input: InstanceActionInput): Promise<InstanceOperationResult> {
    return this.instanceAction("/api/protected_instance/open", input);
  }

  async stopInstance(input: InstanceActionInput): Promise<InstanceOperationResult> {
    //由于mcsmanager的关闭命令有问题，导致服务器有可能不会正常关闭，这里用“强制结束实例进程”接口来关闭服务器
    return this.instanceAction("/api/protected_instance/kill", input);
  }

  async restartInstance(input: InstanceActionInput): Promise<InstanceOperationResult> {
    return this.instanceAction("/api/protected_instance/restart", input);
  }

  async sendInstanceCommand(input: InstanceCommandInput): Promise<InstanceOperationResult> {
    return this.request<InstanceOperationResult>("GET", "/api/protected_instance/command", {
      query: {
        daemonId: input.daemonId,
        uuid: input.uuid,
        command: input.command
      }
    });
  }

  private async instanceAction(
    path: string,
    input: InstanceActionInput
  ): Promise<InstanceOperationResult> {
    return this.request<InstanceOperationResult>("GET", path, {
      query: {
        daemonId: input.daemonId,
        uuid: input.uuid
      }
    });
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      query?: Record<string, string>;
      body?: unknown;
    }
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = new URL(path, this.baseUrl);
      url.searchParams.set("apikey", this.apiKey);

      for (const [key, value] of Object.entries(options?.query ?? {})) {
        url.searchParams.set(key, value);
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: options?.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });

      const text = await response.text();
      const parsed = tryParseJson(text);

      if (!response.ok) {
        throw new Error(
          `MCSManager 请求失败: HTTP ${response.status}${parsed ? `, body=${JSON.stringify(parsed)}` : ""}`
        );
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error(`MCSManager 返回了非 JSON 响应: ${text.slice(0, 500)}`);
      }

      const result = parsed as McsManagerApiResponse<T>;
      if (result.status !== 200) {
        throw new Error(`MCSManager API 返回异常状态: ${result.status}`);
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`MCSManager 请求超时，超过 ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new Error("MCSManager baseUrl 不能为空");
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
