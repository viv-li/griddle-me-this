/**
 * LocalStorage operations for timetable data and change requests
 */

import type { TimetableData, ChangeRequest, Subject } from "../types";

// Storage keys
const TIMETABLE_KEY = "griddle-timetable";
const REQUESTS_KEY = "griddle-requests";

// =============================================================================
// Timetable Storage
// =============================================================================

/**
 * Save timetable data to localStorage
 */
export function saveTimetable(data: TimetableData): void {
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(data));
}

/**
 * Load timetable data from localStorage
 * Returns null if no data exists or data is corrupted
 */
export function loadTimetable(): TimetableData | null {
  const stored = localStorage.getItem(TIMETABLE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    // Basic validation - ensure it has the expected shape
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray(parsed.subjects) &&
      typeof parsed.uploadedAt === "string"
    ) {
      return parsed as TimetableData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear timetable data from localStorage
 */
export function clearTimetable(): void {
  localStorage.removeItem(TIMETABLE_KEY);
}

// =============================================================================
// Change Requests Storage
// =============================================================================

/**
 * Save change requests to localStorage
 */
export function saveRequests(requests: ChangeRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

/**
 * Load change requests from localStorage
 * Returns empty array if no data exists or data is corrupted
 */
export function loadRequests(): ChangeRequest[] {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as ChangeRequest[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Add a new change request
 */
export function addRequest(request: ChangeRequest): void {
  const requests = loadRequests();
  requests.push(request);
  saveRequests(requests);
}

/**
 * Update an existing change request by ID
 */
export function updateRequest(
  id: string,
  updates: Partial<ChangeRequest>
): void {
  const requests = loadRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates };
    saveRequests(requests);
  }
}

/**
 * Delete a change request by ID
 */
export function deleteRequest(id: string): void {
  const requests = loadRequests();
  const filtered = requests.filter((r) => r.id !== id);
  saveRequests(filtered);
}

/**
 * Clear all change requests from localStorage
 */
export function clearRequests(): void {
  localStorage.removeItem(REQUESTS_KEY);
}

// =============================================================================
// Enrollment Updates
// =============================================================================

/**
 * Update enrollment counts in the timetable when a solution is applied.
 *
 * @param changes - Array of { fromCode, toCode } representing class changes
 *                  fromCode: class the student is leaving (decrement enrolled)
 *                  toCode: class the student is joining (increment enrolled)
 */
export function updateTimetableEnrollment(
  changes: Array<{ fromCode?: string; toCode?: string }>
): void {
  const timetable = loadTimetable();
  if (!timetable) return;

  // Create a map for quick lookup
  const subjectMap = new Map<string, Subject>();
  for (const subject of timetable.subjects) {
    subjectMap.set(subject.code, subject);
  }

  // Apply changes
  for (const change of changes) {
    if (change.fromCode) {
      const fromSubject = subjectMap.get(change.fromCode);
      if (fromSubject && fromSubject.enrolled > 0) {
        fromSubject.enrolled--;
      }
    }
    if (change.toCode) {
      const toSubject = subjectMap.get(change.toCode);
      if (toSubject) {
        toSubject.enrolled++;
      }
    }
  }

  // Save updated timetable
  saveTimetable(timetable);
}
