/**
 * Tests for validation functions
 */

import { validateStudentSchedule } from "../lib/validation";
import type { Subject } from "../types";

// Helper to create test subjects
function createSubject(overrides: Partial<Subject>): Subject {
  return {
    allocation: "AL1",
    code: "10TST1",
    level: 10,
    subject: "TST",
    class: 1,
    semester: "both",
    enrolled: 15,
    capacity: 25,
    ...overrides,
  };
}

describe("validation", () => {
  describe("validateStudentSchedule", () => {
    it("should validate a complete schedule with year-long subjects", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
        createSubject({ allocation: "AL2", code: "10MTA1", semester: "both" }),
        createSubject({ allocation: "AL3", code: "10MTG1", semester: "both" }),
        createSubject({ allocation: "AL4", code: "10SCI1", semester: "both" }),
        createSubject({ allocation: "AL5", code: "10HIS1", semester: "both" }),
        createSubject({ allocation: "AL6", code: "10GEO1", semester: "both" }),
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(true);
      expect(result.missingSlots).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it("should validate a schedule with semester subjects", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
        createSubject({ allocation: "AL2", code: "10MTA1", semester: "both" }),
        createSubject({ allocation: "AL3", code: "10MTG1", semester: "both" }),
        createSubject({ allocation: "AL4", code: "10SCI1", semester: "both" }),
        createSubject({ allocation: "AL5", code: "10HIS1", semester: "sem1" }),
        createSubject({ allocation: "AL5", code: "10GEO1", semester: "sem2" }),
        createSubject({ allocation: "AL6", code: "10ART1", semester: "sem1" }),
        createSubject({ allocation: "AL6", code: "10MUS1", semester: "sem2" }),
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(true);
      expect(result.missingSlots).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it("should detect missing allocations", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
        createSubject({ allocation: "AL2", code: "10MTA1", semester: "both" }),
        createSubject({ allocation: "AL3", code: "10MTG1", semester: "both" }),
        createSubject({ allocation: "AL4", code: "10SCI1", semester: "both" }),
        createSubject({ allocation: "AL5", code: "10HIS1", semester: "both" }),
        // Missing AL6
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.missingSlots.length).toBe(2); // AL6-sem1 and AL6-sem2
      expect(result.missingSlots).toContainEqual({
        allocation: "AL6",
        semester: "sem1",
      });
      expect(result.missingSlots).toContainEqual({
        allocation: "AL6",
        semester: "sem2",
      });
    });

    it("should detect missing semester in a slot", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
        createSubject({ allocation: "AL2", code: "10MTA1", semester: "both" }),
        createSubject({ allocation: "AL3", code: "10MTG1", semester: "both" }),
        createSubject({ allocation: "AL4", code: "10SCI1", semester: "both" }),
        createSubject({ allocation: "AL5", code: "10HIS1", semester: "both" }),
        createSubject({ allocation: "AL6", code: "10ART1", semester: "sem1" }),
        // Missing AL6-sem2
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.missingSlots).toHaveLength(1);
      expect(result.missingSlots[0]).toEqual({
        allocation: "AL6",
        semester: "sem2",
      });
    });

    it("should detect conflicts (two subjects in same slot)", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
        createSubject({ allocation: "AL2", code: "10MTA1", semester: "both" }),
        createSubject({ allocation: "AL3", code: "10MTG1", semester: "both" }),
        createSubject({ allocation: "AL4", code: "10SCI1", semester: "both" }),
        createSubject({ allocation: "AL5", code: "10HIS1", semester: "both" }),
        createSubject({ allocation: "AL6", code: "10ART1", semester: "sem1" }),
        createSubject({ allocation: "AL6", code: "10MUS1", semester: "sem1" }), // Conflict!
        createSubject({ allocation: "AL6", code: "10GEO1", semester: "sem2" }),
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].allocation).toBe("AL6");
      expect(result.conflicts[0].semester).toBe("sem1");
      expect(result.conflicts[0].subjects).toContain("10ART1");
      expect(result.conflicts[0].subjects).toContain("10MUS1");
    });

    it("should detect year-long subject conflicting with semester subjects", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
        createSubject({ allocation: "AL2", code: "10MTA1", semester: "both" }),
        createSubject({ allocation: "AL3", code: "10MTG1", semester: "both" }),
        createSubject({ allocation: "AL4", code: "10SCI1", semester: "both" }),
        createSubject({ allocation: "AL5", code: "10HIS1", semester: "both" }),
        createSubject({ allocation: "AL6", code: "10ART1", semester: "both" }), // Year-long
        createSubject({ allocation: "AL6", code: "10MUS1", semester: "sem1" }), // Conflict in sem1
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      // Should have conflict in AL6-sem1
      const al6Sem1Conflict = result.conflicts.find(
        (c) => c.allocation === "AL6" && c.semester === "sem1"
      );
      expect(al6Sem1Conflict).toBeDefined();
    });

    it("should handle empty schedule", () => {
      const result = validateStudentSchedule([]);

      expect(result.valid).toBe(false);
      expect(result.missingSlots).toHaveLength(12); // 6 allocations × 2 semesters
    });
  });
});
