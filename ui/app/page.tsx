import Link from "next/link";
import {
  Rss,
  Lightbulb,
  FileText,
  FileCheck,
  Mail,
} from "lucide-react";
import { getIndex, KEYS, getValue } from "@/lib/db";
import type { Content } from "@ghost/types";
import { getAllByIndex } from "@/lib/db";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}

function StatCard({ label, value, icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const sourceCount = getIndex(KEYS.sourceIndex).length;
  const inspirationCount = getIndex(KEYS.inspirationIndex).length;

  const allContent = getAllByIndex<Content>(KEYS.contentIndex, KEYS.content);
  const draftCount = allContent.filter((c) => c.status === "draft").length;
  const doneCount = allContent.filter((c) => c.status === "done").length;

  const gmailTokens = getValue<unknown>(KEYS.gmailTokens);
  const gmailConnected = gmailTokens !== null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your content pipeline
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sources"
          value={sourceCount}
          icon={<Rss className="h-5 w-5 text-muted-foreground" />}
          href="/sources"
        />
        <StatCard
          label="Inspirations"
          value={inspirationCount}
          icon={<Lightbulb className="h-5 w-5 text-muted-foreground" />}
          href="/inspirations"
        />
        <StatCard
          label="Drafts"
          value={draftCount}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          href="/content"
        />
        <StatCard
          label="Published"
          value={doneCount}
          icon={<FileCheck className="h-5 w-5 text-muted-foreground" />}
          href="/content"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Gmail</p>
            <p className="text-sm text-muted-foreground">
              {gmailConnected ? "Connected" : "Not connected"}
            </p>
          </div>
          {!gmailConnected && (
            <Link
              href="/settings"
              className="ml-auto text-sm text-blue-400 hover:underline"
            >
              Connect
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
