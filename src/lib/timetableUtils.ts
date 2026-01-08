/**
 * Shared utility functions for timetable operations
 * These are pure functions that operate on passed-in data
 */

import type { Subject } from "../types";

/**
 * Extract the level + subject code from a full class code
 * e.g., "10ENG1" -> "10ENG", "11HIM6" -> "11HIM"
 */
export function getLevelSubjectCode(classCode: string): string {
  // Match level (digits) and subject (letters), ignore class number
  const match = classCode.match(/^(\d+)([A-Z]+)/);
  if (!match) return classCode;
  return `${match[1]}${match[2]}`;
}

/**
 * Find all classes of a subject by level + subject code
 * e.g., "10ENG" finds all Year 10 English classes (10ENG1, 10ENG2, etc.)
 */
export function findSubjectClasses(
  subjects: Subject[],
  levelSubject: string
): Subject[] {
  // levelSubject format: "10ENG", "11HIM", etc.
  const level = parseInt(levelSubject.match(/^\d+/)?.[0] ?? "0", 10);
  const subjectCode = levelSubject.replace(/^\d+/, "");

  return subjects.filter((s) => s.level === level && s.subject === subjectCode);
}
