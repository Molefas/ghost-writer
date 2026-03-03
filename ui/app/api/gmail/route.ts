import { NextResponse } from "next/server";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";
import { getValue, setValue, deleteValue, KEYS } from "@/lib/db";
import { getSecret } from "@/lib/config";

const OAUTH_PORT = 9874;
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}`;
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

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

export async function POST() {
  const clientId = getSecret("GOOGLE_CLIENT_ID");
  const clientSecret = getSecret("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in ~/.trikhub/secrets.json",
      },
      { status: 400 }
    );
  }

  // Start the local OAuth callback server
  const result = await new Promise<{ authUrl: string }>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", REDIRECT_URI);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<html><body style='font-family:system-ui;text-align:center;padding:60px'><h2>Authorization denied</h2><p>You can close this tab.</p></body></html>"
          );
          cleanup();
          return;
        }

        if (!code) {
          res.writeHead(404);
          res.end();
          return;
        }

        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          REDIRECT_URI
        );
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<html><body style='font-family:system-ui;text-align:center;padding:60px'><h2>Authentication failed</h2><p>Missing tokens. You can close this tab.</p></body></html>"
          );
          cleanup();
          return;
        }

        const stored: GmailTokens = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
          token_type: tokens.token_type ?? "Bearer",
        };
        setValue(KEYS.gmailTokens, stored);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body style='font-family:system-ui;text-align:center;padding:60px'><h2>Gmail connected!</h2><p>You can close this tab and return to Ghost Writer.</p></body></html>"
        );
        cleanup();
      } catch {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body style='font-family:system-ui;text-align:center;padding:60px'><h2>Something went wrong</h2><p>You can close this tab and try again.</p></body></html>"
        );
        cleanup();
      }
    });

    function cleanup() {
      if (timer) clearTimeout(timer);
      server.close();
    }

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${OAUTH_PORT} is already in use. Close whatever is using it and try again.`
          )
        );
      } else {
        reject(new Error(`Failed to start auth server: ${err.message}`));
      }
    });

    server.listen(OAUTH_PORT, "127.0.0.1", () => {
      timer = setTimeout(() => cleanup(), 120_000);

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        REDIRECT_URI
      );
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
      });

      resolve({ authUrl });
    });
  });

  return NextResponse.json(result);
}

export async function DELETE() {
  deleteValue(KEYS.gmailTokens);
  return NextResponse.json({ ok: true });
}
