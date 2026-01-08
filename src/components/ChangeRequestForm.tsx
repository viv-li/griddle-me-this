import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/**
 * Form for selecting which subject to drop and which to pick up.
 * Drop options come from student's current subjects.
 * Pickup options exclude subjects student already has.
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
  // Get unique level+subject codes from student's current subjects
  const dropOptions = useMemo(() => {
    const codes = new Set<string>();

    for (const subject of studentSubjects) {
      codes.add(getLevelSubjectCode(subject.code));
    }

    return Array.from(codes).sort((a, b) => a.localeCompare(b));
  }, [studentSubjects]);

  // Get all unique level+subject codes from timetable, excluding student's current subjects
  const pickupOptions = useMemo(() => {
    const studentCodes = new Set(
      studentSubjects.map((s) => getLevelSubjectCode(s.code))
    );

    const codes = new Set<string>();

    for (const subject of allSubjects) {
      const levelSubjectCode = getLevelSubjectCode(subject.code);
      // Exclude subjects student already has
      if (!studentCodes.has(levelSubjectCode)) {
        codes.add(levelSubjectCode);
      }
    }

    return Array.from(codes).sort((a, b) => a.localeCompare(b));
  }, [allSubjects, studentSubjects]);

  const canSubmit = dropSubject && pickupSubject && !disabled;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
        {/* Drop Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Drop Subject</label>
          <Select value={dropSubject} onValueChange={onDropChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject to drop..." />
            </SelectTrigger>
            <SelectContent>
              {dropOptions.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center justify-center h-10">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Pickup Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pick Up Subject</label>
          <Select value={pickupSubject} onValueChange={onPickupChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject to pick up..." />
            </SelectTrigger>
            <SelectContent>
              {pickupOptions.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
