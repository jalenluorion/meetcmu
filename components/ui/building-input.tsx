"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./input";

const CMU_BUILDINGS = [
  "The Cut",
  "Alumni House",
  "Ansys Hall",
  "Baker Hall",
  "Boss House",
  "Bramer House",
  "Cohon University Center",
  "College of Fine Arts",
  "Cyert Hall",
  "Doherty Hall",
  "Donner House",
  "Fairfax Apartments",
  "Fifth & Clyde Residence Hall",
  "Forbes Beeler Apartments",
  "Gates & Hillman Center for Computer Science",
  "Gesling Stadium",
  "Hall of the Arts",
  "Hamburg Hall",
  "Hamerschlag Hall",
  "Hamerschlag House",
  "Henderson House",
  "Highmark Center",
  "Hunt Library",
  "Integrated Innovation Institute",
  "Margaret Morrison Carnegie Hall",
  "McGill House",
  "Mehrabian Collaborative Innovation Center",
  "Mellon Hall of Sciences",
  "Mellon Institute",
  "Mill 19",
  "Morewood Gardens",
  "Mudge House",
  "Newell-Simon Hall",
  "Porter Hall",
  "Posner Center",
  "Posner Hall",
  "Purnell Center for the Arts",
  "Rand Building",
  "Resnik House",
  "Roberts Engineering Hall",
  "Scaife Hall",
  "Scobell House",
  "Scott Hall",
  "Skibo Gymnasium",
  "Smith Hall",
  "Software Engineering Institute",
  "Stever House",
  "TCS Hall",
  "Tepper Quad",
  "Warner Hall",
  "Wean Hall",
  "West Wing",
  "Whitfield Hall",
];

interface BuildingInputProps {
  selectedBuilding: string;
  locationDetails: string;
  onBuildingChange: (building: string) => void;
  onLocationChange: (location: string) => void;
}

export function BuildingInput({
  selectedBuilding,
  locationDetails,
  onBuildingChange,
  onLocationChange,
}: BuildingInputProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredBuildings, setFilteredBuildings] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buildingInputRef = useRef<HTMLInputElement>(null);

  // Filter buildings based on search
  useEffect(() => {
    if (searchValue && !selectedBuilding) {
      const filtered = CMU_BUILDINGS.filter((building) =>
        building.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings(CMU_BUILDINGS);
    }
  }, [searchValue, selectedBuilding]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buildingInputRef.current &&
        !buildingInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBuildingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onBuildingChange(value);
    if (!selectedBuilding) {
      setShowDropdown(true);
    }
  };

  const handleBuildingSelect = (building: string) => {
    onBuildingChange(building);
    setSearchValue(building);
    setShowDropdown(false);
  };

  const handleBuildingFocus = () => {
    if (!selectedBuilding) {
      setShowDropdown(true);
    }
  };

  const handleClearBuilding = () => {
    onBuildingChange("");
    setSearchValue("");
    setShowDropdown(true);
    buildingInputRef.current?.focus();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <div className="relative">
          <Input
            ref={buildingInputRef}
            type="text"
            value={selectedBuilding || searchValue}
            onChange={handleBuildingInputChange}
            onFocus={handleBuildingFocus}
            placeholder="Search for a building..."
            className={selectedBuilding ? "pr-8" : ""}
          />
          {selectedBuilding && (
            <button
              type="button"
              onClick={handleClearBuilding}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        {showDropdown && filteredBuildings.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredBuildings.map((building) => (
              <button
                key={building}
                type="button"
                onClick={() => handleBuildingSelect(building)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                {building}
              </button>
            ))}
          </div>
        )}
      </div>
      <Input
        type="text"
        value={locationDetails}
        onChange={(e) => onLocationChange(e.target.value)}
        placeholder="Room number or details..."
      />
    </div>
  );
}
