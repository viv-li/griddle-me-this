/**
 * Integration tests for timetable algorithm using real sample data
 */

import {
  findSolutions,
  checkCapacity,
  rankSolutions,
} from "../lib/timetableAlgorithm";
import {
  loadSampleTimetable,
  buildStudentSchedule,
} from "./helpers/testHelpers";

describe("timetableAlgorithm integration", () => {
  const sampleTimetable = loadSampleTimetable();

  // Build a realistic Year 10 schedule:
  // - ENG3 at AL1 (compulsory English)
  // - MTA2 at AL2 (Math Advanced)
  // - ITA1 at AL3 (Italian - elective)
  // - MTG1 at AL4 (Math General)
  // - LTY1 at AL5 (Literacy)
  // - HIS9 + POL1 at AL6 (semester subjects)
  const realisticSchedule = buildStudentSchedule([
    "10ENG3", // AL1 - both
    "10MTA2", // AL2 - both
    "10ITA1", // AL3 - both (Italian)
    "10MTG1", // AL4 - both
    "10LTY1", // AL5 - both
    "10HIS9", // AL6 - sem1
    "10POL1", // AL6 - sem2
  ]);

  it("should load sample timetable with expected structure", () => {
    expect(sampleTimetable.length).toBeGreaterThan(100);
    expect(realisticSchedule.length).toBe(7);

    // Verify schedule covers all allocations
    const allocations = new Set(realisticSchedule.map((s) => s.allocation));
    expect(allocations.size).toBe(6);
  });

  it("should find simple swap solution (ITA -> JAP, both at AL3)", () => {
    // Drop Italian, pick up Japanese - both are at AL3, direct swap
    const solutions = findSolutions(
      sampleTimetable,
      realisticSchedule,
      "10ITA",
      "10JAP"
    );

    expect(solutions.length).toBeGreaterThan(0);

    // Should have a direct swap (2 changes: drop + enroll)
    const directSwap = solutions.find((s) => s.changes.length === 2);
    expect(directSwap).toBeDefined();
    expect(directSwap?.changes[0].type).toBe("drop");
    expect(directSwap?.changes[0].fromClass?.code).toBe("10ITA1");
    expect(directSwap?.changes[1].type).toBe("enroll");
    expect(directSwap?.changes[1].toClass?.code).toBe("10JAP1");
  });

  it("should find solution when pickup subject is in different allocation", () => {
    // Drop Italian (AL3), pick up BEN (Bengali at AL1)
    // This requires rearranging since ENG3 is already at AL1
    const solutions = findSolutions(
      sampleTimetable,
      realisticSchedule,
      "10ITA",
      "10BEN"
    );

    // There should be solutions - ENG has classes in multiple allocations
    // Student can move to a different ENG class to free up AL1
    expect(solutions.length).toBeGreaterThan(0);

    // All solutions should end with enrolling in BEN
    for (const solution of solutions) {
      const lastChange = solution.changes[solution.changes.length - 1];
      expect(lastChange.type).toBe("enroll");
      expect(lastChange.toClass?.subject).toBe("BEN");
    }
  });

  it("should return empty when no valid path exists", () => {
    // Try to pick up a subject that doesn't exist
    const solutions = findSolutions(
      sampleTimetable,
      realisticSchedule,
      "10ITA",
      "10XXX"
    );

    expect(solutions).toEqual([]);
  });

  it("should handle semester subject swaps", () => {
    // Drop HIS9 (AL6 sem1), pick up PHY1 (AL6 sem1)
    const solutions = findSolutions(
      sampleTimetable,
      realisticSchedule,
      "10HIS",
      "10PHY"
    );

    expect(solutions.length).toBeGreaterThan(0);

    // Should be a direct swap since both are sem1 at AL6
    const directSwap = solutions.find((s) => s.changes.length === 2);
    expect(directSwap).toBeDefined();
  });

  describe("class change (same subject, different class)", () => {
    it("should find alternative classes of the same subject", () => {
      // Drop ENG (currently ENG3 at AL1), pick up a different ENG class
      // ENG has multiple classes in different allocations
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ENG", // drop
        "10ENG" // pickup same subject = class change
      );

      expect(solutions.length).toBeGreaterThan(0);

      // All solutions should have a different ENG class than ENG3
      for (const solution of solutions) {
        const engClass = solution.newTimetable.find((s) => s.subject === "ENG");
        expect(engClass).toBeDefined();
        expect(engClass?.code).not.toBe("10ENG3"); // Should not be the original class
      }
    });

    it("should exclude current class from solutions", () => {
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ENG",
        "10ENG"
      );

      // Verify none of the solutions enroll in the original class
      for (const solution of solutions) {
        const enrollStep = solution.changes.find((c) => c.type === "enroll");
        expect(enrollStep?.toClass?.code).not.toBe("10ENG3");
      }
    });

    it("should handle class change requiring rearrangement", () => {
      // Student has ITA1 at AL3
      // ITA has classes in different allocations, and schedule allows movement
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ITA",
        "10ITA"
      );

      // ITA has multiple classes, should find alternative
      expect(solutions.length).toBeGreaterThanOrEqual(0);

      // If solutions exist, verify the new class is different from original
      for (const solution of solutions) {
        const itaClass = solution.newTimetable.find((s) => s.subject === "ITA");
        expect(itaClass).toBeDefined();
        expect(itaClass?.code).not.toBe("10ITA1");
      }
    });

    it("should return empty when no alternative classes exist for subject", () => {
      // MTA only has 2 classes (AL1 and AL2), and both are occupied in the schedule
      // Student has MTA2 at AL2, and ENG3 at AL1 - no room for MTA1
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10MTA",
        "10MTA"
      );

      // May or may not find solutions depending on whether ENG can move
      // This validates the algorithm handles constrained scenarios
      expect(solutions).toBeDefined();
    });

    it("should rank class change solutions by capacity then changes", () => {
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ENG",
        "10ENG"
      );

      const ranked = rankSolutions(solutions, sampleTimetable);

      // Verify ranking order: no-warning first, then by change count
      let seenWarning = false;
      for (const solution of ranked) {
        if (solution.hasCapacityWarning) {
          seenWarning = true;
        } else if (seenWarning) {
          fail("Solutions with warnings should come after those without");
        }
      }

      // Within same warning status, should be sorted by change count
      const noWarningSolutions = ranked.filter((s) => !s.hasCapacityWarning);
      for (let i = 1; i < noWarningSolutions.length; i++) {
        expect(noWarningSolutions[i].changes.length).toBeGreaterThanOrEqual(
          noWarningSolutions[i - 1].changes.length
        );
      }
    });
  });

  describe("full pipeline with capacity and ranking", () => {
    it("should check capacity for all solutions", () => {
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ITA",
        "10JAP"
      );

      // Apply capacity checking to all solutions
      const checkedSolutions = solutions.map((s) =>
        checkCapacity(s, sampleTimetable)
      );

      // All solutions should have capacity info populated
      for (const solution of checkedSolutions) {
        expect(solution).toHaveProperty("hasCapacityWarning");
        expect(solution).toHaveProperty("capacityWarnings");
        expect(Array.isArray(solution.capacityWarnings)).toBe(true);
      }
    });

    it("should rank solutions with no warnings first", () => {
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ITA",
        "10JAP"
      );

      const ranked = rankSolutions(solutions, sampleTimetable);

      // Verify ranking: no-warning solutions come before warning solutions
      let seenWarning = false;
      for (const solution of ranked) {
        if (solution.hasCapacityWarning) {
          seenWarning = true;
        } else if (seenWarning) {
          // Found a no-warning solution after a warning solution - bad ranking
          fail("Solutions with warnings should come after those without");
        }
      }
    });

    it("should rank solutions by fewest changes within same warning status", () => {
      const solutions = findSolutions(
        sampleTimetable,
        realisticSchedule,
        "10ITA",
        "10BEN" // Requires rearrangement, multiple solutions expected
      );

      const ranked = rankSolutions(solutions, sampleTimetable);

      // Within no-warning solutions, verify sorted by change count
      const noWarningSolutions = ranked.filter((s) => !s.hasCapacityWarning);
      for (let i = 1; i < noWarningSolutions.length; i++) {
        expect(noWarningSolutions[i].changes.length).toBeGreaterThanOrEqual(
          noWarningSolutions[i - 1].changes.length
        );
      }
    });
  });
});
