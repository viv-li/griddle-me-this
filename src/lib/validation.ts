/**
 * Validation functions for timetable data
 */

import type { Subject, AllocationBlock } from "../types";
import { getLevelSubjectCode } from "./timetableUtils";

// =============================================================================
// Timetable JSON Validation
// =============================================================================

/**
 * Result of timetable JSON validation
 */
export interface TimetableValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate the structure of uploaded timetable JSON.
 * Checks that it's an array of properly structured Subject objects.
 *
 * @param data - The parsed JSON data to validate
 * @returns Validation result with error message if invalid
 */
export function validateTimetableJSON(
  data: unknown
): TimetableValidationResult {
  // Must be an array
  if (!Array.isArray(data)) {
    return { valid: false, error: "Timetable must be an array of subjects" };
  }

  // Must not be empty
  if (data.length === 0) {
    return {
      valid: false,
      error: "Timetable must contain at least one subject",
    };
  }

  // Validate each subject
  const validAllocations = ["AL1", "AL2", "AL3", "AL4", "AL5", "AL6"];
  const validSemesters = ["sem1", "sem2", "both"];

  for (let i = 0; i < data.length; i++) {
    const subject = data[i];
    const prefix = `Subject at index ${i}`;

    if (typeof subject !== "object" || subject === null) {
      return { valid: false, error: `${prefix}: must be an object` };
    }

    // Check required string fields
    if (
      typeof subject.allocation !== "string" ||
      !validAllocations.includes(subject.allocation)
    ) {
      return {
        valid: false,
        error: `${prefix}: invalid allocation (must be AL1-AL6)`,
      };
    }

    if (typeof subject.code !== "string" || subject.code.length === 0) {
      return {
        valid: false,
        error: `${prefix}: code must be a non-empty string`,
      };
    }

    if (typeof subject.subject !== "string" || subject.subject.length === 0) {
      return {
        valid: false,
        error: `${prefix}: subject must be a non-empty string`,
      };
    }

    if (
      typeof subject.semester !== "string" ||
      !validSemesters.includes(subject.semester)
    ) {
      return {
        valid: false,
        error: `${prefix}: invalid semester (must be sem1, sem2, or both)`,
      };
    }

    // Check required number fields
    if (
      typeof subject.level !== "number" ||
      !Number.isInteger(subject.level) ||
      subject.level < 1
    ) {
      return {
        valid: false,
        error: `${prefix}: level must be a positive integer`,
      };
    }

    if (
      typeof subject.class !== "number" ||
      !Number.isInteger(subject.class) ||
      subject.class < 1
    ) {
      return {
        valid: false,
        error: `${prefix}: class must be a positive integer`,
      };
    }

    if (
      typeof subject.enrolled !== "number" ||
      !Number.isInteger(subject.enrolled) ||
      subject.enrolled < 0
    ) {
      return {
        valid: false,
        error: `${prefix}: enrolled must be a non-negative integer`,
      };
    }

    if (
      typeof subject.capacity !== "number" ||
      !Number.isInteger(subject.capacity) ||
      subject.capacity < 1
    ) {
      return {
        valid: false,
        error: `${prefix}: capacity must be a positive integer`,
      };
    }
  }

  return { valid: true };
}

// =============================================================================
// Student Subject Code Extraction
// =============================================================================

/**
 * Extract unique level+subject identifiers from a student's schedule.
 * Used by UI to filter pickup options (can't pick up a subject you already have).
 *
 * @param schedule - Array of subjects in the student's schedule
 * @returns Array of unique level+subject (e.g., ["10ENG", "10MTA", "11HIM"])
 */
export function getStudentSubjects(schedule: Subject[]): string[] {
  const codes = new Set<string>();
  for (const subject of schedule) {
    codes.add(getLevelSubjectCode(subject.code));
  }
  return Array.from(codes);
}

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
