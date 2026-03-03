import { NextRequest, NextResponse } from "next/server";
import {
  getAllByIndex,
  deleteValue,
  removeFromIndex,
  KEYS,
} from "@/lib/db";
import type { Inspiration } from "@ghost/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("sourceId");
  const minScore = searchParams.get("minScore");
  const query = searchParams.get("query");

  let inspirations = getAllByIndex<Inspiration>(
    KEYS.inspirationIndex,
    KEYS.inspiration
  );

  if (sourceId) {
    inspirations = inspirations.filter((i) => i.sourceId === sourceId);
  }
  if (minScore) {
    const min = parseInt(minScore, 10);
    inspirations = inspirations.filter((i) => i.score >= min);
  }
  if (query) {
    const q = query.toLowerCase();
    inspirations = inspirations.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sort by score descending
  inspirations.sort((a, b) => b.score - a.score);

  return NextResponse.json(inspirations);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  deleteValue(KEYS.inspiration(id));
  removeFromIndex(KEYS.inspirationIndex, id);

  return NextResponse.json({ ok: true });
}
