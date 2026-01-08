/**
 * Core types for Griddle Me This timetable application
 */

// =============================================================================
// Timetable Primitives
// =============================================================================

/** Allocation block identifier (AL1 through AL6) */
export type AllocationBlock = "AL1" | "AL2" | "AL3" | "AL4" | "AL5" | "AL6";

/** Semester identifier */
export type Semester = "sem1" | "sem2" | "both";

// =============================================================================
// Subject Types
// =============================================================================

/**
 * A subject/class in the master timetable.
 * Each entry represents a specific class instance (e.g., "10ENG1" = Year 10 English, class 1)
 */
export interface Subject {
  /** Allocation block this class runs in (AL1-AL6) */
  allocation: AllocationBlock;
  /** Full class code, format: {level}{subject}{class} e.g., "10ENG1" */
  code: string;
  /** Year level (e.g., 10, 11, 12) */
  level: number;
  /** 3-letter subject code (e.g., "ENG", "HIS", "HIM") */
  subject: string;
  /** Class number within the subject (e.g., 1, 2, 3) */
  class: number;
  /** When this subject runs: sem1 only, sem2 only, or both (year-long) */
  semester: Semester;
  /** Current number of enrolled students */
  enrolled: number;
  /** Maximum class capacity */
  capacity: number;
}

/**
 * The master timetable data stored in localStorage.
 * Contains all available classes and metadata about when it was uploaded.
 */
export interface TimetableData {
  /** Array of all subjects/classes in the timetable */
  subjects: Subject[];
  /** ISO timestamp of when the timetable was uploaded */
  uploadedAt: string;
}

// =============================================================================
// Change Request Types
// =============================================================================

/** Status of a change request */
export type RequestStatus = "pending" | "applied";

/**
 * A student's subject change request.
 * Stores what the student wants to change and the context for the algorithm.
 */
export interface ChangeRequest {
  /** Unique identifier for this request */
  id: string;
  /** Optional user-provided label (should NOT contain student identifying info) */
  label?: string;
  /** Array of subject codes the student is currently enrolled in */
  studentSubjects: string[];
  /** Subject to drop, format: level + 3-letter code (e.g., "10HIS") */
  dropSubject: string;
  /** Subject to pick up, format: level + 3-letter code (e.g., "11HIM") */
  pickupSubject: string;
  /** ISO timestamp when request was created */
  createdAt: string;
  /** uploadedAt timestamp of the timetable used when this request was created */
  timetableVersion: string;
  /** Current status of this request */
  status: RequestStatus;
  /** Index of the solution that was accepted (if applied) */
  appliedSolutionIndex?: number;
}

// =============================================================================
// Solution Types
// =============================================================================

/** Type of change in a solution step */
export type ChangeType = "rearrange" | "drop" | "enroll";

/**
 * A single step/change required to implement a solution.
 */
export interface ClassChange {
  /** Type of change: rearrange (move between classes), drop, or enroll */
  type: ChangeType;
  /** The class being left (for rearrange/drop) */
  fromClass?: Subject;
  /** The class being joined (for rearrange/enroll) */
  toClass?: Subject;
  /** Human-readable description of this step */
  description: string;
}

/**
 * A complete solution for a change request.
 * Represents one valid way to accommodate the student's subject change.
 */
export interface Solution {
  /** The student's new timetable after applying this solution */
  newTimetable: Subject[];
  /** Ordered list of changes required to implement this solution */
  changes: ClassChange[];
  /** Whether any class in this solution exceeds capacity */
  hasCapacityWarning: boolean;
  /** List of class codes that would exceed capacity */
  capacityWarnings: string[];
}

// =============================================================================
// History Types
// =============================================================================

/**
 * Extended change request with computed solutions for display in history.
 * Used when viewing or replaying a past request.
 */
export interface RequestHistoryEntry extends ChangeRequest {
  /** Solutions computed for this request (may be recomputed if timetable changed) */
  solutions?: Solution[];
  /** Whether the timetable has changed since this request was created */
  isStale?: boolean;
}

// =============================================================================
// UI State Types
// =============================================================================

/** Application view identifiers for navigation */
export type AppView = "upload" | "newRequest" | "results" | "history";

/**
 * Represents a subject in the student's schedule with its position.
 * Used for validation and display in the timetable grid.
 */
export interface StudentScheduleSlot {
  /** The allocation block */
  allocation: AllocationBlock;
  /** The semester this slot is for */
  semester: "sem1" | "sem2";
  /** The subject in this slot (null if unfilled) */
  subject: Subject | null;
}
