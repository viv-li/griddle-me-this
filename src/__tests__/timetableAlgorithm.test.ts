/**
 * Tests for timetable algorithm functions
 */

import {
  findConflicts,
  canAddClass,
  getAlternativeClasses,
  findNonConflictingAlternatives,
} from "../lib/timetableAlgorithm";
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

describe("timetableAlgorithm", () => {
  describe("findConflicts", () => {
    describe("year-long subjects", () => {
      it("should find no conflict when allocation is empty", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10ENG1",
            semester: "both",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL2",
          code: "10MTA1",
          semester: "both",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(0);
      });

      it("should find conflict when adding year-long to occupied allocation", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10ENG1",
            semester: "both",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL1",
          code: "10MTA1",
          semester: "both",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].allocation).toBe("AL1");
        expect(conflicts[0].semesters).toContain("sem1");
        expect(conflicts[0].semesters).toContain("sem2");
        expect(conflicts[0].conflictingSubjects[0].code).toBe("10ENG1");
      });

      it("should find conflict with year-long vs semester subject", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10HIS1",
            semester: "sem1",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL1",
          code: "10ENG1",
          semester: "both",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].semesters).toContain("sem1");
        // sem2 should NOT be in conflicts since HIS1 is only sem1
        expect(conflicts[0].semesters).not.toContain("sem2");
      });
    });

    describe("semester subjects", () => {
      it("should find no conflict when semesters don't overlap", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10HIS1",
            semester: "sem1",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL1",
          code: "10GEO1",
          semester: "sem2",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(0);
      });

      it("should find conflict when semesters overlap", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10HIS1",
            semester: "sem1",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL1",
          code: "10GEO1",
          semester: "sem1",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].semesters).toEqual(["sem1"]);
      });

      it("should find conflict with semester vs year-long", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10ENG1",
            semester: "both",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL1",
          code: "10HIS1",
          semester: "sem1",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].semesters).toContain("sem1");
      });

      it("should allow two semester subjects in same allocation if different semesters", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10HIS1",
            semester: "sem1",
          }),
          createSubject({
            allocation: "AL1",
            code: "10GEO1",
            semester: "sem2",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL2",
          code: "10ART1",
          semester: "both",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(0);
      });
    });

    describe("multiple conflicts", () => {
      it("should identify all conflicting subjects", () => {
        const schedule: Subject[] = [
          createSubject({
            allocation: "AL1",
            code: "10HIS1",
            semester: "sem1",
          }),
          createSubject({
            allocation: "AL1",
            code: "10GEO1",
            semester: "sem2",
          }),
        ];
        const newClass = createSubject({
          allocation: "AL1",
          code: "10ENG1",
          semester: "both",
        });

        const conflicts = findConflicts(schedule, newClass);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].conflictingSubjects).toHaveLength(2);
        expect(conflicts[0].semesters).toContain("sem1");
        expect(conflicts[0].semesters).toContain("sem2");
      });
    });
  });

  describe("canAddClass", () => {
    it("should return true when no conflicts", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
      ];
      const newClass = createSubject({
        allocation: "AL2",
        code: "10MTA1",
        semester: "both",
      });

      expect(canAddClass(schedule, newClass)).toBe(true);
    });

    it("should return false when conflicts exist", () => {
      const schedule: Subject[] = [
        createSubject({ allocation: "AL1", code: "10ENG1", semester: "both" }),
      ];
      const newClass = createSubject({
        allocation: "AL1",
        code: "10MTA1",
        semester: "both",
      });

      expect(canAddClass(schedule, newClass)).toBe(false);
    });
  });

  describe("getAlternativeClasses", () => {
    const allSubjects: Subject[] = [
      createSubject({
        allocation: "AL1",
        code: "10ENG1",
        subject: "ENG",
        class: 1,
      }),
      createSubject({
        allocation: "AL2",
        code: "10ENG2",
        subject: "ENG",
        class: 2,
      }),
      createSubject({
        allocation: "AL3",
        code: "10ENG3",
        subject: "ENG",
        class: 3,
      }),
      createSubject({
        allocation: "AL1",
        code: "10MTA1",
        subject: "MTA",
        class: 1,
      }),
      createSubject({
        allocation: "AL2",
        code: "10MTA2",
        subject: "MTA",
        class: 2,
      }),
    ];

    it("should find all classes of a subject", () => {
      const alternatives = getAlternativeClasses(allSubjects, "10ENG");

      expect(alternatives).toHaveLength(3);
      expect(alternatives.map((a) => a.code)).toContain("10ENG1");
      expect(alternatives.map((a) => a.code)).toContain("10ENG2");
      expect(alternatives.map((a) => a.code)).toContain("10ENG3");
    });

    it("should accept Subject object as input", () => {
      const subject = createSubject({ code: "10ENG1", subject: "ENG" });
      const alternatives = getAlternativeClasses(allSubjects, subject);

      expect(alternatives).toHaveLength(3);
    });

    it("should exclude specified allocation", () => {
      const alternatives = getAlternativeClasses(allSubjects, "10ENG", "AL1");

      expect(alternatives).toHaveLength(2);
      expect(alternatives.map((a) => a.code)).not.toContain("10ENG1");
      expect(alternatives.map((a) => a.code)).toContain("10ENG2");
      expect(alternatives.map((a) => a.code)).toContain("10ENG3");
    });

    it("should return empty array for non-existent subject", () => {
      const alternatives = getAlternativeClasses(allSubjects, "10XXX");

      expect(alternatives).toEqual([]);
    });
  });

  describe("findNonConflictingAlternatives", () => {
    const allSubjects: Subject[] = [
      createSubject({
        allocation: "AL1",
        code: "10ENG1",
        subject: "ENG",
        class: 1,
        semester: "both",
      }),
      createSubject({
        allocation: "AL2",
        code: "10ENG2",
        subject: "ENG",
        class: 2,
        semester: "both",
      }),
      createSubject({
        allocation: "AL3",
        code: "10ENG3",
        subject: "ENG",
        class: 3,
        semester: "both",
      }),
      createSubject({
        allocation: "AL1",
        code: "10MTA1",
        subject: "MTA",
        class: 1,
        semester: "both",
      }),
      createSubject({
        allocation: "AL2",
        code: "10MTA2",
        subject: "MTA",
        class: 2,
        semester: "both",
      }),
      createSubject({
        allocation: "AL3",
        code: "10HIS1",
        subject: "HIS",
        class: 1,
        semester: "both",
      }),
    ];

    it("should find alternatives that don't conflict with rest of schedule", () => {
      // Student has ENG1 (AL1), MTA2 (AL2), HIS1 (AL3)
      // If they want to move ENG1, alternatives are ENG2 (AL2) and ENG3 (AL3)
      // But AL2 has MTA2 and AL3 has HIS1, so no non-conflicting alternatives
      const schedule: Subject[] = [
        allSubjects[0], // 10ENG1 in AL1
        allSubjects[4], // 10MTA2 in AL2
        allSubjects[5], // 10HIS1 in AL3
      ];

      const alternatives = findNonConflictingAlternatives(
        allSubjects,
        schedule,
        allSubjects[0] // Move ENG1
      );

      // Both AL2 and AL3 are occupied, so no non-conflicting alternatives
      expect(alternatives).toHaveLength(0);
    });

    it("should find alternatives when some allocations are free", () => {
      // Student only has ENG1 (AL1)
      // They can move to ENG2 (AL2) or ENG3 (AL3)
      const schedule: Subject[] = [allSubjects[0]]; // Only 10ENG1 in AL1

      const alternatives = findNonConflictingAlternatives(
        allSubjects,
        schedule,
        allSubjects[0] // Move ENG1
      );

      expect(alternatives).toHaveLength(2);
      expect(alternatives.map((a) => a.code)).toContain("10ENG2");
      expect(alternatives.map((a) => a.code)).toContain("10ENG3");
    });

    it("should not include the original class in alternatives", () => {
      const schedule: Subject[] = [allSubjects[0]]; // Only 10ENG1 in AL1

      const alternatives = findNonConflictingAlternatives(
        allSubjects,
        schedule,
        allSubjects[0]
      );

      expect(alternatives.map((a) => a.code)).not.toContain("10ENG1");
    });
  });
});
