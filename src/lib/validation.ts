/**
 * Validation functions for timetable data
 */

import type { Subject, AllocationBlock } from "../types";

/**
 * Result of schedule coverage validation
 */
export interface ScheduleValidationResult {
  valid: boolean;
  missingSlots: Array<{
    allocation: AllocationBlock;
    semester: "sem1" | "sem2";
  }>;
  conflicts: Array<{
    allocation: AllocationBlock;
    semester: "sem1" | "sem2";
    subjects: string[];
  }>;
}

/**
 * Validate that a student schedule covers all allocations and semesters.
 * A valid schedule must have exactly one subject per allocation per semester.
 *
 * @param schedule - Array of subjects in the student's schedule
 * @returns Validation result with any missing slots or conflicts
 */
export function validateStudentSchedule(
  schedule: Subject[]
): ScheduleValidationResult {
  const allocations: AllocationBlock[] = [
    "AL1",
    "AL2",
    "AL3",
    "AL4",
    "AL5",
    "AL6",
  ];
  const semesters: Array<"sem1" | "sem2"> = ["sem1", "sem2"];

  // Track what's filled in each slot
  const filled: Record<string, string[]> = {};
  allocations.forEach((al) => {
    semesters.forEach((sem) => {
      filled[`${al}-${sem}`] = [];
    });
  });

  // Fill in what we have
  for (const subject of schedule) {
    if (subject.semester === "both") {
      filled[`${subject.allocation}-sem1`].push(subject.code);
      filled[`${subject.allocation}-sem2`].push(subject.code);
    } else {
      filled[`${subject.allocation}-${subject.semester}`].push(subject.code);
    }
  }

  // Find missing slots and conflicts
  const missingSlots: ScheduleValidationResult["missingSlots"] = [];
  const conflicts: ScheduleValidationResult["conflicts"] = [];

  for (const al of allocations) {
    for (const sem of semesters) {
      const key = `${al}-${sem}`;
      if (filled[key].length === 0) {
        missingSlots.push({ allocation: al, semester: sem });
      } else if (filled[key].length > 1) {
        conflicts.push({
          allocation: al,
          semester: sem,
          subjects: filled[key],
        });
      }
    }
  }

  return {
    valid: missingSlots.length === 0 && conflicts.length === 0,
    missingSlots,
    conflicts,
  };
}
