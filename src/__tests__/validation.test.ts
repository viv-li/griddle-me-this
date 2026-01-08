/**
 * Tests for validation functions
 */

import {
  validateTimetableJSON,
  validateStudentSchedule,
  getStudentSubjects,
} from "../lib/validation";
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
      expect(result.duplicateSubjects).toHaveLength(0);
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
      expect(result.duplicateSubjects).toHaveLength(0);
    });

    it("should detect duplicate subjects (same subject, different class)", () => {
      const schedule: Subject[] = [
        createSubject({
          allocation: "AL1",
          code: "10ENG1",
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL2",
          code: "10MTA1",
          subject: "MTA",
          semester: "both",
        }),
        createSubject({
          allocation: "AL3",
          code: "10MTG1",
          subject: "MTG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL4",
          code: "10SCI1",
          subject: "SCI",
          semester: "both",
        }),
        createSubject({
          allocation: "AL5",
          code: "10ART1",
          subject: "ART",
          semester: "both",
        }),
        createSubject({
          allocation: "AL6",
          code: "10ART2",
          subject: "ART",
          semester: "both",
        }), // Duplicate!
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.duplicateSubjects).toHaveLength(1);
      expect(result.duplicateSubjects[0].levelSubject).toBe("10ART");
      expect(result.duplicateSubjects[0].classes).toContain("10ART1");
      expect(result.duplicateSubjects[0].classes).toContain("10ART2");
    });

    it("should detect multiple duplicate subjects", () => {
      const schedule: Subject[] = [
        createSubject({
          allocation: "AL1",
          code: "10ENG1",
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL2",
          code: "10ENG2",
          subject: "ENG",
          semester: "both",
        }), // Dup ENG
        createSubject({
          allocation: "AL3",
          code: "10MTG1",
          subject: "MTG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL4",
          code: "10SCI1",
          subject: "SCI",
          semester: "both",
        }),
        createSubject({
          allocation: "AL5",
          code: "10ART1",
          subject: "ART",
          semester: "both",
        }),
        createSubject({
          allocation: "AL6",
          code: "10ART2",
          subject: "ART",
          semester: "both",
        }), // Dup ART
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.duplicateSubjects).toHaveLength(2);

      const engDup = result.duplicateSubjects.find(
        (d) => d.levelSubject === "10ENG"
      );
      expect(engDup).toBeDefined();
      expect(engDup!.classes).toHaveLength(2);

      const artDup = result.duplicateSubjects.find(
        (d) => d.levelSubject === "10ART"
      );
      expect(artDup).toBeDefined();
      expect(artDup!.classes).toHaveLength(2);
    });

    it("should detect three classes of same subject as duplicate", () => {
      const schedule: Subject[] = [
        createSubject({
          allocation: "AL1",
          code: "10ENG1",
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL2",
          code: "10ENG2",
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL3",
          code: "10ENG3",
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL4",
          code: "10SCI1",
          subject: "SCI",
          semester: "both",
        }),
        createSubject({
          allocation: "AL5",
          code: "10HIS1",
          subject: "HIS",
          semester: "both",
        }),
        createSubject({
          allocation: "AL6",
          code: "10GEO1",
          subject: "GEO",
          semester: "both",
        }),
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.duplicateSubjects).toHaveLength(1);
      expect(result.duplicateSubjects[0].levelSubject).toBe("10ENG");
      expect(result.duplicateSubjects[0].classes).toHaveLength(3);
    });

    it("should not flag different levels of same subject as duplicates", () => {
      // 10ENG and 11ENG are different subjects
      const schedule: Subject[] = [
        createSubject({
          allocation: "AL1",
          code: "10ENG1",
          level: 10,
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL2",
          code: "11ENG1",
          level: 11,
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL3",
          code: "10MTG1",
          subject: "MTG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL4",
          code: "10SCI1",
          subject: "SCI",
          semester: "both",
        }),
        createSubject({
          allocation: "AL5",
          code: "10HIS1",
          subject: "HIS",
          semester: "both",
        }),
        createSubject({
          allocation: "AL6",
          code: "10GEO1",
          subject: "GEO",
          semester: "both",
        }),
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(true);
      expect(result.duplicateSubjects).toHaveLength(0);
    });

    it("should detect duplicates even with other validation errors", () => {
      const schedule: Subject[] = [
        createSubject({
          allocation: "AL1",
          code: "10ENG1",
          subject: "ENG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL2",
          code: "10MTA1",
          subject: "MTA",
          semester: "both",
        }),
        createSubject({
          allocation: "AL3",
          code: "10MTG1",
          subject: "MTG",
          semester: "both",
        }),
        createSubject({
          allocation: "AL4",
          code: "10SCI1",
          subject: "SCI",
          semester: "both",
        }),
        createSubject({
          allocation: "AL5",
          code: "10ART1",
          subject: "ART",
          semester: "both",
        }),
        createSubject({
          allocation: "AL5",
          code: "10ART2",
          subject: "ART",
          semester: "both",
        }), // Dup ART + conflict
        // Missing AL6
      ];

      const result = validateStudentSchedule(schedule);

      expect(result.valid).toBe(false);
      expect(result.missingSlots.length).toBeGreaterThan(0); // Missing AL6
      expect(result.conflicts.length).toBeGreaterThan(0); // AL5 conflict
      expect(result.duplicateSubjects).toHaveLength(1); // 10ART duplicate
    });
  });

  describe("validateTimetableJSON", () => {
    const validSubject = {
      allocation: "AL1",
      code: "10ENG1",
      level: 10,
      subject: "ENG",
      class: 1,
      semester: "both",
      enrolled: 20,
      capacity: 25,
    };

    it("should validate a valid timetable array", () => {
      const result = validateTimetableJSON([validSubject]);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-array data", () => {
      const result = validateTimetableJSON({ subjects: [] });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Timetable must be an array of subjects");
    });

    it("should reject empty array", () => {
      const result = validateTimetableJSON([]);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Timetable must contain at least one subject");
    });

    it("should reject non-object elements", () => {
      const result = validateTimetableJSON(["not an object"]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be an object");
    });

    it("should reject invalid allocation", () => {
      const result = validateTimetableJSON([
        { ...validSubject, allocation: "AL7" },
      ]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("invalid allocation");
    });

    it("should reject empty code", () => {
      const result = validateTimetableJSON([{ ...validSubject, code: "" }]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("code must be a non-empty string");
    });

    it("should reject invalid semester", () => {
      const result = validateTimetableJSON([
        { ...validSubject, semester: "winter" },
      ]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("invalid semester");
    });

    it("should reject non-integer level", () => {
      const result = validateTimetableJSON([{ ...validSubject, level: 10.5 }]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("level must be a positive integer");
    });

    it("should reject negative level", () => {
      const result = validateTimetableJSON([{ ...validSubject, level: -1 }]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("level must be a positive integer");
    });

    it("should reject negative enrolled", () => {
      const result = validateTimetableJSON([{ ...validSubject, enrolled: -5 }]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("enrolled must be a non-negative integer");
    });

    it("should accept zero enrolled", () => {
      const result = validateTimetableJSON([{ ...validSubject, enrolled: 0 }]);

      expect(result.valid).toBe(true);
    });

    it("should reject zero capacity", () => {
      const result = validateTimetableJSON([{ ...validSubject, capacity: 0 }]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("capacity must be a positive integer");
    });

    it("should include index in error message", () => {
      const result = validateTimetableJSON([
        validSubject,
        { ...validSubject, code: "" },
      ]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("index 1");
    });
  });

  describe("getStudentSubjects", () => {
    it("should extract unique level+subject identifiers", () => {
      const schedule: Subject[] = [
        createSubject({ code: "10ENG1" }),
        createSubject({ code: "10MTA2" }),
        createSubject({ code: "11HIM3" }),
      ];

      const subjects = getStudentSubjects(schedule);

      expect(subjects).toHaveLength(3);
      expect(subjects).toContain("10ENG");
      expect(subjects).toContain("10MTA");
      expect(subjects).toContain("11HIM");
    });

    it("should deduplicate when student has multiple classes of same subject", () => {
      // Student has two ENG classes (shouldn't happen, but test dedup)
      const schedule: Subject[] = [
        createSubject({ code: "10ENG1" }),
        createSubject({ code: "10ENG2" }),
        createSubject({ code: "10MTA1" }),
      ];

      const subjects = getStudentSubjects(schedule);

      expect(subjects).toHaveLength(2);
      expect(subjects).toContain("10ENG");
      expect(subjects).toContain("10MTA");
    });

    it("should handle empty schedule", () => {
      const subjects = getStudentSubjects([]);

      expect(subjects).toEqual([]);
    });

    it("should handle multi-digit class numbers", () => {
      const schedule: Subject[] = [createSubject({ code: "11EAL11" })];

      const subjects = getStudentSubjects(schedule);

      expect(subjects).toContain("11EAL");
    });
  });
});
