import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SECRETS_PATH = path.join(os.homedir(), ".trikhub", "secrets.json");

interface Secrets {
  [key: string]: string | undefined;
}

let _cache: Secrets | null = null;

function loadSecrets(): Secrets {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(SECRETS_PATH, "utf-8");
    _cache = JSON.parse(raw) as Secrets;
    return _cache;
  } catch {
    return {};
  }
}

export function getSecret(key: string): string | undefined {
  const secrets = loadSecrets();
  return secrets[key];
}

export function hasSecret(key: string): boolean {
  return getSecret(key) !== undefined;
}

export function getConfigStatus(): Record<string, boolean> {
  const secrets = loadSecrets();
  return {
    ANTHROPIC_API_KEY: !!secrets.ANTHROPIC_API_KEY,
    GOOGLE_CLIENT_ID: !!secrets.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!secrets.GOOGLE_CLIENT_SECRET,
  };
}

/** Clear cached secrets so next read picks up file changes */
export function clearSecretsCache(): void {
  _cache = null;
}
