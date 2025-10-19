import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";

export type TimeWindow = 'all' | 'today' | 'this_week' | 'this_month' | 'upcoming';

// Helper function to format hour for display
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

// Generate hour options (0-23)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: formatHour(i),
}));

interface TimeRange {
  startHour: number;
  endHour: number;
}

interface AdvancedFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
  selectedTimeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange | undefined) => void;
  selectedDate?: string;
  onDateChange?: (date: string | undefined) => void;
}

export function AdvancedFilter({
  selectedTags,
  onTagsChange,
  availableTags,
  selectedTimeRange,
  onTimeRangeChange,
  selectedDate,
  onDateChange,
}: AdvancedFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempStartHour, setTempStartHour] = useState<string>(
    selectedTimeRange?.startHour?.toString() || '9'
  );
  const [tempEndHour, setTempEndHour] = useState<string>(
    selectedTimeRange?.endHour?.toString() || '17'
  );

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllFilters = () => {
    onTagsChange([]);
    onTimeRangeChange?.(undefined);
    onDateChange?.(undefined);
  };

  const applyTimeRange = () => {
    const startHour = parseInt(tempStartHour);
    const endHour = parseInt(tempEndHour);

    if (startHour < endHour) {
      onTimeRangeChange?.({ startHour, endHour });
    }
  };

  const activeFiltersCount = selectedTags.length + (selectedTimeRange ? 1 : 0) + (selectedDate ? 1 : 0);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="">
            Date
          </DropdownMenuLabel>
        {/* Date Filter Section */}
        <div className="p-2 space-y-2">

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Select Date</Label>
            <Input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => onDateChange?.(e.target.value || undefined)}
              className=""
            />
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="">
            Time Window
          </DropdownMenuLabel>
        {/* Time Window Filter Section */}
        <div className="p-2 space-y-3">
          

          {selectedTimeRange ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Current: {formatHour(selectedTimeRange.startHour)} - {formatHour(selectedTimeRange.endHour)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTimeRangeChange?.(undefined)}
                className="w-full text-xs"
              >
                Clear Time Window
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Start Hour</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-8 text-xs">
                        {formatHour(parseInt(tempStartHour))}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup value={tempStartHour} onValueChange={setTempStartHour}>
                        {HOUR_OPTIONS.map((option) => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End Hour</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-8 text-xs">
                        {formatHour(parseInt(tempEndHour))}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup value={tempEndHour} onValueChange={setTempEndHour}>
                        {HOUR_OPTIONS.map((option) => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={applyTimeRange}
                className="w-full text-xs"
                disabled={parseInt(tempStartHour) >= parseInt(tempEndHour)}
              >
                Apply Time Window
              </Button>
            </div>
          )}
        </div>

        {availableTags.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tags</DropdownMenuLabel>
            {availableTags.map(tag => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        {activeFiltersCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="w-full justify-center"
            >
              Clear All Filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
