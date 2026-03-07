import { NextResponse } from "next/server";
import { getValue, deleteValue, KEYS } from "@/lib/db";

interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const tokens = getValue<GmailTokens>(KEYS.gmailTokens);

  if (!tokens) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    expiresAt: new Date(tokens.expiry_date).toISOString(),
  });
}

export async function DELETE() {
  deleteValue(KEYS.gmailTokens);
  return NextResponse.json({ ok: true });
}
