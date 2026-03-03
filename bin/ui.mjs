#!/usr/bin/env node
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiDir = join(__dirname, "..", "ui");

execSync("npx next dev", { cwd: uiDir, stdio: "inherit" });
