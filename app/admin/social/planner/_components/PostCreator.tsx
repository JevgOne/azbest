"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Send, Calendar, Save, X } from "lucide-react";
import { useState } from "react";
import SlideshowBuilder from "./SlideshowBuilder";

interface GenViralAccountRow {
  id: number;
  genviral_id: string;
  platform: string;
  username: string;
  display_name: string | null;
}

interface PostCreatorProps {
  onClose: () => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};

export default function PostCreator({ onClose }: PostCreatorProps) {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [tiktokMode, setTiktokMode] = useState<string>("DIRECT_POST");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ["genviral-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/social/genviral/accounts");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as GenViralAccountRow[];
    },
  });

  const hasTikTok = selectedAccounts.some((id) =>
    accounts?.find((a) => a.genviral_id === id && a.platform === "tiktok")
  );

  const toggleAccount = (genviralId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(genviralId)
        ? prev.filter((id) => id !== genviralId)
        : [...prev, genviralId]
    );
  };

  const handleSubmit = async (asDraft: boolean) => {
    setError(null);
    setSubmitting(true);

    try {
      const body: any = {
        caption,
        accountIds: selectedAccounts,
        mediaUrls: images,
      };

      if (!asDraft && scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }

      if (hasTikTok) {
        body.tiktokPublishMode = tiktokMode;
      }

      const res = await fetch("/api/social/genviral/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      queryClient.invalidateQueries({ queryKey: ["social-calendar"] });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nový příspěvek</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account selection */}
          <div className="space-y-2">
            <Label>Účty</Label>
            {!accounts?.length ? (
              <p className="text-sm text-muted-foreground">
                Žádné připojené účty. Synchronizujte je v záložce Účty.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <label
                    key={account.genviral_id}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccounts.includes(account.genviral_id)
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account.genviral_id)}
                      onCheckedChange={() => toggleAccount(account.genviral_id)}
                    />
                    <Badge variant="outline" className="text-xs">
                      {PLATFORM_LABELS[account.platform] || account.platform}
                    </Badge>
                    <span className="text-sm">@{account.username}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Caption</Label>
              <span className={`text-xs ${caption.length > 500 ? "text-red-500" : "text-muted-foreground"}`}>
                {caption.length}/500
              </span>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Napište caption pro váš příspěvek..."
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Slideshow / Images */}
          <SlideshowBuilder images={images} onImagesChange={setImages} />

          {/* TikTok mode */}
          {hasTikTok && (
            <div className="space-y-2">
              <Label>TikTok režim publikace</Label>
              <Select value={tiktokMode} onValueChange={setTiktokMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT_POST">Přímé publikování</SelectItem>
                  <SelectItem value="MEDIA_UPLOAD">Nahrát jako koncept (pro přidání zvuku)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Schedule */}
          <div className="space-y-2">
            <Label>Naplánovat (volitelné)</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Zrušit
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={submitting || !caption || !selectedAccounts.length}
            >
              <Save className="h-4 w-4 mr-2" />
              Uložit koncept
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !caption || !selectedAccounts.length || caption.length > 500}
            >
              {scheduledAt ? (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Naplánovat
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publikovat
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
