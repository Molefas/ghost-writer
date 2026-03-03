"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InspirationTable } from "@/components/inspiration-table";
import type { Inspiration, Source } from "@ghost/types";

export default function InspirationsPage() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [minScore, setMinScore] = useState("0");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");

  const loadData = useCallback(async () => {
    const params = new URLSearchParams();
    if (sourceFilter !== "all") params.set("sourceId", sourceFilter);
    if (parseInt(minScore) > 0) params.set("minScore", minScore);
    if (query) params.set("query", query);

    const [inspRes, srcRes] = await Promise.all([
      fetch(`/api/inspirations?${params}`),
      fetch("/api/sources"),
    ]);

    const [inspData, srcData] = await Promise.all([
      inspRes.json(),
      srcRes.json(),
    ]);

    setInspirations(inspData);
    setSources(srcData);
    setLoading(false);
  }, [sourceFilter, minScore, query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sorted = [...inspirations].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
    return b.score - a.score;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inspirations</h2>
        <p className="text-muted-foreground">
          Browse and curate discovered articles
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search titles, descriptions, tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minScore} onValueChange={setMinScore}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Min Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Score</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
            <SelectItem value="7">7+</SelectItem>
            <SelectItem value="9">9+</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "score" | "date")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Sort by Score</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <InspirationTable
          inspirations={sorted}
          sources={sources}
          onDeleted={loadData}
        />
      )}
    </div>
  );
}
