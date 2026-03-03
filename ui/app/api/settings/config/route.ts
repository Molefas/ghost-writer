import { NextResponse } from "next/server";
import { getConfigStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getConfigStatus());
}
