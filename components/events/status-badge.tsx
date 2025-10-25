import { EventStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: EventStatus;
  dateTime?: string | null;
  endTime?: string | null;
}

export function StatusBadge({ status, dateTime, endTime }: StatusBadgeProps) {
  const isCurrentlyHappening = () => {
    if (status !== 'official' || !dateTime) return false;

    const now = new Date();
    const startTime = new Date(dateTime);
    const endTimeDate = endTime ? new Date(endTime) : null;

    // If the event has started
    if (now >= startTime) {
      // If there's no end time or we haven't reached the end time
      if (!endTimeDate || now <= endTimeDate) {
        return true;
      }
    }

    return false;
  };

  if (status === 'tentative') {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
        🟡 Tentative
      </Badge>
    );
  }

  if (isCurrentlyHappening()) {
    return (
      <Badge
        variant="outline"
        className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 animate-pulse shadow-md shadow-green-500/50"
      >
        🟢 Happening Now
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20">
      🟢 Official
    </Badge>
  );
}
