"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Pencil, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Content } from "@ghost/types";

interface ContentTableProps {
  content: Content[];
  onChanged: () => void;
}

export function ContentTable({ content, onChanged }: ContentTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const typeBadgeColor: Record<Content["type"], string> = {
    article: "bg-blue-900/50 text-blue-400 border-blue-800",
    linkedin: "bg-sky-900/50 text-sky-400 border-sky-800",
    x_post: "bg-zinc-700 text-zinc-300 border-zinc-600",
  };

  const typeLabel: Record<Content["type"], string> = {
    article: "Article",
    linkedin: "LinkedIn",
    x_post: "X Post",
  };

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/content/${deleteId}`, { method: "DELETE" });
    onChanged();
    setDeleteId(null);
  }

  async function toggleStatus(item: Content) {
    const newStatus = item.status === "draft" ? "done" : "draft";
    await fetch(`/api/content/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onChanged();
  }

  if (content.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No content yet. Select inspirations and create a draft to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium w-24">Type</th>
              <th className="px-4 py-3 font-medium w-24">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {content.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border last:border-0 hover:bg-accent/30"
              >
                <td className="px-4 py-3 text-sm font-medium">
                  <Link
                    href={`/content/${item.id}`}
                    className="hover:text-blue-400"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={typeBadgeColor[item.type]}
                  >
                    {typeLabel[item.type]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(item)}
                    className="inline-flex items-center gap-1.5 text-sm"
                  >
                    {item.status === "done" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">Done</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Draft</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/content/${item.id}`}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(item.id)}
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
        title="Delete Content"
        description="This will permanently delete this content piece. This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
