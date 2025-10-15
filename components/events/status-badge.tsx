import { EventStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: EventStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'tentative') {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
        🟡 Tentative
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20">
      🟢 Official
    </Badge>
  );
}
