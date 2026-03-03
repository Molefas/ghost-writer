import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { setValue, addToIndex, KEYS } from "@/lib/db";
import type { Content } from "@ghost/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, type, inspirationIds } = body as {
    title: string;
    type: Content["type"];
    inspirationIds: string[];
  };

  if (!title || !type) {
    return NextResponse.json(
      { error: "title and type are required" },
      { status: 400 }
    );
  }

  const id = `cnt_${nanoid(12)}`;
  const now = new Date().toISOString();
  const content: Content = {
    id,
    type,
    title,
    body: "",
    inspirationIds: inspirationIds || [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  setValue(KEYS.content(id), content);
  addToIndex(KEYS.contentIndex, id);

  return NextResponse.json({ id, redirect: `/content/${id}` }, { status: 201 });
}
