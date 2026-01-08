import { useEffect, useState } from "react";
import { History, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadRequests, loadTimetable, deleteRequest } from "@/lib/storage";
import { findSolutions, rankSolutions } from "@/lib/timetableAlgorithm";
import type { ChangeRequest, Solution } from "@/types";

interface RequestHistoryProps {
  onSelectRequest: (request: ChangeRequest, solutions: Solution[]) => void;
  onBack: () => void;
}

/**
 * Component for viewing past change requests.
 * Shows request status and allows viewing/rerunning results.
 */
export function RequestHistory({ onSelectRequest }: RequestHistoryProps) {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [timetableVersion, setTimetableVersion] = useState<string | null>(null);

  useEffect(() => {
    const savedRequests = loadRequests();
    setRequests(savedRequests.reverse()); // Most recent first

    const timetable = loadTimetable();
    if (timetable) {
      setTimetableVersion(timetable.uploadedAt);
    }
  }, []);

  const handleSelectRequest = (request: ChangeRequest) => {
    const timetable = loadTimetable();
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

  const handleDelete = (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    deleteRequest(requestId);
    setRequests(requests.filter((r) => r.id !== requestId));
  };

  const isStale = (request: ChangeRequest) => {
    return timetableVersion && request.timetableVersion !== timetableVersion;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <Card
              key={request.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleSelectRequest(request)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {request.label || "Untitled Request"}
                      </p>
                      <Badge
                        variant={
                          request.status === "applied" ? "default" : "secondary"
                        }
                      >
                        {request.status}
                      </Badge>
                      {isStale(request) && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Stale
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{request.dropSubject}</span>
                      {" → "}
                      <span className="font-mono">{request.pickupSubject}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRequest(request);
                      }}
                      title="View results"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(e, request.id)}
                      title="Delete request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
