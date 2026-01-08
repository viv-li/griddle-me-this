import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChangeRequest, Solution } from "@/types";

interface ResultsDisplayProps {
  request: ChangeRequest | null;
  solutions: Solution[];
  onBack: () => void;
}

/**
 * Component for displaying algorithm results.
 * Shows solutions with change steps and capacity warnings.
 * Full implementation in Phase 4.
 */
export function ResultsDisplay({
  request,
  solutions,
  onBack,
}: ResultsDisplayProps) {
  if (!request) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No Request Selected</CardTitle>
            <CardDescription>
              Create a new change request to see results
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasSolutions = solutions.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        All Requests
      </Button>

      {/* Request summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {request.label || "Change Request"}
                <Badge
                  variant={
                    request.status === "applied" ? "default" : "secondary"
                  }
                >
                  {request.status}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Drop{" "}
                <span className="font-mono font-medium">
                  {request.dropSubject}
                </span>
                {" → "}
                Pick up{" "}
                <span className="font-mono font-medium">
                  {request.pickupSubject}
                </span>
              </CardDescription>
            </div>
            {hasSolutions ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {hasSolutions ? (
        <>
          <p className="text-sm text-muted-foreground">
            Found {solutions.length} solution{solutions.length !== 1 ? "s" : ""}
          </p>

          {solutions.map((solution, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Solution {index + 1}
                      {solution.hasCapacityWarning && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Capacity Warning
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {solution.changes.length} change
                      {solution.changes.length !== 1 ? "s" : ""} required
                    </CardDescription>
                  </div>
                  {index === 0 && !solution.hasCapacityWarning && (
                    <Badge className="bg-green-600">Recommended</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Change steps */}
                <div className="space-y-2">
                  {solution.changes.map((change, changeIndex) => (
                    <div
                      key={changeIndex}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {changeIndex + 1}
                      </span>
                      <span>{change.description}</span>
                    </div>
                  ))}
                </div>

                {/* Capacity warnings */}
                {solution.capacityWarnings.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                    <p className="font-medium flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Classes at capacity:
                    </p>
                    <p className="mt-1 font-mono text-xs">
                      {solution.capacityWarnings.join(", ")}
                    </p>
                  </div>
                )}

                {/* Accept button placeholder - Phase 5 */}
                <Button className="w-full" variant="outline">
                  Accept Solution (Phase 5)
                </Button>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>No Solutions Found</CardTitle>
            <CardDescription>
              The requested subject change cannot be accommodated with the
              current timetable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              [Alternative suggestions will be shown here - Phase 4.4]
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
