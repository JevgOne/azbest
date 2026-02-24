"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_LABELS } from "@/types/ads";

interface SyncLogEntry {
  id: number;
  platform: string;
  sync_type: string;
  status: string;
  campaigns_synced: number;
  stats_synced: number;
  error_message: string | null;
  started_at: number;
  completed_at: number | null;
}

interface SyncHistoryProps {
  entries: SyncLogEntry[];
}

export function SyncHistory({ entries }: SyncHistoryProps) {
  if (!entries?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Historie synchronizace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant={entry.status === "completed" ? "default" : entry.status === "failed" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {entry.status === "completed" ? "OK" : entry.status === "failed" ? "Chyba" : "Běží"}
                </Badge>
                <span className="text-muted-foreground">
                  {PLATFORM_LABELS[entry.platform as keyof typeof PLATFORM_LABELS] || entry.platform}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{entry.campaigns_synced} kampaní</span>
                <span>{entry.stats_synced} statistik</span>
                <span>
                  {new Date(entry.started_at * 1000).toLocaleString("cs-CZ", {
                    day: "numeric",
                    month: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
