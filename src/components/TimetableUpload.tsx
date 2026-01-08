import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TimetableUploadProps {
  onComplete: () => void;
}

/**
 * Placeholder component for timetable JSON upload.
 * Will be implemented in Phase 3.1.
 */
export function TimetableUpload({ onComplete }: TimetableUploadProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>Upload Timetable</CardTitle>
        <CardDescription>
          Upload your master timetable JSON file to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={onComplete}>[Placeholder] Skip to New Request</Button>
      </CardContent>
    </Card>
  );
}
