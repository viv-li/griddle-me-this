import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditableLabel } from "@/components/EditableLabel";
import type { ChangeRequest } from "@/types";

interface RequestCardProps {
  /** The change request to display */
  request: ChangeRequest;
  /** Whether the request data is stale (timetable has been updated) */
  isStale?: boolean;
  /** Subject codes that don't exist in current timetable */
  missingSubjectCodes?: string[];
  /** Whether solutions were found */
  hasSolutions?: boolean;
  /** Whether to show rerun success indicator */
  rerunSuccess?: boolean;
  /** Callback when the card is clicked */
  onClick?: () => void;
  /** Callback when the label is changed */
  onLabelChange?: (newLabel: string) => void;
  /** Callback when rerun is clicked (for stale requests) */
  onRerun?: () => void;
  /** Callback when clone is clicked */
  onClone?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
}

/**
 * Shared card component for displaying a change request.
 * Used in both RequestHistory and ResultsDisplay.
 */
export function RequestCard({
  request,
  isStale = false,
  missingSubjectCodes = [],
  hasSolutions = false,
  rerunSuccess = false,
  onClick,
  onLabelChange,
  onRerun,
  onClone,
  onDelete,
}: RequestCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasMissingSubjects = missingSubjectCodes.length > 0;
  const canRerun = isStale && !hasMissingSubjects;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className={
          onClick ? "cursor-pointer transition-colors hover:bg-muted/50" : ""
        }
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Solution status icon - always visible on left */}
            <div className="shrink-0">
              {hasSolutions ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              )}
            </div>

            {/* Content - center/grows */}
            <div className="flex-1 min-w-0">
              {onLabelChange ? (
                <EditableLabel
                  value={request.label || ""}
                  placeholder="Untitled Request"
                  onSave={onLabelChange}
                />
              ) : (
                <span className="font-medium truncate">
                  {request.label || "Untitled Request"}
                </span>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {request.requestType === "class-change" ? (
                  <>
                    Find alternative class for{" "}
                    <span className="font-mono">{request.dropSubject}</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono">{request.dropSubject}</span>
                    {" → "}
                    <span className="font-mono">{request.pickupSubject}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Created {formatDate(request.createdAt)}
              </p>
            </div>

            {/* Action buttons - right side */}
            <div className="flex items-center gap-1 shrink-0">
              {rerunSuccess && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-300 bg-green-50 shrink-0"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Updated
                </Badge>
              )}
              {hasMissingSubjects && !rerunSuccess && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-300 bg-red-50 shrink-0 cursor-help"
                    >
                      Incompatible
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Request incompatible with current timetable. Missing
                      subjects:{" "}
                      <span className="font-mono">
                        {missingSubjectCodes.join(", ")}
                      </span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isStale && !hasMissingSubjects && !rerunSuccess && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300 bg-amber-50 shrink-0"
                >
                  Outdated
                </Badge>
              )}
              {canRerun && !rerunSuccess && onRerun && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRerun();
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rerun on latest data</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onClone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClone();
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clone request</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete request</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {request.label || "this request"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete?.();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
