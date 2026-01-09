import { useState, useEffect, useMemo } from "react";
import { FileEdit, Upload, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentSubjectInput } from "@/components/StudentSubjectInput";
import { ChangeRequestForm } from "@/components/ChangeRequestForm";
import { loadTimetable } from "@/lib/storage";
import { validateStudentSchedule } from "@/lib/validation";
import type { Subject, RequestType } from "@/types";

interface NewRequestProps {
  onSubmit: (data: {
    label: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubjects: string[];
    requestType: RequestType;
  }) => void;
  /** Initial data to pre-populate the form (for cloning) */
  initialData?: {
    label?: string;
    studentSubjectCodes: string[];
    dropSubject: string;
    pickupSubjects: string[];
    requestType?: RequestType;
  };
  /** Whether a timetable has been uploaded */
  hasTimetable?: boolean;
  /** Callback to navigate to upload page */
  onGoToUpload?: () => void;
}

/**
 * Component for creating a new change request.
 * Combines StudentSubjectInput and ChangeRequestForm.
 */
export function NewRequest({
  onSubmit,
  initialData,
  hasTimetable = true,
  onGoToUpload,
}: NewRequestProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    initialData?.studentSubjectCodes ?? []
  );
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [dropSubject, setDropSubject] = useState(
    initialData?.dropSubject ?? ""
  );
  const [pickupSubjects, setPickupSubjects] = useState<string[]>(
    initialData?.pickupSubjects ?? []
  );
  const [requestType, setRequestType] = useState<RequestType>(
    initialData?.requestType ?? "subject-change"
  );

  // Load timetable subjects on mount
  useEffect(() => {
    const timetable = loadTimetable();
    if (timetable) {
      setSubjects(timetable.subjects);
    }
  }, []);

  // Pre-populate from initialData when it changes (for cloning)
  useEffect(() => {
    if (initialData) {
      setSelectedCodes(initialData.studentSubjectCodes);
      setLabel(initialData.label ?? "");
      setDropSubject(initialData.dropSubject);
      setPickupSubjects(initialData.pickupSubjects);
      setRequestType(initialData.requestType ?? "subject-change");
    }
  }, [initialData]);

  // Handle student subject changes - reset drop/pickup when user changes subjects
  const handleSelectedCodesChange = (newCodes: string[]) => {
    setSelectedCodes(newCodes);
    // Reset drop/pickup since the student's subjects changed
    setDropSubject("");
    setPickupSubjects([]);
  };

  // Get selected Subject objects and validate
  const selectedSubjects = useMemo(() => {
    return subjects.filter((s) => selectedCodes.includes(s.code));
  }, [subjects, selectedCodes]);

  const validation = useMemo(() => {
    return validateStudentSchedule(selectedSubjects);
  }, [selectedSubjects]);

  const hasNoTimetable = subjects.length === 0;

  const handleSubmit = () => {
    // For class-change mode, pickupSubjects should be the same as dropSubject
    const finalPickupSubjects =
      requestType === "class-change" ? [dropSubject] : pickupSubjects;

    onSubmit({
      label,
      studentSubjectCodes: selectedCodes,
      dropSubject,
      pickupSubjects: finalPickupSubjects,
      requestType,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileEdit className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>New Change Request</CardTitle>
          <CardDescription>
            Enter the student's current subjects, then specify what they want to
            change
          </CardDescription>
        </CardHeader>
      </Card>

      {!hasTimetable || hasNoTimetable ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            {/* Line illustration of a timetable grid */}
            <svg
              viewBox="0 0 120 80"
              className="mx-auto h-20 w-32 text-muted-foreground/40 dark:text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="10" y="10" width="100" height="60" rx="4" />
              <line x1="10" y1="22" x2="110" y2="22" />
              <line x1="30" y1="10" x2="30" y2="70" />
              <line x1="50" y1="22" x2="50" y2="70" />
              <line x1="70" y1="22" x2="70" y2="70" />
              <line x1="90" y1="22" x2="90" y2="70" />
              <line x1="10" y1="46" x2="110" y2="46" />
              <rect x="53" y="25" width="15" height="18" rx="2" className="fill-primary/20 stroke-primary" />
              <rect x="73" y="49" width="15" height="18" rx="2" className="fill-primary/20 stroke-primary" />
            </svg>
            <div>
              <p className="font-medium">No timetable loaded</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a timetable first to create change requests.
              </p>
            </div>
            {onGoToUpload && (
              <Button onClick={onGoToUpload}>
                <Upload className="h-4 w-4" />
                Upload Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Optional label input */}
            <div className="space-y-2">
              <label htmlFor="request-label" className="text-sm font-medium">
                Request Label{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                id="request-label"
                placeholder="e.g. JD, Period 3 request, Art swap..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Do not include student identifying information. This label is
                  only for your reference.
                </span>
              </p>
            </div>

            {/* Student Subject Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Student's Current Subjects
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Enter all subjects the student is currently enrolled in
              </p>
              <StudentSubjectInput
                subjects={subjects}
                selectedCodes={selectedCodes}
                onChange={handleSelectedCodesChange}
              />
            </div>

            {/* Change Request Form */}
            {validation.valid && (
              <div className="border-t pt-6">
                <ChangeRequestForm
                  allSubjects={subjects}
                  studentSubjects={selectedSubjects}
                  dropSubject={dropSubject}
                  onDropChange={setDropSubject}
                  pickupSubjects={pickupSubjects}
                  onPickupSubjectsChange={setPickupSubjects}
                  requestType={requestType}
                  onRequestTypeChange={setRequestType}
                  onSubmit={handleSubmit}
                />
              </div>
            )}

            {/* Show prompt to complete schedule */}
            {!validation.valid && selectedCodes.length > 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                Complete the student's schedule to continue with the change
                request
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
