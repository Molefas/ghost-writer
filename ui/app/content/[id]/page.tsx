"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentEditor } from "@/components/content-editor";
import type { Content, Inspiration } from "@ghost/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContentEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const loadContent = useCallback(async () => {
    const res = await fetch(`/api/content/${id}`);
    if (!res.ok) {
      router.push("/content");
      return;
    }
    const data = await res.json();
    setContent(data);
    setTitleDraft(data.title);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!content?.inspirationIds?.length) return;
    fetch("/api/inspirations")
      .then((r) => r.json())
      .then((all: Inspiration[]) => {
        const linked = all.filter((i) =>
          content.inspirationIds.includes(i.id)
        );
        setInspirations(linked);
      });
  }, [content?.inspirationIds]);

  async function toggleStatus() {
    if (!content) return;
    const newStatus = content.status === "draft" ? "done" : "draft";
    const res = await fetch(`/api/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContent(updated);
    }
  }

  async function saveTitle() {
    if (!content || titleDraft === content.title) {
      setEditingTitle(false);
      return;
    }
    const res = await fetch(`/api/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleDraft }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContent(updated);
    }
    setEditingTitle(false);
  }

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

  if (loading || !content) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/content")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            className="flex-1 bg-transparent text-xl font-bold outline-none border-b border-border"
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-xl font-bold cursor-pointer hover:text-muted-foreground"
            onClick={() => setEditingTitle(true)}
            title="Click to edit title"
          >
            {content.title}
          </h2>
        )}

        <Badge variant="outline" className={typeBadgeColor[content.type]}>
          {typeLabel[content.type]}
        </Badge>

        <button onClick={toggleStatus} className="inline-flex items-center gap-1.5 text-sm">
          {content.status === "done" ? (
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
      </div>

      {inspirations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">
            Inspirations:
          </span>
          {inspirations.map((insp) => (
            <a
              key={insp.id}
              href={insp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              <span className="max-w-[200px] truncate">{insp.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ))}
        </div>
      )}

      <ContentEditor
        content={content}
        onSaved={(updated) => setContent(updated)}
      />
    </div>
  );
}
