"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourceTable } from "@/components/source-table";
import { AddSourceDialog } from "@/components/add-source-dialog";
import type { Source } from "@ghost/types";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sources</h2>
          <p className="text-muted-foreground">
            Manage your content sources — blogs, articles, and newsletters
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <SourceTable sources={sources} onDeleted={loadSources} />
      )}

      <AddSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdded={loadSources}
      />
    </div>
  );
}
