import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronsUpDown, Info, Plus } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getLevelSubjectCode } from "@/lib/timetableUtils";
import type { Subject, RequestType } from "@/types";

interface ChangeRequestFormProps {
  /** All subjects in the timetable */
  allSubjects: Subject[];
  /** Student's currently enrolled subjects */
  studentSubjects: Subject[];
  /** Currently selected drop subject (level+subject code) */
  dropSubject: string;
  /** Callback when drop subject changes */
  onDropChange: (value: string) => void;
  /** Currently selected pickup subjects (level+subject codes) - array of 1 or 2 */
  pickupSubjects: string[];
  /** Callback when pickup subjects change */
  onPickupSubjectsChange: (value: string[]) => void;
  /** Current request type mode */
  requestType: RequestType;
  /** Callback when request type changes */
  onRequestTypeChange: (type: RequestType) => void;
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
 * Supports three modes:
 * - subject-change: Drop one subject and pick up a different subject
 * - class-change: Find alternative class for the same subject
 * - year-to-semesters: Drop one year-long subject and pick up two semester subjects
 */
export function ChangeRequestForm({
  allSubjects,
  studentSubjects,
  dropSubject,
  onDropChange,
  pickupSubjects,
  onPickupSubjectsChange,
  requestType,
  onRequestTypeChange,
  onSubmit,
  disabled = false,
}: ChangeRequestFormProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const [pickup1Open, setPickup1Open] = useState(false);
  const [pickup2Open, setPickup2Open] = useState(false);
  const [pickup1Search, setPickup1Search] = useState("");
  const [pickup2Search, setPickup2Search] = useState("");

  const isClassChangeMode = requestType === "class-change";

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

  // Determine if we're in two-pickup mode (year-long drop + first pickup is semester)
  const firstPickupInfo = useMemo(() => {
    if (pickupSubjects.length === 0) return null;
    // Find from allSubjects whether first pickup is semester or year-long
    const firstPickupSubject = allSubjects.find(
      (s) => getLevelSubjectCode(s.code) === pickupSubjects[0]
    );
    if (!firstPickupSubject) return null;
    return {
      code: pickupSubjects[0],
      isYearLong: firstPickupSubject.semester === "both",
    };
  }, [pickupSubjects, allSubjects]);

  const needsTwoPickups =
    droppedSubjectInfo?.isYearLong &&
    firstPickupInfo &&
    !firstPickupInfo.isYearLong;

  // Build pickup options based on drop subject type
  // - If dropping semester: only show semester subjects
  // - If dropping year-long: show all subjects (year-long or semester)
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

      // If dropping semester-long, only show semester subjects
      if (droppedSubjectInfo !== null && !droppedSubjectInfo.isYearLong) {
        if (isYearLong) continue;
      }
      // If dropping year-long, show all subjects (no filter)

      if (!optionsMap.has(code)) {
        optionsMap.set(code, { code, isYearLong });
      }
    }

    return Array.from(optionsMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }, [allSubjects, studentSubjects, droppedSubjectInfo]);

  // For second pickup, filter to semester-only and exclude first pickup
  const pickup2Options = useMemo(() => {
    return pickupOptions.filter(
      (o) => !o.isYearLong && o.code !== pickupSubjects[0]
    );
  }, [pickupOptions, pickupSubjects]);

  // Check if search matches an enrolled subject (for better empty state message)
  const studentSubjectCodes = useMemo(
    () => new Set(studentSubjects.map((s) => getLevelSubjectCode(s.code))),
    [studentSubjects]
  );

  const getSearchMatchesEnrolled = (search: string) => {
    if (!search) return null;
    const searchUpper = search.toUpperCase();
    for (const code of studentSubjectCodes) {
      if (code.toUpperCase().includes(searchUpper)) {
        return code;
      }
    }
    return null;
  };

  // Validation logic based on mode
  const canSubmit = useMemo(() => {
    if (disabled) return false;
    if (!dropSubject) return false;

    if (isClassChangeMode) {
      return true;
    }

    // Subject change mode
    if (pickupSubjects.length === 0) return false;

    // Year-long drop with semester first pickup needs two distinct pickups
    if (needsTwoPickups) {
      return (
        pickupSubjects.length === 2 &&
        pickupSubjects[0] !== pickupSubjects[1] &&
        pickupSubjects[0] !== dropSubject &&
        pickupSubjects[1] !== dropSubject
      );
    }

    // Regular case: one pickup, different from drop
    return pickupSubjects.length === 1 && pickupSubjects[0] !== dropSubject;
  }, [disabled, dropSubject, pickupSubjects, isClassChangeMode, needsTwoPickups]);

  // Handle mode switch
  const handleModeChange = (newMode: RequestType) => {
    onRequestTypeChange(newMode);
    // Clear selections when switching modes
    onDropChange("");
    onPickupSubjectsChange([]);
  };

  // Handle pickup changes
  const handlePickup1Change = (value: string) => {
    if (value === pickupSubjects[0]) {
      // Deselect
      onPickupSubjectsChange([]);
    } else {
      // Select new value, clear second if switching to year-long
      const newOption = pickupOptions.find((o) => o.code === value);
      if (newOption?.isYearLong || !droppedSubjectInfo?.isYearLong) {
        onPickupSubjectsChange([value]);
      } else {
        // Keep second pickup if it exists and is valid
        const second = pickupSubjects[1];
        if (second && second !== value) {
          onPickupSubjectsChange([value, second]);
        } else {
          onPickupSubjectsChange([value]);
        }
      }
    }
  };

  const handlePickup2Change = (value: string) => {
    if (value === pickupSubjects[1]) {
      // Deselect second
      onPickupSubjectsChange([pickupSubjects[0]]);
    } else {
      onPickupSubjectsChange([pickupSubjects[0], value]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => handleModeChange("subject-change")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            !isClassChangeMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Change Subject
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("class-change")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isClassChangeMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Change Class
        </button>
      </div>

      {isClassChangeMode ? (
        // Class Change Mode - Single dropdown
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Subject to Find Alternative Class For
            </label>
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
                      Select subject...
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
        </div>
      ) : (
        // Subject Change Mode - Drop and Pickup dropdowns
        <>
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
                              // Clear pickups when drop changes
                              if (value !== dropSubject) {
                                onPickupSubjectsChange([]);
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

            {/* Pickup Subject(s) - show two side-by-side when needed */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Pick Up Subject{needsTwoPickups ? "s" : ""}
                {dropSubject && droppedSubjectInfo?.isYearLong && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Pick one year-long subject, or two semester subjects
                          to replace the dropped year-long subject.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {dropSubject && !droppedSubjectInfo?.isYearLong && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Showing semester-long subjects only (matching drop
                          subject duration)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>

              {needsTwoPickups ? (
                // Two side-by-side selects for semester pickups
                <div className="flex gap-2">
                  {/* First pickup */}
                  <Popover open={pickup1Open} onOpenChange={setPickup1Open}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={pickup1Open}
                        className="flex-1 justify-between font-normal px-2"
                        disabled={!dropSubject}
                      >
                        {pickupSubjects[0] ? (
                          <span className="font-mono text-sm truncate">
                            {pickupSubjects[0]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Subject 1...
                          </span>
                        )}
                        <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search..."
                          value={pickup1Search}
                          onValueChange={setPickup1Search}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {getSearchMatchesEnrolled(pickup1Search) ? (
                              <span className="text-amber-600">
                                Already enrolled in{" "}
                                {getSearchMatchesEnrolled(pickup1Search)}
                              </span>
                            ) : (
                              "No matching subjects."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {pickupOptions.map((option) => (
                              <CommandItem
                                key={option.code}
                                value={option.code}
                                onSelect={(value) => {
                                  handlePickup1Change(value);
                                  setPickup1Search("");
                                  setPickup1Open(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    pickupSubjects[0] === option.code
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="font-mono">{option.code}</span>
                                <span className="ml-2 text-muted-foreground text-xs">
                                  {option.isYearLong ? "Yr" : "Sem"}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Plus className="h-4 w-4 self-center text-muted-foreground flex-shrink-0" />

                  {/* Second pickup */}
                  <Popover open={pickup2Open} onOpenChange={setPickup2Open}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={pickup2Open}
                        className="flex-1 justify-between font-normal px-2"
                        disabled={!pickupSubjects[0]}
                      >
                        {pickupSubjects[1] ? (
                          <span className="font-mono text-sm truncate">
                            {pickupSubjects[1]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Subject 2...
                          </span>
                        )}
                        <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                      <Command>
                        <CommandInput
                          placeholder="Search..."
                          value={pickup2Search}
                          onValueChange={setPickup2Search}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {getSearchMatchesEnrolled(pickup2Search) ? (
                              <span className="text-amber-600">
                                Already enrolled in{" "}
                                {getSearchMatchesEnrolled(pickup2Search)}
                              </span>
                            ) : (
                              "No matching subjects."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {pickup2Options.map((option) => (
                              <CommandItem
                                key={option.code}
                                value={option.code}
                                onSelect={(value) => {
                                  handlePickup2Change(value);
                                  setPickup2Search("");
                                  setPickup2Open(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    pickupSubjects[1] === option.code
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="font-mono">{option.code}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                // Single pickup select (normal case)
                <Popover open={pickup1Open} onOpenChange={setPickup1Open}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={pickup1Open}
                      className="w-full justify-between font-normal"
                      disabled={!dropSubject}
                    >
                      {pickupSubjects[0] ? (
                        <span>
                          {pickupSubjects[0]}
                          <span className="ml-2 text-muted-foreground text-xs">
                            {firstPickupInfo?.isYearLong ? "Year" : "Semester"}
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
                        value={pickup1Search}
                        onValueChange={setPickup1Search}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {getSearchMatchesEnrolled(pickup1Search) ? (
                            <span className="text-amber-600">
                              Already enrolled in{" "}
                              {getSearchMatchesEnrolled(pickup1Search)}
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
                                handlePickup1Change(value);
                                setPickup1Search("");
                                setPickup1Open(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  pickupSubjects[0] === option.code
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
              )}
            </div>
          </div>

          {/* Validation messages */}
          {dropSubject &&
            pickupSubjects.length === 1 &&
            pickupSubjects[0] === dropSubject && (
              <p className="text-sm text-red-600">
                Drop and pickup subjects must be different.
              </p>
            )}
          {needsTwoPickups && pickupSubjects.length === 1 && (
            <p className="text-sm text-muted-foreground">
              Select a second semester subject to replace the year-long subject.
            </p>
          )}
        </>
      )}

      {/* Submit button */}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full"
        size="lg"
      >
        {isClassChangeMode ? "Find Alternative Classes" : "Find Solutions"}
      </Button>
    </div>
  );
}
