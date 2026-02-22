import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  enabled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  removed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  disabled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles.draft;
  return (
    <Badge variant="outline" className={cn(style, "border-0", className)}>
      {status}
    </Badge>
  );
}
