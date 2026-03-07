"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Check, X, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface GmailStatus {
  connected: boolean;
  expiresAt?: string;
}

interface ConfigStatus {
  [key: string]: boolean;
}

export default function SettingsPage() {
  const [gmail, setGmail] = useState<GmailStatus>({ connected: false });
  const [config, setConfig] = useState<ConfigStatus>({});
  const [loading, setLoading] = useState(true);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    const [gmailRes, configRes] = await Promise.all([
      fetch("/api/gmail"),
      fetch("/api/settings/config"),
    ]);
    const [gmailData, configData] = await Promise.all([
      gmailRes.json(),
      configRes.ok ? configRes.json() : {},
    ]);
    setGmail(gmailData);
    setConfig(configData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleDisconnect() {
    await fetch("/api/gmail", { method: "DELETE" });
    setGmail({ connected: false });
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage connections and configuration
        </p>
      </div>

      {/* Gmail Connection */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Gmail Connection</h3>
            <p className="text-sm text-muted-foreground">
              {gmail.connected
                ? "Connected — newsletter scanning is available"
                : "Not connected — connect to scan newsletters"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {gmail.connected ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-green-900/30 px-2 py-1 text-xs text-green-400 border border-green-800">
                <Check className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-muted-foreground border border-zinc-700">
                <X className="h-3 w-3" />
                Disconnected
              </span>
            )}
          </div>
        </div>

        <div>
          {gmail.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisconnectOpen(true)}
            >
              Disconnect Gmail
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Use the Ghost Writer conversation to connect Gmail
            </p>
          )}
        </div>
      </div>

      {/* Configuration Status */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
            <Key className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configuration status
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(config).map(([key, present]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {present ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <X className="h-4 w-4 text-red-400" />
              )}
              <code className="font-mono text-xs">{key}</code>
              <span className="text-muted-foreground">
                {present ? "configured" : "missing"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect Gmail"
        description="This will remove your Gmail connection. You'll need to re-authenticate to scan newsletters again."
        onConfirm={handleDisconnect}
        confirmLabel="Disconnect"
        destructive
      />
    </div>
  );
}
