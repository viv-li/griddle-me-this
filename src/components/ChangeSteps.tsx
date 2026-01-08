import { LogOut, LogIn, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ClassChange, Subject } from "@/types";

/** Check if a change results in over capacity */
function isOverCapacity(change: ClassChange): boolean {
  if (!change.toClass) return false;
  return change.toClass.enrolled + 1 > change.toClass.capacity;
}

interface ChangeStepsProps {
  /** List of changes to display */
  changes: ClassChange[];
}

/** Renders a subject code in monospace styling */
function SubjectCode({
  code,
  allocation,
}: {
  code: string;
  allocation: string;
}) {
  return (
    <>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
        {code}
      </code>
      <span className="text-muted-foreground">({allocation})</span>
    </>
  );
}

/** Renders a capacity badge showing enrolled/capacity after the change */
function CapacityBadge({ subject }: { subject: Subject }) {
  const { enrolled, capacity } = subject;
  // After this change, enrollment will increase by 1
  const newEnrolled = enrolled + 1;
  const isOverCapacity = newEnrolled > capacity;

  return (
    <Badge
      variant={isOverCapacity ? "outline" : "secondary"}
      className={cn(
        "font-mono text-xs",
        isOverCapacity && "text-amber-600 border-amber-300"
      )}
    >
      {newEnrolled}/{capacity}
    </Badge>
  );
}

/** Renders the change description with subject codes in monospace */
function ChangeDescription({ change }: { change: ClassChange }) {
  switch (change.type) {
    case "drop":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          Drop{" "}
          <SubjectCode
            code={change.fromClass!.code}
            allocation={change.fromClass!.allocation}
          />
        </span>
      );
    case "enroll":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          Enroll in{" "}
          <SubjectCode
            code={change.toClass!.code}
            allocation={change.toClass!.allocation}
          />
        </span>
      );
    case "rearrange":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          Move from{" "}
          <SubjectCode
            code={change.fromClass!.code}
            allocation={change.fromClass!.allocation}
          />{" "}
          to{" "}
          <SubjectCode
            code={change.toClass!.code}
            allocation={change.toClass!.allocation}
          />
        </span>
      );
  }
}

/**
 * Displays a numbered list of steps required to implement a solution.
 */
export function ChangeSteps({ changes }: ChangeStepsProps) {
  const getIcon = (type: ClassChange["type"]) => {
    switch (type) {
      case "drop":
        return <LogOut className="h-4 w-4 text-red-500" />;
      case "enroll":
        return <LogIn className="h-4 w-4 text-green-500" />;
      case "rearrange":
        return <ArrowRight className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <ol className="space-y-2">
      {changes.map((change, index) => {
        const overCapacity = isOverCapacity(change);
        return (
          <li
            key={index}
            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {index + 1}
            </span>
            <div className="flex items-center gap-2">
              {getIcon(change.type)}
              <ChangeDescription change={change} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {change.toClass && <CapacityBadge subject={change.toClass} />}
              {overCapacity && (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
