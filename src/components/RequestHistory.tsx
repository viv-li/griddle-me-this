import { useEffect, useState, useMemo } from "react";
import { History } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestCard } from "@/components/RequestCard";
import {
  loadRequests,
  loadTimetable,
  deleteRequest,
  updateRequest,
} from "@/lib/storage";
import { findSolutions, rankSolutions } from "@/lib/timetableAlgorithm";
import type { ChangeRequest, Solution, TimetableData } from "@/types";

interface RequestHistoryProps {
  onSelectRequest: (request: ChangeRequest, solutions: Solution[]) => void;
  onCloneRequest: (request: ChangeRequest) => void;
  onBack: () => void;
}

/**
 * Component for viewing past change requests.
 * Shows request status and allows viewing/rerunning results.
 */
export function RequestHistory({
  onSelectRequest,
  onCloneRequest,
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
    if (!timetable) return new Map<string, boolean>();

    const status = new Map<string, boolean>();
    for (const request of requests) {
      const studentSchedule = timetable.subjects.filter((s) =>
        request.studentSubjects.includes(s.code)
      );
      const solutions = findSolutions(
        timetable.subjects,
        studentSchedule,
        request.dropSubject,
        request.pickupSubject
      );
      status.set(request.id, solutions.length > 0);
    }
    return status;
  }, [requests, timetable]);

  const handleSelectRequest = (request: ChangeRequest) => {
    if (!timetable) return;

    // Get the student's schedule from the saved subject codes
    const studentSchedule = timetable.subjects.filter((s) =>
      request.studentSubjects.includes(s.code)
    );

    // Rerun the algorithm with current timetable data
    const solutions = findSolutions(
      timetable.subjects,
      studentSchedule,
      request.dropSubject,
      request.pickupSubject
    );

    const rankedSolutions = rankSolutions(solutions);
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

    // Show success indicator temporarily
    setRerunSuccessId(request.id);
    setTimeout(() => setRerunSuccessId(null), 2000);
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

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No change requests yet.</p>
            <p className="text-sm mt-1">Create a new request to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isStale={isStale(request)}
              hasSolutions={solutionStatus.get(request.id) ?? false}
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
          ))}
        </div>
      )}
    </div>
  );
}
