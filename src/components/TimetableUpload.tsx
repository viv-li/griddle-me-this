import { useState, useRef, useEffect } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { validateTimetableJSON } from "@/lib/validation";
import { saveTimetable, loadTimetable } from "@/lib/storage";
import type {
  TimetableData,
  Subject,
  AllocationBlock,
  Semester,
} from "@/types";

interface TimetableUploadProps {
  onComplete: () => void;
}

const ALLOCATIONS: AllocationBlock[] = [
  "AL1",
  "AL2",
  "AL3",
  "AL4",
  "AL5",
  "AL6",
];
const SEMESTERS: Array<{ key: Semester; label: string }> = [
  { key: "both", label: "Year-long" },
  { key: "sem1", label: "Sem 1 only" },
  { key: "sem2", label: "Sem 2 only" },
];

/**
 * Organize subjects into a grid structure by allocation and semester
 */
function organizeSubjectsByGrid(subjects: Subject[]) {
  const grid: Record<string, Record<string, Subject[]>> = {};

  for (const al of ALLOCATIONS) {
    grid[al] = { both: [], sem1: [], sem2: [] };
  }

  for (const subject of subjects) {
    grid[subject.allocation][subject.semester].push(subject);
  }

  // Sort subjects within each cell by code
  for (const al of ALLOCATIONS) {
    for (const sem of ["both", "sem1", "sem2"]) {
      grid[al][sem].sort((a, b) => a.code.localeCompare(b.code));
    }
  }

  return grid;
}

/**
 * Component for uploading and managing timetable JSON data.
 * Validates uploaded JSON and persists to localStorage.
 */
export function TimetableUpload({ onComplete }: TimetableUploadProps) {
  const [existingData, setExistingData] = useState<TimetableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing timetable data on mount
  useEffect(() => {
    const data = loadTimetable();
    setExistingData(data);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    // Check file type
    if (!file.name.endsWith(".json")) {
      setError("Please upload a JSON file");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the JSON structure
      const validation = validateTimetableJSON(data);
      if (!validation.valid) {
        setError(validation.error || "Invalid timetable data");
        return;
      }

      // Save to localStorage
      const timetableData: TimetableData = {
        subjects: data,
        uploadedAt: new Date().toISOString(),
      };
      saveTimetable(timetableData);
      setExistingData(timetableData);
      setSuccessMessage(`Successfully uploaded ${data.length} subjects`);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setError("Failed to parse JSON file. Please check the file format.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatUploadDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // If we have existing data, show the data info with re-upload option
  if (existingData) {
    const subjectGrid = organizeSubjectsByGrid(existingData.subjects);

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Timetable Loaded</CardTitle>
            <CardDescription>
              Your master timetable is ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {existingData.subjects.length}
                </span>
                <span className="text-muted-foreground">subjects loaded</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Uploaded: {formatUploadDate(existingData.uploadedAt)}
              </div>
            </div>

            {/* Success message */}
            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleUploadClick}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-upload Timetable
              </Button>
              <Button onClick={onComplete} className="flex-1">
                + Subject Change Request
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Timetable Grid Visualization */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowGrid(!showGrid)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Master Timetable Overview
                </CardTitle>
                <CardDescription>
                  All subjects organized by allocation block
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                {showGrid ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>

          {showGrid && (
            <CardContent>
              <TooltipProvider delayDuration={100}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border bg-muted/50 p-2 text-left font-medium w-24">
                          Semester
                        </th>
                        {ALLOCATIONS.map((al) => (
                          <th
                            key={al}
                            className="border bg-muted/50 p-2 text-center font-medium min-w-[120px]"
                          >
                            {al}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SEMESTERS.map(({ key, label }) => (
                        <tr key={key}>
                          <td className="border bg-muted/30 p-2 font-medium text-muted-foreground">
                            {label}
                          </td>
                          {ALLOCATIONS.map((al) => {
                            const subjects = subjectGrid[al][key];
                            return (
                              <td
                                key={`${al}-${key}`}
                                className="border p-2 align-top"
                              >
                                <div className="flex flex-wrap gap-1">
                                  {subjects.map((subject) => (
                                    <Tooltip key={subject.code}>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant={
                                            subject.enrolled >= subject.capacity
                                              ? "destructive"
                                              : "secondary"
                                          }
                                          className="text-xs font-mono cursor-help"
                                        >
                                          {subject.code}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="font-semibold">
                                          {subject.code}
                                        </p>
                                        <p>
                                          {subject.enrolled}/{subject.capacity}{" "}
                                          enrolled
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {subjects.length === 0 && (
                                    <span className="text-muted-foreground text-xs italic">
                                      —
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    ABC
                  </Badge>
                  <span>Has capacity</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-xs">
                    ABC
                  </Badge>
                  <span>At/over capacity</span>
                </div>
                <span className="sm:ml-auto">
                  Hover over a badge to see enrollment
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Initial upload state - no existing data
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
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Upload button */}
        <Button onClick={handleUploadClick} className="w-full" size="lg">
          <Upload className="mr-2 h-4 w-4" />
          Select JSON File
        </Button>

        {/* File format hint */}
        <p className="text-center text-xs text-muted-foreground">
          Expected format: Array of subject objects with allocation, code,
          level, subject, class, semester, enrolled, and capacity fields.
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
