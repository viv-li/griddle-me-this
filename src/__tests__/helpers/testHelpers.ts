/**
 * Test helpers for building student schedules and timetable data
 *
 * Note: For utility functions like findSubjectByCode, findSubjectClasses, etc.,
 * import directly from '../../lib/timetableUtils' and use with loadSampleTimetable().
 *
 * For validation, import from '../../lib/validation'.
 */

import type { Subject, TimetableData } from "../../types";
import sampleTimetable from "../fixtures/sampleTimetable.json";

/**
 * Load the sample timetable as typed Subject array
 */
export function loadSampleTimetable(): Subject[] {
  return sampleTimetable as Subject[];
}

/**
 * Create a TimetableData object from the sample timetable
 */
export function createTimetableData(uploadedAt?: string): TimetableData {
  return {
    subjects: loadSampleTimetable(),
    uploadedAt: uploadedAt ?? new Date().toISOString(),
  };
}

/**
 * Build a valid student schedule from subject codes.
 * The codes should form a valid timetable (all 6 allocations filled for both semesters).
 */
export function buildStudentSchedule(subjectCodes: string[]): Subject[] {
  const timetable = loadSampleTimetable();
  return subjectCodes
    .map((code) => timetable.find((s) => s.code === code))
    .filter((s): s is Subject => s !== undefined);
}

/**
 * Create a valid student schedule (all year-long subjects).
 * All 6 allocations filled with semester: "both" subjects.
 */
export function createValidSchedule(): Subject[] {
  return buildStudentSchedule([
    "10ENG3", // AL1 - both semesters
    "10MTA2", // AL2 - both semesters
    "10MTG2", // AL3 - both semesters
    "10ENG1", // AL4 - both semesters
    "10ENG4", // AL5 - both semesters
    "10ENG2", // AL6 - both semesters
  ]);
}

/**
 * Create a valid student schedule with semester-specific subjects.
 * Mix of year-long (both) and semester-specific (sem1/sem2) subjects.
 */
export function createValidScheduleWithSemesterSubjects(): Subject[] {
  return buildStudentSchedule([
    "10ENG3", // AL1 - both semesters
    "10MTA2", // AL2 - both semesters
    "10MTG2", // AL3 - both semesters
    "10MTG1", // AL4 - both semesters
    "10CHE1", // AL5 - sem1
    "10CHE2", // AL5 - sem2
    "10HIS9", // AL6 - sem1
    "10POL1", // AL6 - sem2
  ]);
}

/**
 * Create an invalid schedule missing an allocation
 */
export function createIncompleteSchedule(): Subject[] {
  return buildStudentSchedule([
    "10ENG3", // AL1 - both semesters
    "10MTA2", // AL2 - both semesters
    "10MTG2", // AL3 - both semesters
    "10ENG1", // AL4 - both semesters
    "10ENG4", // AL5 - both semesters
    // Missing AL6!
  ]);
}

/**
 * Create an invalid schedule with semester conflict
 * (two subjects in same allocation and same semester)
 */
export function createConflictingSchedule(): Subject[] {
  return buildStudentSchedule([
    "10ENG3", // AL1 - both semesters
    "10MTA2", // AL2 - both semesters
    "10MTG2", // AL3 - both semesters
    "10ENG1", // AL4 - both semesters
    "10ENG4", // AL5 - both semesters
    "10HIS9", // AL6 - sem1
    "10PHY1", // AL6 - sem1 (CONFLICT - same allocation, same semester)
  ]);
}
