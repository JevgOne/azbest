"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Images, X, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface SlideshowBuilderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export default function SlideshowBuilder({ images, onImagesChange }: SlideshowBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        // Validate file
        if (!["image/jpeg", "image/png"].includes(file.type)) continue;
        if (file.size > 5 * 1024 * 1024) continue; // 5MB limit
        if (images.length + newImages.length >= 35) break;

        // Upload via existing upload endpoint
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) newImages.push(data.url);
      }
      onImagesChange([...images, ...newImages]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Images className="h-4 w-4" />
          Slideshow ({images.length}/35 obrázků)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-[9/16] bg-muted rounded-md overflow-hidden group">
                <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= 35}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Nahrávání..." : "Přidat obrázky"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            JPG/PNG, max 5MB, poměr 9:16
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
