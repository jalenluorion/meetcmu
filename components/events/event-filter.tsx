"use client";

import { Button } from "@/components/ui/button";

export type FilterType = 'all' | 'tentative' | 'official';

interface EventFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function EventFilter({ activeFilter, onFilterChange }: EventFilterProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Events' },
    { value: 'tentative', label: 'Tentative' },
    { value: 'official', label: 'Official' },
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
