import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getLevelSubjectCode } from "@/lib/timetableUtils";
import type { Subject } from "@/types";

interface ChangeRequestFormProps {
  /** All subjects in the timetable */
  allSubjects: Subject[];
  /** Student's currently enrolled subjects */
  studentSubjects: Subject[];
  /** Currently selected drop subject (level+subject code) */
  dropSubject: string;
  /** Callback when drop subject changes */
  onDropChange: (value: string) => void;
  /** Currently selected pickup subject (level+subject code) */
  pickupSubject: string;
  /** Callback when pickup subject changes */
  onPickupChange: (value: string) => void;
  /** Callback when form is submitted */
  onSubmit: () => void;
  /** Whether submission is disabled */
  disabled?: boolean;
}

interface SubjectOption {
  code: string; // level+subject code (e.g., "10ENG")
  isYearLong: boolean;
}

/**
 * Form for selecting which subject to drop and which to pick up.
 * Drop options come from student's current subjects.
 * Pickup options are filtered to match drop subject duration (year/semester).
 */
export function ChangeRequestForm({
  allSubjects,
  studentSubjects,
  dropSubject,
  onDropChange,
  pickupSubject,
  onPickupChange,
  onSubmit,
  disabled = false,
}: ChangeRequestFormProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupSearch, setPickupSearch] = useState("");

  // Build drop options with year-long info from student's subjects
  const dropOptions = useMemo(() => {
    const optionsMap = new Map<string, SubjectOption>();

    for (const subject of studentSubjects) {
      const code = getLevelSubjectCode(subject.code);
      if (!optionsMap.has(code)) {
        optionsMap.set(code, {
          code,
          isYearLong: subject.semester === "both",
        });
      }
    }

    return Array.from(optionsMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }, [studentSubjects]);

  // Get the dropped subject's semester type
  const droppedSubjectInfo = useMemo(() => {
    if (!dropSubject) return null;
    const option = dropOptions.find((o) => o.code === dropSubject);
    return option || null;
  }, [dropSubject, dropOptions]);

  // Build pickup options filtered by duration and excluding student's subjects
  const pickupOptions = useMemo(() => {
    const studentCodes = new Set(
      studentSubjects.map((s) => getLevelSubjectCode(s.code))
    );

    const optionsMap = new Map<string, SubjectOption>();

    for (const subject of allSubjects) {
      const code = getLevelSubjectCode(subject.code);
      // Exclude subjects student already has
      if (studentCodes.has(code)) continue;

      const isYearLong = subject.semester === "both";

      // If drop subject is selected, filter by matching duration
      if (droppedSubjectInfo !== null) {
        if (droppedSubjectInfo.isYearLong !== isYearLong) continue;
      }

      if (!optionsMap.has(code)) {
        optionsMap.set(code, { code, isYearLong });
      }
    }

    return Array.from(optionsMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }, [allSubjects, studentSubjects, droppedSubjectInfo]);

  // Clear pickup if it's no longer valid after drop changes
  const selectedPickupOption = pickupOptions.find(
    (o) => o.code === pickupSubject
  );
  const isPickupValid = !pickupSubject || selectedPickupOption;

  // Check if search matches an enrolled subject (for better empty state message)
  const studentSubjectCodes = useMemo(
    () => new Set(studentSubjects.map((s) => getLevelSubjectCode(s.code))),
    [studentSubjects]
  );
  const searchMatchesEnrolled = useMemo(() => {
    if (!pickupSearch) return null;
    const searchUpper = pickupSearch.toUpperCase();
    for (const code of studentSubjectCodes) {
      if (code.toUpperCase().includes(searchUpper)) {
        return code;
      }
    }
    return null;
  }, [pickupSearch, studentSubjectCodes]);

  const canSubmit =
    dropSubject &&
    pickupSubject &&
    isPickupValid &&
    dropSubject !== pickupSubject &&
    !disabled;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
        {/* Drop Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Drop Subject</label>
          <Popover open={dropOpen} onOpenChange={setDropOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={dropOpen}
                className="w-full justify-between font-normal"
              >
                {dropSubject ? (
                  <span>
                    {dropSubject}
                    <span className="ml-2 text-muted-foreground text-xs">
                      {droppedSubjectInfo?.isYearLong ? "Year" : "Semester"}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Select subject to drop...
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search subjects..." />
                <CommandList>
                  <CommandEmpty>No subject found.</CommandEmpty>
                  <CommandGroup>
                    {dropOptions.map((option) => (
                      <CommandItem
                        key={option.code}
                        value={option.code}
                        onSelect={(value) => {
                          onDropChange(value === dropSubject ? "" : value);
                          // Clear pickup if duration changed
                          if (value !== dropSubject) {
                            onPickupChange("");
                          }
                          setDropOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            dropSubject === option.code
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="font-mono">{option.code}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {option.isYearLong ? "Year" : "Semester"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center justify-center h-10">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Pickup Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pick Up Subject</label>
          <Popover open={pickupOpen} onOpenChange={setPickupOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={pickupOpen}
                className="w-full justify-between font-normal"
                disabled={!dropSubject}
              >
                {pickupSubject && isPickupValid ? (
                  <span>
                    {pickupSubject}
                    <span className="ml-2 text-muted-foreground text-xs">
                      {selectedPickupOption?.isYearLong ? "Year" : "Semester"}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {!dropSubject
                      ? "Select drop subject first..."
                      : "Select subject to pick up..."}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search subjects..."
                  value={pickupSearch}
                  onValueChange={setPickupSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchMatchesEnrolled ? (
                      <span className="text-amber-600">
                        Already enrolled in {searchMatchesEnrolled}
                      </span>
                    ) : (
                      "No matching subjects found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {pickupOptions.map((option) => (
                      <CommandItem
                        key={option.code}
                        value={option.code}
                        onSelect={(value) => {
                          onPickupChange(value === pickupSubject ? "" : value);
                          setPickupSearch("");
                          setPickupOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            pickupSubject === option.code
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="font-mono">{option.code}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {option.isYearLong ? "Year" : "Semester"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Info message about duration filtering */}
      {dropSubject && (
        <p className="text-xs text-muted-foreground">
          Showing {droppedSubjectInfo?.isYearLong ? "year-long" : "semester"}{" "}
          subjects only (matching drop subject duration)
        </p>
      )}

      {/* Validation message */}
      {dropSubject && pickupSubject && dropSubject === pickupSubject && (
        <p className="text-sm text-red-600">
          Drop and pickup subjects must be different.
        </p>
      )}

      {/* Submit button */}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full"
        size="lg"
      >
        Find Solutions
      </Button>
    </div>
  );
}
