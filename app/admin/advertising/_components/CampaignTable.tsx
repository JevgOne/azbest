"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Campaign {
  id: number;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  if (!campaigns.length) return null;

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kampaň</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Zobrazení</TableHead>
            <TableHead className="text-right">Kliknutí</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">Útrata</TableHead>
            <TableHead className="text-right">Konverze</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium max-w-[250px] truncate">{c.name}</TableCell>
              <TableCell>
                <Badge variant={c.status === "active" ? "default" : "secondary"}>
                  {c.status === "active" ? "Aktivní" : "Pozastavena"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{c.impressions.toLocaleString("cs-CZ")}</TableCell>
              <TableCell className="text-right">{c.clicks.toLocaleString("cs-CZ")}</TableCell>
              <TableCell className="text-right">{(c.ctr * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-right">{c.cpc.toFixed(2)} Kč</TableCell>
              <TableCell className="text-right">{c.spend.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč</TableCell>
              <TableCell className="text-right">{c.conversions.toLocaleString("cs-CZ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
