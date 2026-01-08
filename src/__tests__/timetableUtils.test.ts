/**
 * Tests for timetable utility functions
 */

import {
  getLevelSubjectCode,
  findSubjectByCode,
  findSubjectClasses,
  findSubjectsInAllocation,
  hasCapacityAvailable,
} from "../lib/timetableUtils";
import type { Subject } from "../types";

// Sample subjects for testing
const sampleSubjects: Subject[] = [
  {
    allocation: "AL1",
    code: "10ENG3",
    level: 10,
    subject: "ENG",
    class: 3,
    semester: "both",
    enrolled: 26,
    capacity: 25,
  },
  {
    allocation: "AL1",
    code: "10ENG5",
    level: 10,
    subject: "ENG",
    class: 5,
    semester: "both",
    enrolled: 20,
    capacity: 25,
  },
  {
    allocation: "AL2",
    code: "10MTA2",
    level: 10,
    subject: "MTA",
    class: 2,
    semester: "both",
    enrolled: 25,
    capacity: 25,
  },
  {
    allocation: "AL3",
    code: "11HIM6",
    level: 11,
    subject: "HIM",
    class: 6,
    semester: "both",
    enrolled: 23,
    capacity: 25,
  },
  {
    allocation: "AL1",
    code: "10HIS7",
    level: 10,
    subject: "HIS",
    class: 7,
    semester: "sem1",
    enrolled: 26,
    capacity: 25,
  },
  {
    allocation: "AL1",
    code: "10HIS8",
    level: 10,
    subject: "HIS",
    class: 8,
    semester: "sem2",
    enrolled: 27,
    capacity: 25,
  },
  {
    allocation: "AL1",
    code: "11EAL11",
    level: 11,
    subject: "EAL",
    class: 11,
    semester: "both",
    enrolled: 0,
    capacity: 25,
  },
];

describe("timetableUtils", () => {
  describe("getLevelSubjectCode", () => {
    it("should extract level and subject from class code", () => {
      expect(getLevelSubjectCode("10ENG1")).toBe("10ENG");
      expect(getLevelSubjectCode("11HIM6")).toBe("11HIM");
      expect(getLevelSubjectCode("10MTA2")).toBe("10MTA");
    });

    it("should handle multi-digit class numbers", () => {
      expect(getLevelSubjectCode("11EAL11")).toBe("11EAL");
    });

    it("should return original string if pattern doesn't match", () => {
      expect(getLevelSubjectCode("invalid")).toBe("invalid");
      expect(getLevelSubjectCode("")).toBe("");
    });
  });

  describe("findSubjectByCode", () => {
    it("should find existing subject by code", () => {
      const subject = findSubjectByCode(sampleSubjects, "10ENG3");

      expect(subject).toBeDefined();
      expect(subject?.code).toBe("10ENG3");
      expect(subject?.level).toBe(10);
      expect(subject?.subject).toBe("ENG");
    });

    it("should return undefined for non-existent code", () => {
      const subject = findSubjectByCode(sampleSubjects, "99XXX99");

      expect(subject).toBeUndefined();
    });

    it("should work with empty array", () => {
      const subject = findSubjectByCode([], "10ENG1");

      expect(subject).toBeUndefined();
    });
  });

  describe("findSubjectClasses", () => {
    it("should find all classes of a subject", () => {
      const engClasses = findSubjectClasses(sampleSubjects, "10ENG");

      expect(engClasses.length).toBe(2);
      engClasses.forEach((subject) => {
        expect(subject.level).toBe(10);
        expect(subject.subject).toBe("ENG");
      });
    });

    it("should return empty array for non-existent subject", () => {
      const classes = findSubjectClasses(sampleSubjects, "99XXX");

      expect(classes).toEqual([]);
    });

    it("should filter by level correctly", () => {
      // 10HIS exists, but 11HIS shouldn't find those
      const his11 = findSubjectClasses(sampleSubjects, "11HIS");
      expect(his11).toEqual([]);

      const his10 = findSubjectClasses(sampleSubjects, "10HIS");
      expect(his10.length).toBe(2);
    });

    it("should work with empty array", () => {
      const classes = findSubjectClasses([], "10ENG");

      expect(classes).toEqual([]);
    });
  });

  describe("findSubjectsInAllocation", () => {
    it("should find all subjects in an allocation block", () => {
      const al1Subjects = findSubjectsInAllocation(sampleSubjects, "AL1");

      expect(al1Subjects.length).toBe(5);
      al1Subjects.forEach((subject) => {
        expect(subject.allocation).toBe("AL1");
      });
    });

    it("should return empty array for allocation with no subjects", () => {
      const al6Subjects = findSubjectsInAllocation(sampleSubjects, "AL6");

      expect(al6Subjects).toEqual([]);
    });

    it("should work with empty array", () => {
      const subjects = findSubjectsInAllocation([], "AL1");

      expect(subjects).toEqual([]);
    });
  });

  describe("hasCapacityAvailable", () => {
    it("should return true when capacity available", () => {
      const subject: Subject = {
        allocation: "AL1",
        code: "10TST1",
        level: 10,
        subject: "TST",
        class: 1,
        semester: "both",
        enrolled: 15,
        capacity: 25,
      };

      expect(hasCapacityAvailable(subject)).toBe(true);
    });

    it("should return false when at capacity", () => {
      const subject: Subject = {
        allocation: "AL1",
        code: "10TST1",
        level: 10,
        subject: "TST",
        class: 1,
        semester: "both",
        enrolled: 25,
        capacity: 25,
      };

      expect(hasCapacityAvailable(subject)).toBe(false);
    });

    it("should return false when over capacity", () => {
      const subject: Subject = {
        allocation: "AL1",
        code: "10TST1",
        level: 10,
        subject: "TST",
        class: 1,
        semester: "both",
        enrolled: 27,
        capacity: 25,
      };

      expect(hasCapacityAvailable(subject)).toBe(false);
    });
  });
});
