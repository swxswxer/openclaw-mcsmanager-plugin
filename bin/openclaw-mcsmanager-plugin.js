#!/usr/bin/env node

import fs from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PACKAGE_NAME = "openclaw-mcsmanager-plugin";
const OPENCLAW_CONFIG_PATH = path.join(homedir(), ".openclaw", "openclaw.json");
const OPENCLAW_EXTENSIONS_PATH = path.join(homedir(), ".openclaw", "extensions");
const PLUGIN_INSTALL_PATH = path.join(OPENCLAW_EXTENSIONS_PATH, PACKAGE_NAME);

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
  removePluginKeysFromConfig();
  runOpenClaw(["plugins", "install", PACKAGE_NAME]);
  restorePluginEntrySnapshot(snapshot);
  restartGateway();
}

function update() {
  const snapshot = readPluginEntrySnapshot();
  removePluginKeysFromConfig();

  runOpenClaw(["plugins", "uninstall", PACKAGE_NAME], {
    input: "y\n",
    allowFailure: true
  });

  removeInstallDirectory();
  runOpenClaw(["plugins", "install", PACKAGE_NAME]);
  restorePluginEntrySnapshot(snapshot);
  restartGateway();
}

function printHelp() {
  console.log(`
Usage:
  npx -y ${PACKAGE_NAME} install
  npx -y ${PACKAGE_NAME} update

Commands:
  install   Install the OpenClaw plugin from npm and restart gateway
  update    Preserve plugin config, reinstall the plugin, and restart gateway
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

function removePluginKeysFromConfig() {
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

  if (plugins.installs && typeof plugins.installs === "object") {
    delete plugins.installs[PACKAGE_NAME];
  }

  writeOpenClawConfig(config);
}

function restorePluginEntrySnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  const config = readOpenClawConfig();
  if (!config) {
    return;
  }

  const plugins = ensureObject(config, "plugins");
  const entries = ensureNestedObject(plugins, "entries");
  const currentEntry =
    entries[PACKAGE_NAME] && typeof entries[PACKAGE_NAME] === "object"
      ? entries[PACKAGE_NAME]
      : {};

  entries[PACKAGE_NAME] = {
    ...currentEntry,
    ...snapshot
  };

  writeOpenClawConfig(config);
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
