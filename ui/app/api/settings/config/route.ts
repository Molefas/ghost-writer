import { NextResponse } from "next/server";
import { getValue } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getValue<Record<string, boolean>>("config:status");
  return NextResponse.json(status ?? {});
}
