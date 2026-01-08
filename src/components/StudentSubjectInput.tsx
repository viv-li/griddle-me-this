import { useState, useMemo } from "react";
import {
  Check,
  ChevronsUpDown,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { validateStudentSchedule } from "@/lib/validation";
import type { Subject, AllocationBlock } from "@/types";

interface StudentSubjectInputProps {
  /** All available subjects from the timetable */
  subjects: Subject[];
  /** Currently selected subject codes */
  selectedCodes: string[];
  /** Callback when selection changes */
  onChange: (codes: string[]) => void;
}

const ALLOCATIONS: AllocationBlock[] = [
  "AL1",
  "AL2",
  "AL3",
  "AL4",
  "AL5",
  "AL6",
];

/**
 * Multi-select autocomplete for entering student's current subjects.
 * Shows real-time validation feedback about schedule coverage.
 */
export function StudentSubjectInput({
  subjects,
  selectedCodes,
  onChange,
}: StudentSubjectInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get the selected Subject objects
  const selectedSubjects = useMemo(() => {
    return subjects.filter((s) => selectedCodes.includes(s.code));
  }, [subjects, selectedCodes]);

  // Validate the current schedule
  const validation = useMemo(() => {
    return validateStudentSchedule(selectedSubjects);
  }, [selectedSubjects]);

  // Build a map of allocation coverage for the grid visualization
  const coverageMap = useMemo(() => {
    const map: Record<string, { sem1: Subject | null; sem2: Subject | null }> =
      {};
    for (const al of ALLOCATIONS) {
      map[al] = { sem1: null, sem2: null };
    }
    for (const subject of selectedSubjects) {
      if (subject.semester === "both") {
        map[subject.allocation].sem1 = subject;
        map[subject.allocation].sem2 = subject;
      } else {
        map[subject.allocation][subject.semester] = subject;
      }
    }
    return map;
  }, [selectedSubjects]);

  // Group subjects by level+subject for easier browsing
  const groupedSubjects = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    for (const subject of subjects) {
      const key = `${subject.level}${subject.subject}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(subject);
    }
    // Sort each group by code
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.code.localeCompare(b.code));
    }
    return groups;
  }, [subjects]);

  const handleSelect = (code: string) => {
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      onChange([...selectedCodes, code]);
    }
    // Clear search after selection
    setSearch("");
  };

  const handleRemove = (code: string) => {
    onChange(selectedCodes.filter((c) => c !== code));
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Multi-select combobox */}
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto min-h-10"
            >
              <span className="text-muted-foreground">
                {selectedCodes.length === 0
                  ? "Search and select subjects..."
                  : `${selectedCodes.length} subject${
                      selectedCodes.length === 1 ? "" : "s"
                    } selected`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search subjects by code..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No subject found.</CommandEmpty>
                {Object.entries(groupedSubjects)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([groupKey, groupSubjects]) => (
                    <CommandGroup key={groupKey} heading={groupKey}>
                      {groupSubjects.map((subject) => {
                        const isSelected = selectedCodes.includes(subject.code);
                        return (
                          <CommandItem
                            key={subject.code}
                            value={subject.code}
                            onSelect={() => handleSelect(subject.code)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-mono">{subject.code}</span>
                            <span className="ml-2 text-muted-foreground text-xs">
                              {subject.allocation} ·{" "}
                              {subject.semester === "both"
                                ? "Year"
                                : subject.semester}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected subjects as badges */}
        {selectedCodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedSubjects
              .sort((a, b) => a.allocation.localeCompare(b.allocation))
              .map((subject) => (
                <Badge
                  key={subject.code}
                  variant="secondary"
                  className="font-mono text-xs pr-1"
                >
                  {subject.code}
                  <button
                    type="button"
                    onClick={() => handleRemove(subject.code)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {subject.code}</span>
                  </button>
                </Badge>
              ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Schedule coverage grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Schedule Coverage</span>
          {validation.valid ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {validation.missingSlots.length} slot
              {validation.missingSlots.length !== 1 ? "s" : ""} unfilled
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border bg-muted/50 p-1.5 text-left font-medium w-12"></th>
                {ALLOCATIONS.map((al) => (
                  <th
                    key={al}
                    className="border bg-muted/50 p-1.5 text-center font-medium"
                  >
                    {al}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["sem1", "sem2"] as const).map((sem) => (
                <tr key={sem}>
                  <td className="border bg-muted/30 p-1.5 font-medium text-muted-foreground">
                    {sem === "sem1" ? "S1" : "S2"}
                  </td>
                  {ALLOCATIONS.map((al) => {
                    const subject = coverageMap[al][sem];
                    const isFilled = subject !== null;
                    const isYearLong = subject?.semester === "both";
                    return (
                      <td
                        key={`${al}-${sem}`}
                        className={cn(
                          "border p-1.5 text-center font-mono",
                          isFilled
                            ? isYearLong
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-400"
                        )}
                      >
                        {subject?.code || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
            <span>Year-long</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
            <span>Semester</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-50 border border-red-200"></div>
            <span>Empty</span>
          </div>
        </div>

        {/* Conflict warnings */}
        {validation.conflicts.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Schedule Conflicts
            </div>
            <ul className="mt-1 list-disc list-inside text-xs">
              {validation.conflicts.map((conflict) => (
                <li key={`${conflict.allocation}-${conflict.semester}`}>
                  {conflict.allocation} {conflict.semester}:{" "}
                  {conflict.subjects.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
