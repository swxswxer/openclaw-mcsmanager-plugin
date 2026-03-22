#!/usr/bin/env node

import fs from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PACKAGE_NAME = "openclaw-mcsmanager-plugin";
const OPENCLAW_CONFIG_PATH = path.join(homedir(), ".openclaw", "openclaw.json");
const OPENCLAW_EXTENSIONS_PATH = path.join(homedir(), ".openclaw", "extensions");
const PLUGIN_INSTALL_PATH = path.join(OPENCLAW_EXTENSIONS_PATH, PACKAGE_NAME);
const PLUGIN_ENV_PATH = path.join(PLUGIN_INSTALL_PATH, ".env");

main();

function main() {
  const command = process.argv[2];

  switch (command) {
    case "install":
      install();
      break;
    case "update":
      update();
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function install() {
  if (fs.existsSync(PLUGIN_INSTALL_PATH)) {
    console.log(`${PACKAGE_NAME} is already installed. Switching to update flow...`);
    update();
    return;
  }

  const snapshot = readPluginEntrySnapshot();
  removePluginConfigKeys();
  setNpmRegistry();
  runOpenClaw(["plugins", "install", PACKAGE_NAME]);
  finalizePluginConfig(snapshot);
  restartGateway();
}

function update() {
  console.log(`Starting reinstall update for ${PACKAGE_NAME}...`);

  const snapshot = readPluginEntrySnapshot();
  const envSnapshot = readPluginEnvSnapshot();
  removePluginConfigKeys();

  runOpenClaw(["plugins", "uninstall", PACKAGE_NAME, "--force"], {
    allowFailure: true
  });

  removePluginInstallRecord();
  removeInstallDirectory();
  setNpmRegistry();
  runOpenClaw(["plugins", "install", PACKAGE_NAME]);
  restorePluginEnvSnapshot(envSnapshot);
  finalizePluginConfig(snapshot);
  restartGateway();
}

function printHelp() {
  console.log(`
Usage:
  npx -y ${PACKAGE_NAME} install
  npx -y ${PACKAGE_NAME} update

Commands:
  install   Install the OpenClaw plugin from npm and restart gateway
  update    Reinstall the plugin from npm and restart gateway
`);
}

function runOpenClaw(args, options = {}) {
  const result = spawnSync("openclaw", args, {
    stdio: "inherit",
    input: options.input,
    encoding: "utf8"
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.error("openclaw command not found. Please install OpenClaw CLI first.");
    } else {
      console.error(result.error.message);
    }
    process.exit(1);
  }

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }
}

function restartGateway() {
  runOpenClaw(["gateway", "restart"]);
}

function setNpmRegistry() {
  const result = spawnSync("npm", ["config", "set", "registry", "https://registry.npmjs.org/"], {
    stdio: "inherit",
    encoding: "utf8"
  });

  if (result.error) {
    console.warn(`Failed to set npm registry: ${result.error.message}`);
    return;
  }

  if (result.status !== 0) {
    console.warn("Failed to set npm registry. Continuing with current npm registry.");
  }
}

function removeInstallDirectory() {
  if (fs.existsSync(PLUGIN_INSTALL_PATH)) {
    fs.rmSync(PLUGIN_INSTALL_PATH, { recursive: true, force: true });
  }
}

function readPluginEntrySnapshot() {
  const config = readOpenClawConfig();
  const entry = config?.plugins?.entries?.[PACKAGE_NAME];
  return entry ? JSON.parse(JSON.stringify(entry)) : null;
}

function readPluginEnvSnapshot() {
  if (!fs.existsSync(PLUGIN_ENV_PATH)) {
    return null;
  }

  return fs.readFileSync(PLUGIN_ENV_PATH, "utf8");
}

function removePluginConfigKeys() {
  const config = readOpenClawConfig();
  if (!config) {
    return;
  }

  const plugins = ensureObject(config, "plugins");

  if (Array.isArray(plugins.allow)) {
    plugins.allow = plugins.allow.filter((item) => item !== PACKAGE_NAME);
  }

  if (plugins.entries && typeof plugins.entries === "object") {
    delete plugins.entries[PACKAGE_NAME];
  }

  writeOpenClawConfig(config);
}

function removePluginInstallRecord() {
  const config = readOpenClawConfig();
  if (!config) {
    return;
  }

  const plugins = ensureObject(config, "plugins");

  if (plugins.installs && typeof plugins.installs === "object") {
    delete plugins.installs[PACKAGE_NAME];
  }

  writeOpenClawConfig(config);
}

function finalizePluginConfig(snapshot) {
  const config = readOpenClawConfig();
  if (!config) {
    return;
  }

  const plugins = ensureObject(config, "plugins");
  const allow = Array.isArray(plugins.allow) ? plugins.allow : [];

  if (!allow.includes(PACKAGE_NAME)) {
    allow.push(PACKAGE_NAME);
  }
  plugins.allow = allow;

  const entries = ensureNestedObject(plugins, "entries");
  const nextEntry = {
    enabled: true
  };

  if (snapshot?.config && typeof snapshot.config === "object") {
    nextEntry.config = snapshot.config;
  }

  entries[PACKAGE_NAME] = nextEntry;

  writeOpenClawConfig(config);
}

function restorePluginEnvSnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  fs.mkdirSync(PLUGIN_INSTALL_PATH, { recursive: true });
  fs.writeFileSync(PLUGIN_ENV_PATH, snapshot, "utf8");
}

function readOpenClawConfig() {
  if (!fs.existsSync(OPENCLAW_CONFIG_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(OPENCLAW_CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

function writeOpenClawConfig(config) {
  fs.writeFileSync(OPENCLAW_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function ensureObject(target, key) {
  if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
    target[key] = {};
  }
  return target[key];
}

function ensureNestedObject(target, key) {
  return ensureObject(target, key);
}
