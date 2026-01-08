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
