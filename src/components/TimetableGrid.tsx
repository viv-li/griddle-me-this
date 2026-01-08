import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Subject, AllocationBlock } from "@/types";

interface TimetableGridProps {
  /** The student's original timetable (before changes) */
  originalTimetable: Subject[];
  /** The student's new timetable (after changes) */
  newTimetable: Subject[];
  /** Subject being dropped (level+subject code) */
  dropSubject: string;
  /** Subject being picked up (level+subject code) */
  pickupSubject: string;
  /** Optional title */
  title?: string;
  /** Whether to show the legend (default true) */
  showLegend?: boolean;
  /**
   * Which timetable to display:
   * - "old": Shows original timetable with drops/outgoing rearrangements highlighted
   * - "new": Shows new timetable with adds/incoming rearrangements highlighted
   */
  mode?: "old" | "new";
}

const ALLOCATIONS: AllocationBlock[] = [
  "AL1",
  "AL2",
  "AL3",
  "AL4",
  "AL5",
  "AL6",
];

type CellStatus =
  | "unchanged"
  | "dropped"
  | "added"
  | "rearranged-out"
  | "rearranged-in";

interface GridCell {
  subject: Subject | null;
  status: CellStatus;
}

/**
 * Visual 6x2 grid showing the student's timetable with color-coded changes.
 * - Unchanged: default background
 * - Dropped: red background (shown on old timetable)
 * - Added: green background (shown on new timetable)
 * - Rearranged-out: amber background (shown on old timetable)
 * - Rearranged-in: amber background (shown on new timetable)
 */
export function TimetableGrid({
  originalTimetable,
  newTimetable,
  dropSubject,
  pickupSubject,
  title,
  showLegend = true,
  mode = "new",
}: TimetableGridProps) {
  // Build grids for both old and new timetables
  const { oldGrid, newGrid } = useMemo(() => {
    // Map allocation+semester -> subject for both timetables
    const origMap: Record<string, Subject | null> = {};
    const newMap: Record<string, Subject | null> = {};

    for (const al of ALLOCATIONS) {
      origMap[`${al}-sem1`] = null;
      origMap[`${al}-sem2`] = null;
      newMap[`${al}-sem1`] = null;
      newMap[`${al}-sem2`] = null;
    }

    for (const subject of originalTimetable) {
      if (subject.semester === "both") {
        origMap[`${subject.allocation}-sem1`] = subject;
        origMap[`${subject.allocation}-sem2`] = subject;
      } else {
        origMap[`${subject.allocation}-${subject.semester}`] = subject;
      }
    }

    for (const subject of newTimetable) {
      if (subject.semester === "both") {
        newMap[`${subject.allocation}-sem1`] = subject;
        newMap[`${subject.allocation}-sem2`] = subject;
      } else {
        newMap[`${subject.allocation}-${subject.semester}`] = subject;
      }
    }

    // Build both grids
    const oGrid: Record<string, GridCell> = {};
    const nGrid: Record<string, GridCell> = {};

    for (const al of ALLOCATIONS) {
      for (const sem of ["sem1", "sem2"] as const) {
        const key = `${al}-${sem}`;
        const origSubject = origMap[key];
        const newSubject = newMap[key];

        // Default: unchanged
        let oldStatus: CellStatus = "unchanged";
        let newStatus: CellStatus = "unchanged";

        if (origSubject && newSubject) {
          if (origSubject.code !== newSubject.code) {
            // Subject changed in this slot
            const origLevelSubject = `${origSubject.level}${origSubject.subject}`;
            const newLevelSubject = `${newSubject.level}${newSubject.subject}`;

            if (origLevelSubject === dropSubject) {
              // Original was the dropped subject
              oldStatus = "dropped";
            } else {
              // Original subject moved out (rearranged)
              oldStatus = "rearranged-out";
            }

            if (newLevelSubject === pickupSubject) {
              // New is the pickup subject
              newStatus = "added";
            } else {
              // New subject moved in (rearranged)
              newStatus = "rearranged-in";
            }
          }
        } else if (origSubject && !newSubject) {
          // Slot emptied (dropped)
          oldStatus = "dropped";
        } else if (!origSubject && newSubject) {
          // Slot filled (added)
          newStatus = "added";
        }

        oGrid[key] = { subject: origSubject, status: oldStatus };
        nGrid[key] = { subject: newSubject, status: newStatus };
      }
    }

    return { oldGrid: oGrid, newGrid: nGrid };
  }, [originalTimetable, newTimetable, dropSubject, pickupSubject]);

  const grid = mode === "old" ? oldGrid : newGrid;

  const getCellClasses = (status: CellStatus) => {
    switch (status) {
      case "dropped":
        return "bg-red-100 text-red-800 border-red-200";
      case "added":
        return "bg-green-100 text-green-800 border-green-200";
      case "rearranged-out":
      case "rearranged-in":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-muted/30";
    }
  };

  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border bg-muted/50 p-1.5 text-left font-medium w-10"></th>
              {ALLOCATIONS.map((al) => (
                <th
                  key={al}
                  className="border bg-muted/50 p-1.5 text-center font-medium text-xs"
                >
                  {al}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["sem1", "sem2"] as const).map((sem) => (
              <tr key={sem}>
                <td className="border bg-muted/30 p-1.5 font-medium text-muted-foreground text-center text-xs">
                  {sem === "sem1" ? "S1" : "S2"}
                </td>
                {ALLOCATIONS.map((al) => {
                  const key = `${al}-${sem}`;
                  const cell = grid[key];
                  return (
                    <td
                      key={key}
                      className={cn(
                        "border p-1.5 text-center font-mono text-xs",
                        getCellClasses(cell.status)
                      )}
                    >
                      {cell.subject?.code || "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {mode === "old" ? (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                <span>Dropping</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
                <span>Moving out</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                <span>Adding</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
                <span>Moving in</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
