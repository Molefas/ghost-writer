import { NextRequest, NextResponse } from "next/server";
import { getAllByIndex, KEYS } from "@/lib/db";
import type { Content } from "@ghost/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  let content = getAllByIndex<Content>(KEYS.contentIndex, KEYS.content);

  if (type) {
    content = content.filter((c) => c.type === type);
  }
  if (status) {
    content = content.filter((c) => c.status === status);
  }

  // Sort by most recently updated
  content.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return NextResponse.json(content);
}
