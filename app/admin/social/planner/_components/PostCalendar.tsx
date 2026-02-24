"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { cs } from "date-fns/locale";

interface CalendarPost {
  id: number;
  platform: string;
  content: string;
  status: string;
  scheduled_at: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black",
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-500",
  pinterest: "bg-red-400",
  linkedin: "bg-blue-700",
};

export default function PostCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStr = format(currentMonth, "yyyy-MM");
  const { data: posts, isLoading } = useQuery({
    queryKey: ["social-calendar", monthStr],
    queryFn: async () => {
      const res = await fetch(`/api/social/calendar?month=${monthStr}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as CalendarPost[];
    },
  });

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Pad beginning with empty days
  const startDayOfWeek = start.getDay();
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const getPostsForDay = (day: Date) => {
    if (!posts) return [];
    return posts.filter((post) => {
      const postDate = new Date(post.scheduled_at * 1000);
      return isSameDay(postDate, day);
    });
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full mt-4" />;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, "LLLL yyyy", { locale: cs })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Dnes
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((day) => (
            <div key={day} className="bg-background p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-background p-2 min-h-[80px]" />
          ))}

          {days.map((day) => {
            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`bg-background p-2 min-h-[80px] ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
              >
                <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-1"
                      title={post.content}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${PLATFORM_COLORS[post.platform] || "bg-gray-400"}`} />
                      <span className="text-xs truncate">{post.content.slice(0, 20)}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{dayPosts.length - 3} dalších</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
