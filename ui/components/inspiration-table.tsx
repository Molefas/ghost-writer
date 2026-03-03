"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoreBadge } from "@/components/score-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Inspiration, Source, Content } from "@ghost/types";

interface InspirationTableProps {
  inspirations: Inspiration[];
  sources: Source[];
  onDeleted: () => void;
}

export function InspirationTable({
  inspirations,
  sources,
  onDeleted,
}: InspirationTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState<Content["type"]>("article");
  const [creating, setCreating] = useState(false);

  const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === inspirations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(inspirations.map((i) => i.id)));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/inspirations?id=${deleteId}`, { method: "DELETE" });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(deleteId);
      return next;
    });
    onDeleted();
    setDeleteId(null);
  }

  async function handleCreateContent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/inspirations/create-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          type: createType,
          inspirationIds: Array.from(selected),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(data.redirect);
      }
    } finally {
      setCreating(false);
    }
  }

  if (inspirations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No inspirations yet. Scan a blog source using the conversational trik to discover articles.
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <Button
            size="sm"
            onClick={() => {
              setCreateTitle("");
              setCreateType("article");
              setCreateDialogOpen(true);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Create Content
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-4 py-3 w-10">
                <Checkbox
                  checked={
                    inspirations.length > 0 &&
                    selected.size === inspirations.length
                  }
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium w-20">Score</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {inspirations.map((insp) => (
              <tr
                key={insp.id}
                className="border-b border-border last:border-0 hover:bg-accent/30"
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selected.has(insp.id)}
                    onCheckedChange={() => toggleSelect(insp.id)}
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  <a
                    href={insp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:text-blue-400"
                    title={insp.title}
                  >
                    <span className="line-clamp-1 max-w-md">
                      {insp.title}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {sourceMap.get(insp.sourceId) || "Unknown"}
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={insp.score} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(insp.addedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(insp.id)}
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
        title="Remove Inspiration"
        description="This will remove the inspiration. This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Remove"
        destructive
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Content</DialogTitle>
            <DialogDescription>
              Create a new draft from {selected.size} selected inspiration
              {selected.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. The Future of AI Agents"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select
                value={createType}
                onValueChange={(v) => setCreateType(v as Content["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Post</SelectItem>
                  <SelectItem value="x_post">X Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creating || !createTitle}>
                {creating ? "Creating..." : "Create Draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
