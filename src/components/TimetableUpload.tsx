import { useState, useRef, useEffect } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileJson,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Copy,
  Check,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { validateTimetableJSON } from "@/lib/validation";
import { saveTimetable, loadTimetable } from "@/lib/storage";
import type {
  TimetableData,
  Subject,
  AllocationBlock,
  Semester,
} from "@/types";

interface TimetableUploadProps {
  /** Called when timetable is uploaded/changed. isNewUpload is true for fresh uploads. */
  onTimetableChange?: (isNewUpload: boolean) => void;
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

const CLAUDE_PROMPT = `Your job is to extract the data in screenshots you are given into json format.


Screenshot description and context

- Screenshots show available timetabled subject blocks offered at a school.
- Subjects are split into 6 different allocations AL1-AL6. Screenshots will be of one allocation at a time.
- Some subjects run for a single semester - either semester 1 (SEM1 )or semester 2 (MID YEAR & SEM2). Other subjects run across both semesters. The length and position of the subject block within the allocation shows if it runs in semester 1, semester 2 (consider mid year as part of semester 2), or across both semesters.
- The first line within a subject block is the subject name. It will always follow the format "year level+3 letter subject code+subject class number", e.g. 10ENG1 and 10ENG2 are both year 10 english classes, just different classes with different teachers and different allocation blocks.
- The second line within a  subject block shows the class capacity, e.g. 21/25 means there are 21 students enrolled out of a max 25 student capacity for that class.
- Ignore the color coding on the subject blocks.


Instructions

- Read all of the information from this screenshot and convert it to the same json format as in this example: { "allocation": "AL6", "code": "11HIM6", "level": 11, "subject": "HIM", "class": 6, "semester": "both", "enrolled": 23, "capacity": 25 } 
- Put generated json into a separate artefact. As you're given successive screenshots in a conversation append it to the artefact.
- Make sure you actually read and parse everything in the screenshot
- NEVER just generate random data that fits the pattern. If you're unsure of something because the screenshot is unclear flag that in your reply`;

/**
 * Toggleable card showing expected JSON format and Claude extraction instructions
 */
function FormatHelpCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mx-auto max-w-2xl border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                  <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-base">Data Format Help</CardTitle>
                  <CardDescription>
                    Expected JSON format & how to extract data using AI
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="ml-2">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Expected JSON Format Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <FileJson className="h-4 w-4 text-blue-500" />
                Expected JSON Format
              </h4>
              <p className="text-sm text-muted-foreground">
                Upload a JSON file containing an array of subject objects. Each
                subject should have these fields:
              </p>
              <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto">
                <code>{`[{
  "allocation": "AL1",    // AL1-AL6
  "code": "10ENG1",       // Full subject code
  "level": 10,            // Year level (10, 11, 12)
  "subject": "ENG",       // 3-letter subject code
  "class": 1,             // Class number
  "semester": "both",     // "sem1", "sem2", or "both"
  "enrolled": 23,         // Current enrollment
  "capacity": 25          // Max capacity
}]`}</code>
              </pre>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Need to extract data from screenshots?
                </span>
              </div>
            </div>

            {/* Claude AI Extraction Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Extract Data Using Claude AI
              </h4>
              <p className="text-sm text-muted-foreground">
                If you have screenshots of allocation blocks, you can use Claude
                to extract the data into JSON format. Create a Claude Project
                with the following instructions, then upload screenshots of each
                allocation block:
              </p>

              <div className="relative">
                <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                  <code>{CLAUDE_PROMPT}</code>
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 h-8 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(CLAUDE_PROMPT);
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300">
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Create a new Claude Project at claude.ai</li>
                  <li>
                    Paste the above instructions into the project's custom
                    instructions
                  </li>
                  <li>Upload screenshots of each allocation block (AL1-AL6)</li>
                  <li>
                    Claude will generate JSON data you can download and upload
                    here
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/**
 * Component for uploading and managing timetable JSON data.
 * Validates uploaded JSON and persists to localStorage.
 */
export function TimetableUpload({ onTimetableChange }: TimetableUploadProps) {
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

    const isFirstUpload = existingData === null;

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

      // Notify parent of timetable change
      onTimetableChange?.(isFirstUpload);

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
      <div className="space-y-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
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
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <Button onClick={handleUploadClick} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Re-upload Timetable
            </Button>

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

        {/* Format Help Card */}
        <FormatHelpCard />

        {/* Timetable Grid Visualization */}
        <Card
          className={`mx-auto transition-all duration-300 ${
            showGrid ? "max-w-5xl" : "max-w-2xl"
          }`}
        >
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
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
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
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Upload button */}
          <Button onClick={handleUploadClick} className="w-full" size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Select JSON File
          </Button>

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

      {/* Format Help Card */}
      <FormatHelpCard />
    </div>
  );
}
