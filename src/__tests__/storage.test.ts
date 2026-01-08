/**
 * Tests for localStorage storage functions
 */

import {
  saveTimetable,
  loadTimetable,
  saveRequests,
  loadRequests,
  addRequest,
  updateRequest,
  deleteRequest,
  updateTimetableEnrollment,
} from "../lib/storage";
import type { TimetableData, ChangeRequest } from "../types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Timetable Storage", () => {
    const sampleTimetable: TimetableData = {
      subjects: [
        {
          allocation: "AL1",
          code: "10ENG1",
          level: 10,
          subject: "ENG",
          class: 1,
          semester: "both",
          enrolled: 20,
          capacity: 25,
        },
        {
          allocation: "AL2",
          code: "10MTA1",
          level: 10,
          subject: "MTA",
          class: 1,
          semester: "both",
          enrolled: 22,
          capacity: 25,
        },
      ],
      uploadedAt: "2024-01-15T10:30:00.000Z",
    };

    describe("saveTimetable and loadTimetable", () => {
      it("should save and load timetable data", () => {
        saveTimetable(sampleTimetable);
        const loaded = loadTimetable();

        expect(loaded).toEqual(sampleTimetable);
      });

      it("should return null when no timetable exists", () => {
        const loaded = loadTimetable();

        expect(loaded).toBeNull();
      });

      it("should return null for corrupted JSON", () => {
        localStorage.setItem("griddle-timetable", "not valid json{{{");
        const loaded = loadTimetable();

        expect(loaded).toBeNull();
      });

      it("should return null for invalid timetable shape", () => {
        localStorage.setItem(
          "griddle-timetable",
          JSON.stringify({ foo: "bar" })
        );
        const loaded = loadTimetable();

        expect(loaded).toBeNull();
      });

      it("should return null if subjects is not an array", () => {
        localStorage.setItem(
          "griddle-timetable",
          JSON.stringify({ subjects: "not an array", uploadedAt: "2024-01-01" })
        );
        const loaded = loadTimetable();

        expect(loaded).toBeNull();
      });
    });
  });

  describe("Change Requests Storage", () => {
    const sampleRequest: ChangeRequest = {
      id: "req-1",
      label: "Test Request",
      studentSubjects: ["10ENG1", "10MTA1"],
      dropSubject: "10ENG",
      pickupSubject: "10HIS",
      createdAt: "2024-01-15T10:30:00.000Z",
      timetableVersion: "2024-01-15T10:00:00.000Z",
      status: "pending",
    };

    describe("saveRequests and loadRequests", () => {
      it("should save and load requests", () => {
        saveRequests([sampleRequest]);
        const loaded = loadRequests();

        expect(loaded).toEqual([sampleRequest]);
      });

      it("should return empty array when no requests exist", () => {
        const loaded = loadRequests();

        expect(loaded).toEqual([]);
      });

      it("should return empty array for corrupted JSON", () => {
        localStorage.setItem("griddle-requests", "not valid json");
        const loaded = loadRequests();

        expect(loaded).toEqual([]);
      });

      it("should return empty array if data is not an array", () => {
        localStorage.setItem(
          "griddle-requests",
          JSON.stringify({ foo: "bar" })
        );
        const loaded = loadRequests();

        expect(loaded).toEqual([]);
      });
    });

    describe("addRequest", () => {
      it("should add a request to empty storage", () => {
        addRequest(sampleRequest);
        const loaded = loadRequests();

        expect(loaded).toHaveLength(1);
        expect(loaded[0]).toEqual(sampleRequest);
      });

      it("should append to existing requests", () => {
        addRequest(sampleRequest);

        const secondRequest: ChangeRequest = {
          ...sampleRequest,
          id: "req-2",
          label: "Second Request",
        };
        addRequest(secondRequest);

        const loaded = loadRequests();
        expect(loaded).toHaveLength(2);
        expect(loaded[0].id).toBe("req-1");
        expect(loaded[1].id).toBe("req-2");
      });
    });

    describe("updateRequest", () => {
      it("should update an existing request", () => {
        addRequest(sampleRequest);

        updateRequest("req-1", { status: "applied", appliedSolutionIndex: 0 });

        const loaded = loadRequests();
        expect(loaded[0].status).toBe("applied");
        expect(loaded[0].appliedSolutionIndex).toBe(0);
        expect(loaded[0].label).toBe("Test Request"); // Unchanged
      });

      it("should do nothing if request ID not found", () => {
        addRequest(sampleRequest);

        updateRequest("nonexistent", { status: "applied" });

        const loaded = loadRequests();
        expect(loaded[0].status).toBe("pending");
      });
    });

    describe("deleteRequest", () => {
      it("should delete a request by ID", () => {
        addRequest(sampleRequest);
        addRequest({ ...sampleRequest, id: "req-2" });

        deleteRequest("req-1");

        const loaded = loadRequests();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe("req-2");
      });

      it("should do nothing if request ID not found", () => {
        addRequest(sampleRequest);

        deleteRequest("nonexistent");

        const loaded = loadRequests();
        expect(loaded).toHaveLength(1);
      });
    });
  });

  describe("Enrollment Updates", () => {
    const createTimetable = (): TimetableData => ({
      subjects: [
        {
          allocation: "AL1",
          code: "10ENG1",
          level: 10,
          subject: "ENG",
          class: 1,
          semester: "both",
          enrolled: 20,
          capacity: 25,
        },
        {
          allocation: "AL1",
          code: "10ENG2",
          level: 10,
          subject: "ENG",
          class: 2,
          semester: "both",
          enrolled: 22,
          capacity: 25,
        },
        {
          allocation: "AL2",
          code: "10HIS1",
          level: 10,
          subject: "HIS",
          class: 1,
          semester: "both",
          enrolled: 15,
          capacity: 25,
        },
      ],
      uploadedAt: "2024-01-15T10:30:00.000Z",
    });

    describe("updateTimetableEnrollment", () => {
      it("should decrement enrollment when leaving a class", () => {
        saveTimetable(createTimetable());

        updateTimetableEnrollment([{ fromCode: "10ENG1" }]);

        const loaded = loadTimetable();
        const eng1 = loaded?.subjects.find((s) => s.code === "10ENG1");
        expect(eng1?.enrolled).toBe(19);
      });

      it("should increment enrollment when joining a class", () => {
        saveTimetable(createTimetable());

        updateTimetableEnrollment([{ toCode: "10HIS1" }]);

        const loaded = loadTimetable();
        const his1 = loaded?.subjects.find((s) => s.code === "10HIS1");
        expect(his1?.enrolled).toBe(16);
      });

      it("should handle both leaving and joining in one change", () => {
        saveTimetable(createTimetable());

        updateTimetableEnrollment([{ fromCode: "10ENG1", toCode: "10ENG2" }]);

        const loaded = loadTimetable();
        const eng1 = loaded?.subjects.find((s) => s.code === "10ENG1");
        const eng2 = loaded?.subjects.find((s) => s.code === "10ENG2");
        expect(eng1?.enrolled).toBe(19);
        expect(eng2?.enrolled).toBe(23);
      });

      it("should handle multiple changes", () => {
        saveTimetable(createTimetable());

        updateTimetableEnrollment([
          { fromCode: "10ENG1", toCode: "10ENG2" },
          { toCode: "10HIS1" },
        ]);

        const loaded = loadTimetable();
        const eng1 = loaded?.subjects.find((s) => s.code === "10ENG1");
        const eng2 = loaded?.subjects.find((s) => s.code === "10ENG2");
        const his1 = loaded?.subjects.find((s) => s.code === "10HIS1");
        expect(eng1?.enrolled).toBe(19);
        expect(eng2?.enrolled).toBe(23);
        expect(his1?.enrolled).toBe(16);
      });

      it("should not decrement below zero", () => {
        const timetable = createTimetable();
        timetable.subjects[0].enrolled = 0;
        saveTimetable(timetable);

        updateTimetableEnrollment([{ fromCode: "10ENG1" }]);

        const loaded = loadTimetable();
        const eng1 = loaded?.subjects.find((s) => s.code === "10ENG1");
        expect(eng1?.enrolled).toBe(0);
      });

      it("should do nothing if timetable doesn't exist", () => {
        // No timetable saved
        updateTimetableEnrollment([{ fromCode: "10ENG1", toCode: "10ENG2" }]);

        // Should not throw, just do nothing
        expect(loadTimetable()).toBeNull();
      });

      it("should ignore unknown subject codes", () => {
        saveTimetable(createTimetable());

        updateTimetableEnrollment([
          { fromCode: "UNKNOWN1", toCode: "UNKNOWN2" },
        ]);

        // Timetable should be unchanged
        const loaded = loadTimetable();
        expect(loaded?.subjects[0].enrolled).toBe(20);
        expect(loaded?.subjects[1].enrolled).toBe(22);
        expect(loaded?.subjects[2].enrolled).toBe(15);
      });
    });
  });
});
