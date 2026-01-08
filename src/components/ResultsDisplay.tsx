import { useMemo } from "react";
import { ArrowLeft, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SolutionCard } from "@/components/SolutionCard";
import { AlternativeSuggestions } from "@/components/AlternativeSuggestions";
import { RequestCard } from "@/components/RequestCard";
import { TimetableGrid } from "@/components/TimetableGrid";
import { loadTimetable, getMissingSubjectCodes } from "@/lib/storage";
import type { ChangeRequest, Solution, Subject } from "@/types";

interface ResultsDisplayProps {
  request: ChangeRequest | null;
  solutions: Solution[];
  isStale?: boolean;
  onBack: () => void;
  onLabelChange?: (newLabel: string) => void;
  onRerun?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
}

/**
 * Container for displaying algorithm results.
 * Shows ranked SolutionCards if solutions exist, or AlternativeSuggestions if not.
 */
export function ResultsDisplay({
  request,
  solutions,
  isStale = false,
  onBack,
  onLabelChange,
  onRerun,
  onClone,
  onDelete,
}: ResultsDisplayProps) {
  if (!request) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Card>
          <CardHeader className="text-center">
            <div className="text-lg font-semibold">No Request Selected</div>
            <CardDescription>
              Create a new change request to see results
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get the student's original timetable from the saved subject codes
  const timetable = loadTimetable();
  const originalTimetable: Subject[] = timetable
    ? timetable.subjects.filter((s) => request.studentSubjects.includes(s.code))
    : [];

  // Check for subject codes that don't exist in current timetable
  const missingSubjectCodes = useMemo(
    () => getMissingSubjectCodes(request, timetable),
    [timetable, request]
  );

  const allSubjects = timetable?.subjects || [];
  const hasSolutions = solutions.length > 0;
  const allSolutionsOverCapacity =
    hasSolutions && solutions.every((s) => s.hasCapacityWarning);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-5 w-5" />
        All Requests
      </Button>

      {/* Request summary */}
      <RequestCard
        request={request}
        isStale={isStale}
        missingSubjectCodes={missingSubjectCodes}
        hasSolutions={hasSolutions}
        allSolutionsOverCapacity={allSolutionsOverCapacity}
        onLabelChange={onLabelChange}
        onRerun={isStale ? onRerun : undefined}
        onClone={onClone}
        onDelete={onDelete}
      />

      {/* Warning for missing subject codes */}
      {missingSubjectCodes.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Some subjects not found</p>
            <p className="mt-1 text-amber-700">
              The following subject codes were not found in the current
              timetable:{" "}
              <span className="font-mono">
                {missingSubjectCodes.join(", ")}
              </span>
              . Results may be inaccurate.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              Consider cloning this request and updating the student's subjects,
              or re-uploading an older compatible version of the timetable.
            </p>
          </div>
        </div>
      )}

      {hasSolutions ? (
        <>
          <p className="text-sm text-muted-foreground">
            Found {solutions.length} solution
            {solutions.length !== 1 ? "s" : ""}
          </p>

          {solutions.map((solution, index) => (
            <SolutionCard
              key={index}
              solution={solution}
              index={index + 1}
              isRecommended={index === 0 && !solution.hasCapacityWarning}
              originalTimetable={originalTimetable}
              dropSubject={request.dropSubject}
              pickupSubject={request.pickupSubject}
              defaultExpanded={index === 0}
            />
          ))}
        </>
      ) : (
        <>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-lg font-semibold">No Solutions Found</div>
              <CardDescription>
                The requested subject change cannot be accommodated with the
                current timetable configuration.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Show current timetable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <TimetableGrid
                originalTimetable={originalTimetable}
                newTimetable={originalTimetable}
                dropSubject={request.dropSubject}
                pickupSubject={request.pickupSubject}
                mode="old"
                showLegend={false}
              />
            </CardContent>
          </Card>

          <AlternativeSuggestions
            allSubjects={allSubjects}
            studentSchedule={originalTimetable}
            dropSubject={request.dropSubject}
          />
        </>
      )}
    </div>
  );
}
