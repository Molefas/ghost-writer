import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  getAllByIndex,
  getValue,
  setValue,
  deleteValue,
  addToIndex,
  removeFromIndex,
  getIndex,
  KEYS,
} from "@/lib/db";
import type { Source, Inspiration } from "@ghost/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const sources = getAllByIndex<Source>(KEYS.sourceIndex, KEYS.source);
  return NextResponse.json(sources);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, url, email } = body as {
    name: string;
    type: Source["type"];
    url?: string;
    email?: string;
  };

  if (!name || !type) {
    return NextResponse.json(
      { error: "name and type are required" },
      { status: 400 }
    );
  }

  const id = `src_${nanoid(10)}`;
  const source: Source = {
    id,
    name,
    type,
    url: url || undefined,
    email: email || undefined,
    addedAt: new Date().toISOString(),
    lastScanned: null,
  };

  setValue(KEYS.source(id), source);
  addToIndex(KEYS.sourceIndex, id);

  return NextResponse.json(source, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Remove the source
  deleteValue(KEYS.source(id));
  removeFromIndex(KEYS.sourceIndex, id);

  // Cascade: remove associated inspirations
  const inspirationIds = getIndex(KEYS.inspirationIndex);
  for (const inspId of inspirationIds) {
    const insp = getValue<Inspiration>(KEYS.inspiration(inspId));
    if (insp && insp.sourceId === id) {
      deleteValue(KEYS.inspiration(inspId));
      removeFromIndex(KEYS.inspirationIndex, inspId);
    }
  }

  return NextResponse.json({ ok: true });
}
