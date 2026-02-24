"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Users, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  youtube: "bg-red-600 text-white",
  facebook: "bg-blue-600 text-white",
  pinterest: "bg-red-500 text-white",
  linkedin: "bg-blue-700 text-white",
};

interface GenViralAccountRow {
  id: number;
  genviral_id: string;
  platform: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  connected: number;
}

export default function AccountsList() {
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["genviral-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/social/genviral/accounts");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as GenViralAccountRow[];
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      await refetch();
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.length || 0} připojených účtů
        </p>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          Synchronizovat
        </Button>
      </div>

      {!data?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Žádné připojené účty</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Připojte sociální sítě v GenViral dashboardu a poté synchronizujte účty zde.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge className={PLATFORM_COLORS[account.platform] || "bg-gray-500 text-white"}>
                    {PLATFORM_LABELS[account.platform] || account.platform}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {account.display_name || account.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{account.username}
                    </p>
                  </div>
                  {account.connected ? (
                    <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
