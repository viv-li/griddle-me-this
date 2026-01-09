import { useEffect, useState, useMemo } from "react";
import { History, Plus, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import {
  loadRequests,
  loadTimetable,
  deleteRequest,
  updateRequest,
  getMissingSubjectCodes,
} from "@/lib/storage";
import { findSolutions, rankSolutions } from "@/lib/timetableAlgorithm";
import type { ChangeRequest, Solution, TimetableData } from "@/types";

interface RequestHistoryProps {
  onSelectRequest: (request: ChangeRequest, solutions: Solution[]) => void;
  onCloneRequest: (request: ChangeRequest) => void;
  /** Callback to navigate to new request page */
  onNewRequest: () => void;
  /** Whether a timetable has been uploaded */
  hasTimetable?: boolean;
  /** Callback to navigate to upload page */
  onGoToUpload?: () => void;
}

/**
 * Component for viewing past change requests.
 * Shows request status and allows viewing/rerunning results.
 */
export function RequestHistory({
  onSelectRequest,
  onCloneRequest,
  onNewRequest,
  hasTimetable = true,
  onGoToUpload,
}: RequestHistoryProps) {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [rerunSuccessId, setRerunSuccessId] = useState<string | null>(null);

  useEffect(() => {
    const savedRequests = loadRequests();
    setRequests(savedRequests.reverse()); // Most recent first
    setTimetable(loadTimetable());
  }, []);

  // Compute solution status for each request
  const solutionStatus = useMemo(() => {
    if (!timetable)
      return new Map<
        string,
        { hasSolutions: boolean; allOverCapacity: boolean }
      >();

    const status = new Map<
      string,
      { hasSolutions: boolean; allOverCapacity: boolean }
    >();
    for (const request of requests) {
      const studentSchedule = timetable.subjects.filter((s) =>
        request.studentSubjects.includes(s.code)
      );
      const solutions = findSolutions(
        timetable.subjects,
        studentSchedule,
        request.dropSubject,
        request.pickupSubjects
      );
      const rankedSolutions = rankSolutions(solutions, timetable.subjects);
      const hasSolutions = rankedSolutions.length > 0;
      const allOverCapacity =
        hasSolutions && rankedSolutions.every((s) => s.hasCapacityWarning);
      status.set(request.id, { hasSolutions, allOverCapacity });
    }
    return status;
  }, [requests, timetable]);

  const handleSelectRequest = (request: ChangeRequest) => {
    if (!timetable) return;

    // Clear the rerun success indicator when viewing the request
    if (rerunSuccessId === request.id) {
      setRerunSuccessId(null);
    }

    // Get the student's schedule from the saved subject codes
    const studentSchedule = timetable.subjects.filter((s) =>
      request.studentSubjects.includes(s.code)
    );

    // Rerun the algorithm with current timetable data
    const solutions = findSolutions(
      timetable.subjects,
      studentSchedule,
      request.dropSubject,
      request.pickupSubjects
    );

    const rankedSolutions = rankSolutions(solutions, timetable.subjects);
    onSelectRequest(request, rankedSolutions);
  };

  const handleRerun = (request: ChangeRequest) => {
    if (!timetable) return;

    // Update the request's timetable version in storage
    updateRequest(request.id, { timetableVersion: timetable.uploadedAt });

    // Update local state - request is no longer stale
    const updatedRequest = {
      ...request,
      timetableVersion: timetable.uploadedAt,
    };
    setRequests(
      requests.map((r) => (r.id === request.id ? updatedRequest : r))
    );

    // Show success indicator (cleared when user views the request)
    setRerunSuccessId(request.id);
  };

  const handleLabelChange = (requestId: string, newLabel: string) => {
    updateRequest(requestId, { label: newLabel || undefined });
    setRequests(
      requests.map((r) =>
        r.id === requestId ? { ...r, label: newLabel || undefined } : r
      )
    );
  };

  const handleDelete = (requestId: string) => {
    deleteRequest(requestId);
    setRequests(requests.filter((r) => r.id !== requestId));
  };

  const isStale = (request: ChangeRequest) => {
    return (
      timetable !== null && request.timetableVersion !== timetable.uploadedAt
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            View and manage your change requests
          </CardDescription>
        </CardHeader>
      </Card>

      {!hasTimetable ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            {/* Line illustration of a timetable grid */}
            <svg
              viewBox="0 0 120 80"
              className="mx-auto h-20 w-32 text-muted-foreground/40 dark:text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="10" y="10" width="100" height="60" rx="4" />
              <line x1="10" y1="22" x2="110" y2="22" />
              <line x1="30" y1="10" x2="30" y2="70" />
              <line x1="50" y1="22" x2="50" y2="70" />
              <line x1="70" y1="22" x2="70" y2="70" />
              <line x1="90" y1="22" x2="90" y2="70" />
              <line x1="10" y1="46" x2="110" y2="46" />
              <rect x="53" y="25" width="15" height="18" rx="2" className="fill-primary/20 stroke-primary" />
              <rect x="73" y="49" width="15" height="18" rx="2" className="fill-primary/20 stroke-primary" />
            </svg>
            <div>
              <p className="font-medium">No timetable loaded</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a timetable first to create and view change requests.
              </p>
            </div>
            {onGoToUpload && (
              <Button onClick={onGoToUpload}>
                <Upload className="h-4 w-4" />
                Upload Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No change requests yet.</p>
            <Button onClick={onNewRequest}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const missingCodes = getMissingSubjectCodes(request, timetable);
            return (
              <RequestCard
                key={request.id}
                request={request}
                isStale={isStale(request)}
                missingSubjectCodes={missingCodes}
                hasSolutions={
                  solutionStatus.get(request.id)?.hasSolutions ?? false
                }
                allSolutionsOverCapacity={
                  solutionStatus.get(request.id)?.allOverCapacity ?? false
                }
                rerunSuccess={rerunSuccessId === request.id}
                onClick={() => handleSelectRequest(request)}
                onLabelChange={(newLabel) =>
                  handleLabelChange(request.id, newLabel)
                }
                onRerun={
                  isStale(request) ? () => handleRerun(request) : undefined
                }
                onClone={() => onCloneRequest(request)}
                onDelete={() => handleDelete(request.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
