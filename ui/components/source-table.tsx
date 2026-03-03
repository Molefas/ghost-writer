"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Source } from "@ghost/types";

interface SourceTableProps {
  sources: Source[];
  onDeleted: () => void;
}

export function SourceTable({ sources, onDeleted }: SourceTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/sources?id=${deleteId}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const typeBadgeColor: Record<Source["type"], string> = {
    blog: "bg-blue-900/50 text-blue-400 border-blue-800",
    article: "bg-purple-900/50 text-purple-400 border-purple-800",
    newsletter: "bg-orange-900/50 text-orange-400 border-orange-800",
  };

  if (sources.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No sources yet. Add one to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">URL / Email</th>
              <th className="px-4 py-3 font-medium">Last Scanned</th>
              <th className="px-4 py-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr
                key={source.id}
                className="border-b border-border last:border-0 hover:bg-accent/30"
              >
                <td className="px-4 py-3 text-sm font-medium">
                  {source.name}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={typeBadgeColor[source.type]}
                  >
                    {source.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                    >
                      {new URL(source.url).hostname}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    source.email || "—"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {source.lastScanned
                    ? new Date(source.lastScanned).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(source.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove Source"
        description="This will remove the source and all associated inspirations. This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Remove"
        destructive
      />
    </>
  );
}
