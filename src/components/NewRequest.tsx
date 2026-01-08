import { FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NewRequestProps {
  onSubmit: () => void;
}

/**
 * Placeholder component for creating a new change request.
 * Combines StudentSubjectInput and ChangeRequestForm (Phase 3.2-3.3).
 */
export function NewRequest({ onSubmit }: NewRequestProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileEdit className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>New Change Request</CardTitle>
        <CardDescription>
          Enter student subjects and specify the change request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Subjects</label>
          <p className="text-sm text-muted-foreground">
            [Autocomplete input - Phase 3.2]
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Drop Subject</label>
          <p className="text-sm text-muted-foreground">
            [Dropdown - Phase 3.3]
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pick Up Subject</label>
          <p className="text-sm text-muted-foreground">
            [Dropdown - Phase 3.3]
          </p>
        </div>
        <Button onClick={onSubmit} className="w-full">
          [Placeholder] Find Solutions
        </Button>
      </CardContent>
    </Card>
  );
}
