/**
 * Tests for timetable algorithm functions
 */

import {
  findConflicts,
  canAddClass,
  getAlternativeClasses,
  findNonConflictingAlternatives,
  findSolutions,
  checkCapacity,
  rankSolutions,
} from "../lib/timetableAlgorithm";
import type { Subject, Solution, ClassChange } from "../types";

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

  describe("findSolutions", () => {
    // Create a mini timetable for testing
    const miniTimetable: Subject[] = [
      // ENG classes in different allocations
      createSubject({
        allocation: "AL1",
        code: "10ENG1",
        subject: "ENG",
        class: 1,
        semester: "both",
      }),
      createSubject({
        allocation: "AL3",
        code: "10ENG2",
        subject: "ENG",
        class: 2,
        semester: "both",
      }),
      // MTA classes
      createSubject({
        allocation: "AL2",
        code: "10MTA1",
        subject: "MTA",
        class: 1,
        semester: "both",
      }),
      createSubject({
        allocation: "AL4",
        code: "10MTA2",
        subject: "MTA",
        class: 2,
        semester: "both",
      }),
      // HIS classes
      createSubject({
        allocation: "AL3",
        code: "10HIS1",
        subject: "HIS",
        class: 1,
        semester: "both",
      }),
      createSubject({
        allocation: "AL5",
        code: "10HIS2",
        subject: "HIS",
        class: 2,
        semester: "both",
      }),
      // SCI classes
      createSubject({
        allocation: "AL4",
        code: "10SCI1",
        subject: "SCI",
        class: 1,
        semester: "both",
      }),
      // GEO classes
      createSubject({
        allocation: "AL5",
        code: "10GEO1",
        subject: "GEO",
        class: 1,
        semester: "both",
      }),
      createSubject({
        allocation: "AL6",
        code: "10GEO2",
        subject: "GEO",
        class: 2,
        semester: "both",
      }),
      // ART class
      createSubject({
        allocation: "AL6",
        code: "10ART1",
        subject: "ART",
        class: 1,
        semester: "both",
      }),
      // MUS class (alternate AL3 option)
      createSubject({
        allocation: "AL3",
        code: "10MUS1",
        subject: "MUS",
        class: 1,
        semester: "both",
      }),
    ];

    describe("simple swap (direct placement)", () => {
      it("should find solution when target allocation is free", () => {
        // Student has: MTA1(AL2), HIS1(AL3), SCI1(AL4), GEO1(AL5), ART1(AL6)
        // Missing AL1
        // Drop HIS (AL3), pickup ENG
        // ENG1 is in AL1 (free), ENG2 is in AL3 (will be free after drop)
        const schedule: Subject[] = [
          miniTimetable[2], // MTA1 AL2
          miniTimetable[4], // HIS1 AL3
          miniTimetable[6], // SCI1 AL4
          miniTimetable[7], // GEO1 AL5
          miniTimetable[9], // ART1 AL6
        ];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10HIS",
          "10ENG"
        );

        // Should find solutions - can pick up ENG1 (AL1 free) or ENG2 (AL3 freed)
        expect(solutions.length).toBeGreaterThan(0);

        // Should have at least one direct solution (drop + enroll only)
        const directSolution = solutions.find(
          (s) => s.changes.length === 2 // drop + enroll
        );
        expect(directSolution).toBeDefined();
        expect(directSolution?.changes[0].type).toBe("drop");
        expect(directSolution?.changes[1].type).toBe("enroll");
      });
    });

    describe("single rearrangement", () => {
      it("should find solution requiring one move", () => {
        // Student has: ENG1(AL1), MTA1(AL2), HIS2(AL5), SCI1(AL4), GEO2(AL6)
        // They're missing AL3
        // Drop GEO (AL6), pickup HIS1 (AL3)
        // HIS1 is in AL3 which is free, so direct swap possible
        const schedule: Subject[] = [
          miniTimetable[0], // ENG1 AL1
          miniTimetable[2], // MTA1 AL2
          miniTimetable[5], // HIS2 AL5
          miniTimetable[6], // SCI1 AL4
          miniTimetable[8], // GEO2 AL6
        ];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10GEO",
          "10HIS"
        );

        expect(solutions.length).toBeGreaterThan(0);
      });
    });

    describe("no solution exists", () => {
      it("should return empty array when pickup subject doesn't exist", () => {
        const schedule: Subject[] = [miniTimetable[0]];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10ENG",
          "10XXX" // Doesn't exist
        );

        expect(solutions).toEqual([]);
      });

      it("should return empty array when drop subject not in schedule", () => {
        const schedule: Subject[] = [miniTimetable[0]]; // Only has ENG

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10HIS", // Student doesn't have HIS
          "10MTA"
        );

        expect(solutions).toEqual([]);
      });
    });

    describe("visited state tracking", () => {
      it("should not revisit same schedule state", () => {
        // Create a scenario where naive exploration could loop
        const schedule: Subject[] = [
          miniTimetable[0], // ENG1 AL1
          miniTimetable[2], // MTA1 AL2
          miniTimetable[4], // HIS1 AL3
          miniTimetable[6], // SCI1 AL4
          miniTimetable[7], // GEO1 AL5
          miniTimetable[9], // ART1 AL6
        ];

        // This should complete without infinite loop
        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10ART",
          "10GEO"
        );

        // Should find solutions (exact number depends on available paths)
        expect(solutions).toBeDefined();
      });
    });

    describe("solution structure", () => {
      it("should include drop change as first step", () => {
        // Student has MUS, wants to drop MUS and pick up HIS
        const schedule: Subject[] = [
          miniTimetable[0], // ENG1 AL1
          miniTimetable[2], // MTA1 AL2
          miniTimetable[10], // MUS1 AL3
          miniTimetable[6], // SCI1 AL4
          miniTimetable[7], // GEO1 AL5
          miniTimetable[9], // ART1 AL6
        ];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10MUS",
          "10HIS"
        );

        for (const solution of solutions) {
          expect(solution.changes[0].type).toBe("drop");
          expect(solution.changes[0].fromClass?.code).toBe("10MUS1");
        }
      });

      it("should include enroll change as last step", () => {
        const schedule: Subject[] = [
          miniTimetable[0], // ENG1 AL1
          miniTimetable[2], // MTA1 AL2
          miniTimetable[10], // MUS1 AL3
          miniTimetable[6], // SCI1 AL4
          miniTimetable[7], // GEO1 AL5
          miniTimetable[9], // ART1 AL6
        ];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10MUS",
          "10HIS"
        );

        for (const solution of solutions) {
          const lastChange = solution.changes[solution.changes.length - 1];
          expect(lastChange.type).toBe("enroll");
          expect(lastChange.toClass?.subject).toBe("HIS");
        }
      });

      it("should have new timetable without dropped subject", () => {
        const schedule: Subject[] = [
          miniTimetable[0], // ENG1 AL1
          miniTimetable[2], // MTA1 AL2
          miniTimetable[10], // MUS1 AL3
          miniTimetable[6], // SCI1 AL4
          miniTimetable[7], // GEO1 AL5
          miniTimetable[9], // ART1 AL6
        ];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10MUS",
          "10HIS"
        );

        for (const solution of solutions) {
          const hasMUS = solution.newTimetable.some((s) => s.subject === "MUS");
          expect(hasMUS).toBe(false);
        }
      });

      it("should have new timetable with pickup subject", () => {
        const schedule: Subject[] = [
          miniTimetable[0], // ENG1 AL1
          miniTimetable[2], // MTA1 AL2
          miniTimetable[10], // MUS1 AL3
          miniTimetable[6], // SCI1 AL4
          miniTimetable[7], // GEO1 AL5
          miniTimetable[9], // ART1 AL6
        ];

        const solutions = findSolutions(
          miniTimetable,
          schedule,
          "10MUS",
          "10HIS"
        );

        for (const solution of solutions) {
          const hisCount = solution.newTimetable.filter(
            (s) => s.subject === "HIS"
          ).length;
          expect(hisCount).toBe(1);
        }
      });
    });
  });

  describe("checkCapacity", () => {
    // Master timetable with various capacity states
    const masterTimetable: Subject[] = [
      createSubject({
        code: "10ENG1",
        subject: "ENG",
        allocation: "AL1",
        enrolled: 20,
        capacity: 25,
      }),
      createSubject({
        code: "10ENG2",
        subject: "ENG",
        allocation: "AL3",
        enrolled: 25,
        capacity: 25,
      }), // At capacity
      createSubject({
        code: "10MTA1",
        subject: "MTA",
        allocation: "AL2",
        enrolled: 26,
        capacity: 25,
      }), // Over capacity
      createSubject({
        code: "10HIS1",
        subject: "HIS",
        allocation: "AL3",
        enrolled: 24,
        capacity: 25,
      }),
    ];

    it("should not warn when joining class with available capacity", () => {
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "enroll",
            toClass: masterTimetable[0], // ENG1: 20/25
            description: "Enroll in 10ENG1",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      expect(result.hasCapacityWarning).toBe(false);
      expect(result.capacityWarnings).toHaveLength(0);
    });

    it("should warn when joining class at capacity", () => {
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "enroll",
            toClass: masterTimetable[1], // ENG2: 25/25
            description: "Enroll in 10ENG2",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      expect(result.hasCapacityWarning).toBe(true);
      expect(result.capacityWarnings).toContain("10ENG2");
    });

    it("should warn when joining class over capacity", () => {
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "enroll",
            toClass: masterTimetable[2], // MTA1: 26/25
            description: "Enroll in 10MTA1",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      expect(result.hasCapacityWarning).toBe(true);
      expect(result.capacityWarnings).toContain("10MTA1");
    });

    it("should not warn when leaving an over-capacity class", () => {
      // Student leaves MTA1 (26/25 - over capacity) and joins ENG1 (20/25)
      // Leaving an over-capacity class is beneficial, not a problem
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "rearrange",
            fromClass: masterTimetable[2], // Leaving MTA1 (26/25)
            toClass: masterTimetable[0], // Joining ENG1 (20/25)
            description: "Move from 10MTA1 to 10ENG1",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      // No warning - leaving over-capacity class is good, joining ENG1 has room
      expect(result.hasCapacityWarning).toBe(false);
      expect(result.capacityWarnings).toHaveLength(0);
    });

    it("should account for student leaving a class (frees a spot)", () => {
      // Student is in ENG2 (at capacity 25/25), moves to ENG1, then rejoins ENG2
      // Without the "freed spot" logic, rejoining ENG2 would warn (25+1 > 25)
      // But since student left ENG2, there's now a spot for them
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "rearrange",
            fromClass: masterTimetable[1], // Leaving ENG2 (25/25)
            toClass: masterTimetable[0], // Joining ENG1 (20/25)
            description: "Move from 10ENG2 to 10ENG1",
          },
          {
            type: "rearrange",
            fromClass: masterTimetable[0], // Leaving ENG1
            toClass: masterTimetable[1], // Rejoining ENG2 - should be OK!
            description: "Move from 10ENG1 back to 10ENG2",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      // ENG2 was at 25/25, but student left (+1) then rejoined (-1) = net 0
      // So effective enrolled is still 25, which equals capacity - no warning
      expect(result.hasCapacityWarning).toBe(false);
    });

    it("should handle drop then enroll correctly", () => {
      // Student drops HIS1, then enrolls in ENG2 (at capacity)
      // The student is NOT leaving ENG2, so it's still at capacity
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "drop",
            fromClass: masterTimetable[3], // Dropping HIS1
            description: "Drop 10HIS1",
          },
          {
            type: "enroll",
            toClass: masterTimetable[1], // Joining ENG2 (at capacity)
            description: "Enroll in 10ENG2",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      expect(result.hasCapacityWarning).toBe(true);
      expect(result.capacityWarnings).toContain("10ENG2");
    });

    it("should track multiple capacity warnings", () => {
      const solution: Solution = {
        newTimetable: [],
        changes: [
          {
            type: "drop",
            fromClass: masterTimetable[3],
            description: "Drop 10HIS1",
          },
          {
            type: "rearrange",
            fromClass: masterTimetable[0],
            toClass: masterTimetable[1], // ENG2 at capacity
            description: "Move to 10ENG2",
          },
          {
            type: "enroll",
            toClass: masterTimetable[2], // MTA1 over capacity
            description: "Enroll in 10MTA1",
          },
        ],
        hasCapacityWarning: false,
        capacityWarnings: [],
      };

      const result = checkCapacity(solution, masterTimetable);

      expect(result.hasCapacityWarning).toBe(true);
      expect(result.capacityWarnings).toContain("10ENG2");
      expect(result.capacityWarnings).toContain("10MTA1");
    });
  });

  describe("rankSolutions", () => {
    // Helper to create minimal solutions for ranking tests
    function createSolution(
      hasWarning: boolean,
      changeCount: number
    ): Solution {
      const changes: ClassChange[] = Array(changeCount)
        .fill(null)
        .map((_, i) => ({
          type: "rearrange" as const,
          description: `Change ${i + 1}`,
        }));

      return {
        newTimetable: [],
        changes,
        hasCapacityWarning: hasWarning,
        capacityWarnings: hasWarning ? ["SOME_CLASS"] : [],
      };
    }

    it("should rank solutions without warnings before those with warnings", () => {
      const solutions = [
        createSolution(true, 2), // Warning, 2 changes
        createSolution(false, 3), // No warning, 3 changes
        createSolution(true, 1), // Warning, 1 change
        createSolution(false, 2), // No warning, 2 changes
      ];

      const ranked = rankSolutions(solutions);

      // First two should have no warnings
      expect(ranked[0].hasCapacityWarning).toBe(false);
      expect(ranked[1].hasCapacityWarning).toBe(false);
      // Last two should have warnings
      expect(ranked[2].hasCapacityWarning).toBe(true);
      expect(ranked[3].hasCapacityWarning).toBe(true);
    });

    it("should rank by fewer changes within same warning status", () => {
      const solutions = [
        createSolution(false, 4),
        createSolution(false, 2),
        createSolution(false, 3),
      ];

      const ranked = rankSolutions(solutions);

      expect(ranked[0].changes.length).toBe(2);
      expect(ranked[1].changes.length).toBe(3);
      expect(ranked[2].changes.length).toBe(4);
    });

    it("should rank warnings by fewer changes too", () => {
      const solutions = [
        createSolution(true, 5),
        createSolution(true, 2),
        createSolution(true, 3),
      ];

      const ranked = rankSolutions(solutions);

      expect(ranked[0].changes.length).toBe(2);
      expect(ranked[1].changes.length).toBe(3);
      expect(ranked[2].changes.length).toBe(5);
    });

    it("should not mutate the original array", () => {
      const solutions = [createSolution(true, 2), createSolution(false, 3)];

      const ranked = rankSolutions(solutions);

      // Original should still have warning first
      expect(solutions[0].hasCapacityWarning).toBe(true);
      // Ranked should have no-warning first
      expect(ranked[0].hasCapacityWarning).toBe(false);
    });

    it("should handle empty array", () => {
      const ranked = rankSolutions([]);
      expect(ranked).toEqual([]);
    });

    it("should handle single solution", () => {
      const solutions = [createSolution(false, 2)];
      const ranked = rankSolutions(solutions);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].changes.length).toBe(2);
    });
  });
});
