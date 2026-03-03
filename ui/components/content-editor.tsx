"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Content } from "@ghost/types";

interface ContentEditorProps {
  content: Content;
  onSaved: (updated: Content) => void;
}

export function ContentEditor({ content, onSaved }: ContentEditorProps) {
  const [body, setBody] = useState(content.body);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (text: string) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/content/${content.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        if (res.ok) {
          const updated = await res.json();
          onSaved(updated);
        }
      } finally {
        setSaving(false);
      }
    },
    [content.id, onSaved]
  );

  function handleChange(text: string) {
    setBody(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 500);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Tabs defaultValue="edit" className="flex-1 flex flex-col">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <span className="text-xs text-muted-foreground">
          {saving ? "Saving..." : "Saved"}
        </span>
      </div>
      <TabsContent value="edit" className="flex-1">
        <textarea
          value={body}
          onChange={(e) => handleChange(e.target.value)}
          className="h-full min-h-[400px] w-full resize-none rounded-md border border-input bg-transparent p-4 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Start writing..."
        />
      </TabsContent>
      <TabsContent value="preview" className="flex-1">
        <div className="min-h-[400px] rounded-md border border-border p-4">
          {body ? (
            <div className="prose max-w-none">
              <ReactMarkdown>{body}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground">Nothing to preview</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
