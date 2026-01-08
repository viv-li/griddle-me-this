/**
 * LocalStorage operations for timetable data and change requests
 */

import type { TimetableData, ChangeRequest } from "../types";

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
