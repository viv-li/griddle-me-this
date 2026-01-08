/**
 * Timetable rearrangement algorithm
 *
 * This module implements the BFS-based algorithm for finding valid timetable
 * configurations when a student wants to change subjects.
 */

import type { Subject, AllocationBlock, Solution, ClassChange } from "../types";
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

// =============================================================================
// BFS Solution Finder
// =============================================================================

/**
 * State for BFS exploration
 */
interface BFSState {
  /** Current schedule configuration */
  schedule: Subject[];
  /** Changes made to reach this state */
  changes: ClassChange[];
  /** The class we're still trying to place (null if successfully placed) */
  pendingClass: Subject | null;
}

/**
 * Create a unique key for a schedule state (for visited tracking)
 */
function getStateKey(schedule: Subject[]): string {
  return schedule
    .map((s) => s.code)
    .sort()
    .join(",");
}

/**
 * Find all valid solutions for a subject change request.
 *
 * Uses BFS to explore all possible timetable rearrangements that would
 * allow the student to drop one subject and pick up another.
 *
 * Supports two modes:
 * - Subject change: dropSubject !== pickupSubject (e.g., drop 10HIS, pick up 11HIM)
 * - Class change: dropSubject === pickupSubject (find different class of same subject)
 *
 * @param allSubjects - All subjects in the master timetable
 * @param currentSchedule - Student's current enrolled classes
 * @param dropSubject - Level+subject to drop (e.g., "10HIS")
 * @param pickupSubject - Level+subject to pick up (e.g., "11HIM"). Same as dropSubject for class change.
 * @param maxDepth - Maximum number of rearrangements to consider (default: 5)
 * @returns Array of valid solutions (unsorted - use rankSolutions to sort)
 */
export function findSolutions(
  allSubjects: Subject[],
  currentSchedule: Subject[],
  dropSubject: string,
  pickupSubject: string,
  maxDepth: number = 5
): Solution[] {
  const solutions: Solution[] = [];
  const visited = new Set<string>();

  // Determine if this is a class change (same subject, different class)
  const isClassChange = dropSubject === pickupSubject;

  // Step 1: Remove the dropped subject from schedule
  const droppedClass = currentSchedule.find(
    (s) => getLevelSubjectCode(s.code) === dropSubject
  );

  if (!droppedClass) {
    // Student doesn't have this subject - nothing to drop
    return [];
  }

  const scheduleAfterDrop = currentSchedule.filter(
    (s) => getLevelSubjectCode(s.code) !== dropSubject
  );

  // Create the "drop" change
  const dropChange: ClassChange = {
    type: "drop",
    fromClass: droppedClass,
    description: `Drop ${droppedClass.code} (${droppedClass.allocation})`,
  };

  // Step 2: Find all classes of the pickup subject
  let targetClasses = findSubjectClasses(allSubjects, pickupSubject);

  // For class change, exclude the student's current class
  if (isClassChange) {
    targetClasses = targetClasses.filter((c) => c.code !== droppedClass.code);
  }

  if (targetClasses.length === 0) {
    // No classes exist for this subject
    return [];
  }

  // Step 3: BFS for each target class
  for (const targetClass of targetClasses) {
    // Initialize BFS queue
    const queue: BFSState[] = [
      {
        schedule: scheduleAfterDrop,
        changes: [dropChange],
        pendingClass: targetClass,
      },
    ];

    // Track visited states for this target
    const targetVisited = new Set<string>();
    targetVisited.add(getStateKey(scheduleAfterDrop));

    while (queue.length > 0) {
      const state = queue.shift()!;

      // Skip if we've gone too deep
      if (state.changes.length > maxDepth + 1) {
        continue;
      }

      // If no pending class, this is a complete solution
      if (!state.pendingClass) {
        continue;
      }

      // Try to add the pending class
      const conflicts = findConflicts(state.schedule, state.pendingClass);

      if (conflicts.length === 0) {
        // No conflicts - we can place the class!
        const newSchedule = [...state.schedule, state.pendingClass];
        const enrollChange: ClassChange = {
          type: "enroll",
          toClass: state.pendingClass,
          description: `Enroll in ${state.pendingClass.code} (${state.pendingClass.allocation})`,
        };

        // Check if this final state is already a known solution
        const finalKey = getStateKey(newSchedule);
        if (!visited.has(finalKey)) {
          visited.add(finalKey);
          solutions.push({
            newTimetable: newSchedule,
            changes: [...state.changes, enrollChange],
            hasCapacityWarning: false, // Will be set by checkCapacity later
            capacityWarnings: [],
          });
        }
      } else {
        // Conflicts exist - try to move conflicting subjects
        for (const conflict of conflicts) {
          for (const conflictingSubject of conflict.conflictingSubjects) {
            // Find alternatives for the conflicting subject
            const alternatives = findNonConflictingAlternatives(
              allSubjects,
              state.schedule,
              conflictingSubject
            );

            for (const alternative of alternatives) {
              // Create new schedule with the swap
              const newSchedule = state.schedule
                .filter((s) => s.code !== conflictingSubject.code)
                .concat(alternative);

              const stateKey = getStateKey(newSchedule);
              if (!targetVisited.has(stateKey)) {
                targetVisited.add(stateKey);

                // Record the rearrangement
                const rearrangeChange: ClassChange = {
                  type: "rearrange",
                  fromClass: conflictingSubject,
                  toClass: alternative,
                  description: `Move from ${conflictingSubject.code} (${conflictingSubject.allocation}) to ${alternative.code} (${alternative.allocation})`,
                };

                // Add new state to queue
                queue.push({
                  schedule: newSchedule,
                  changes: [...state.changes, rearrangeChange],
                  pendingClass: state.pendingClass,
                });
              }
            }
          }
        }
      }
    }
  }

  return solutions;
}

// =============================================================================
// Capacity Checking
// =============================================================================

/**
 * Check capacity for all classes affected by a solution.
 *
 * Important: The student's own movements affect capacity:
 * - When leaving a class (fromClass), that class gains 1 spot
 * - When joining a class (toClass), that class loses 1 spot
 *
 * We only check the final state - whether each class the student is joining
 * has available capacity.
 *
 * @param solution - The solution to check
 * @param allSubjects - All subjects in the master timetable (for current enrollment data)
 * @returns Updated solution with hasCapacityWarning and capacityWarnings populated
 */
export function checkCapacity(
  solution: Solution,
  allSubjects: Subject[]
): Solution {
  const warnings: string[] = [];

  // Build a map of capacity adjustments from the student's changes
  // Key: class code, Value: adjustment (+1 for leaving, -1 for joining)
  const capacityAdjustments = new Map<string, number>();

  for (const change of solution.changes) {
    if (change.fromClass) {
      // Student is leaving this class - frees up 1 spot
      const current = capacityAdjustments.get(change.fromClass.code) ?? 0;
      capacityAdjustments.set(change.fromClass.code, current + 1);
    }
    if (change.toClass) {
      // Student is joining this class - takes up 1 spot
      const current = capacityAdjustments.get(change.toClass.code) ?? 0;
      capacityAdjustments.set(change.toClass.code, current - 1);
    }
  }

  // Check each class the student is joining
  for (const change of solution.changes) {
    if (change.toClass) {
      // Find the current enrollment for this class from master timetable
      const masterClass = allSubjects.find(
        (s) => s.code === change.toClass!.code
      );

      if (masterClass) {
        // Calculate effective enrollment after student's changes:
        // - adjustment is +1 if student leaves this class (frees spot)
        // - adjustment is -1 if student joins this class (takes spot)
        // - net adjustment of 0 means student leaves and rejoins (no change)
        const adjustment = capacityAdjustments.get(change.toClass.code) ?? 0;
        const effectiveEnrolled = masterClass.enrolled - adjustment;

        if (effectiveEnrolled > masterClass.capacity) {
          warnings.push(change.toClass.code);
        }
      }
    }
  }

  return {
    ...solution,
    hasCapacityWarning: warnings.length > 0,
    capacityWarnings: [...new Set(warnings)], // Dedupe just in case
  };
}

// =============================================================================
// Solution Ranking
// =============================================================================

/**
 * Rank solutions by preference:
 * 1. Solutions without capacity warnings come first
 * 2. Among equal warning status, fewer changes is better
 *
 * @param solutions - Array of solutions to rank
 * @returns New array sorted by preference (does not mutate input)
 */
export function rankSolutions(solutions: Solution[]): Solution[] {
  return [...solutions].sort((a, b) => {
    // First: no warnings beats warnings
    if (a.hasCapacityWarning !== b.hasCapacityWarning) {
      return a.hasCapacityWarning ? 1 : -1;
    }

    // Second: fewer changes is better
    return a.changes.length - b.changes.length;
  });
}
