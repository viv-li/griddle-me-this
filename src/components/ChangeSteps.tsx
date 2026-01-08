import { LogOut, LogIn, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassChange } from "@/types";

interface ChangeStepsProps {
  /** List of changes to display */
  changes: ClassChange[];
  /** Class codes that have capacity warnings */
  capacityWarnings: string[];
}

/**
 * Displays a numbered list of steps required to implement a solution.
 */
export function ChangeSteps({ changes, capacityWarnings }: ChangeStepsProps) {
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

  const hasWarning = (change: ClassChange) => {
    if (change.toClass && capacityWarnings.includes(change.toClass.code)) {
      return true;
    }
    return false;
  };

  return (
    <ol className="space-y-2">
      {changes.map((change, index) => (
        <li
          key={index}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 text-sm",
            hasWarning(change) && "border-amber-300 bg-amber-50"
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {index + 1}
          </span>
          <div className="flex items-center gap-2">
            {getIcon(change.type)}
            <span>{change.description}</span>
          </div>
          {hasWarning(change) && (
            <AlertTriangle className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
          )}
        </li>
      ))}
    </ol>
  );
}
