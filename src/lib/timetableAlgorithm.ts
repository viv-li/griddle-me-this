/**
 * Timetable rearrangement algorithm
 *
 * This module implements the BFS-based algorithm for finding valid timetable
 * configurations when a student wants to change subjects.
 */

import type { Subject, AllocationBlock } from "../types";
import { getLevelSubjectCode, findSubjectClasses } from "./timetableUtils";

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a student's current timetable state.
 * Maps allocation+semester slots to the subject code occupying that slot.
 */
export interface TimetableState {
  /** The subjects in the student's schedule */
  subjects: Subject[];
}

/**
 * A conflict that occurs when trying to add a class to a schedule
 */
export interface Conflict {
  /** The allocation where the conflict occurs */
  allocation: AllocationBlock;
  /** The semester(s) where the conflict occurs */
  semesters: Array<"sem1" | "sem2">;
  /** The existing subject(s) that conflict */
  conflictingSubjects: Subject[];
}

// =============================================================================
// Conflict Detection
// =============================================================================

/**
 * Find conflicts that would occur if adding a class to a student's schedule.
 *
 * A conflict occurs when:
 * - The new class occupies the same allocation+semester as an existing class
 * - A year-long class conflicts with any class in the same allocation
 *
 * @param schedule - Current student schedule
 * @param newClass - The class to potentially add
 * @returns Array of conflicts (empty if no conflicts)
 */
export function findConflicts(
  schedule: Subject[],
  newClass: Subject
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Find subjects in the same allocation
  const subjectsInAllocation = schedule.filter(
    (s) => s.allocation === newClass.allocation
  );

  if (subjectsInAllocation.length === 0) {
    return []; // No conflicts - allocation is empty
  }

  // Check for conflicts based on semester
  const conflictingSubjects: Subject[] = [];
  const conflictingSemesters: Set<"sem1" | "sem2"> = new Set();

  for (const existing of subjectsInAllocation) {
    // Determine which semesters overlap
    const newSemesters =
      newClass.semester === "both" ? ["sem1", "sem2"] : [newClass.semester];
    const existingSemesters =
      existing.semester === "both" ? ["sem1", "sem2"] : [existing.semester];

    // Check for overlap
    for (const sem of newSemesters) {
      if (existingSemesters.includes(sem)) {
        conflictingSubjects.push(existing);
        conflictingSemesters.add(sem as "sem1" | "sem2");
      }
    }
  }

  if (conflictingSubjects.length > 0) {
    conflicts.push({
      allocation: newClass.allocation,
      semesters: Array.from(conflictingSemesters),
      conflictingSubjects: [...new Set(conflictingSubjects)], // Dedupe
    });
  }

  return conflicts;
}

/**
 * Check if a class can be added to a schedule without conflicts
 */
export function canAddClass(schedule: Subject[], newClass: Subject): boolean {
  return findConflicts(schedule, newClass).length === 0;
}

// =============================================================================
// Alternative Classes
// =============================================================================

/**
 * Find alternative classes for a subject in different allocations.
 *
 * Used when a student needs to move a subject to make room for another.
 *
 * @param allSubjects - All subjects in the timetable
 * @param subject - The subject to find alternatives for (can be Subject or level+subject string)
 * @param excludeAllocation - Optionally exclude a specific allocation
 * @returns Array of alternative classes
 */
export function getAlternativeClasses(
  allSubjects: Subject[],
  subject: Subject | string,
  excludeAllocation?: AllocationBlock
): Subject[] {
  // Get the level+subject code
  const levelSubject =
    typeof subject === "string" ? subject : getLevelSubjectCode(subject.code);

  // Find all classes of this subject
  const allClasses = findSubjectClasses(allSubjects, levelSubject);

  // Filter out the excluded allocation if specified
  if (excludeAllocation) {
    return allClasses.filter((c) => c.allocation !== excludeAllocation);
  }

  return allClasses;
}

/**
 * Find alternative classes that could replace a subject in a student's schedule.
 * Returns classes that would not conflict with the rest of the schedule.
 *
 * @param allSubjects - All subjects in the timetable
 * @param schedule - Current student schedule
 * @param subjectToMove - The subject that needs to be moved
 * @returns Array of alternative classes that don't conflict
 */
export function findNonConflictingAlternatives(
  allSubjects: Subject[],
  schedule: Subject[],
  subjectToMove: Subject
): Subject[] {
  // Get schedule without the subject being moved
  const scheduleWithoutSubject = schedule.filter(
    (s) => s.code !== subjectToMove.code
  );

  // Get all alternative classes for this subject
  const alternatives = getAlternativeClasses(
    allSubjects,
    subjectToMove,
    subjectToMove.allocation
  );

  // Filter to those that don't conflict
  return alternatives.filter((alt) => canAddClass(scheduleWithoutSubject, alt));
}
