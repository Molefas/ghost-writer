import { NextRequest, NextResponse } from "next/server";
import { getValue, setValue, deleteValue, removeFromIndex, KEYS } from "@/lib/db";
import type { Content } from "@ghost/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const content = getValue<Content>(KEYS.content(id));

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(content);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getValue<Content>(KEYS.content(id));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, body: contentBody, status } = body as {
    title?: string;
    body?: string;
    status?: Content["status"];
  };

  const updated: Content = {
    ...existing,
    title: title ?? existing.title,
    body: contentBody ?? existing.body,
    status: status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  setValue(KEYS.content(id), updated);

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteValue(KEYS.content(id));
  removeFromIndex(KEYS.contentIndex, id);

  return NextResponse.json({ ok: true });
}
